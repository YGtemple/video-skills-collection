# 方法论总纲（Playbook）

这份文档讲清楚"一支纯代码动画是怎么从零做出来的"。目标是：任何人（以及未来的我）照着走，都能稳定产出，
而不是靠临场发挥。配套阅读：[换风格指南](restyling-guide.md)、[声音指南](sound-guide.md)、
[踩坑全集](pitfalls.md)、[自检清单](qa-checklist.md)。

---

## 0. 一句话原则

> **把"会变的东西"和"不变的东西"分开。**
> 管线（取时间 → 算画面 → 渲染帧 → 合成声音 → 自检 → 编码）永远不变；
> 会变的只有两类：**内容**（发生什么、什么节奏，写在 `timeline.js`）和**皮肤**（长什么样、什么曲风，见换风格指南）。

---

## 1. 总体架构

六个文件，单向数据流，没有环：

```
timeline.js ── T（事件时间）────────────► render.js
       │                                      │ render(t)
       └── SFX_CUES ─► sfx_cues.json          ▼
                              │          render_frames.js（playwright + 系统 Chromium）
                              ▼                    │
                           sfx.py                   ▼
                     （numpy/scipy）          frames/*.png（900 张）
                              │                    │
                              ▼                    ▼
                     sfx.wav / sfx_music.wav   metrics.py 自检
                              └──────► encode.sh（ffmpeg）◄──┘
                                            │
                                            ▼
                                       最终 MP4
```

关键：**画面和声音都由 `timeline.js` 派生**，所以它们天然同步——你不需要在两个地方对时间。

---

## 2. 第一步：写 `timeline.js`（全片唯一时间源）

### 2.1 事件表 `T`

把所有事件集中到一个对象，用语义化的键名，**带注释**：

```js
const T = {
  fps: 30, duration: 30,
  cardStamp: 1.0,     // 验证卡盖章砸下
  grid9Drop: 2.95,    // 九宫格砸下
  meterVals: [0, 37, 64, 88, 99],
  // ...
};
```

- 重复结构用"起点 + 步长 + 次数"表达（如 `drillStart / drillStep / drillCount`），不要手写一串时间。
- 想整体加快/放慢、调整某一段，只改这里。**其他文件里出现裸秒数就是 bug。**

### 2.2 音效线索 `SFX_CUES`

在同一文件用确定性循环生成音效线索数组，画面里的重复动作直接驱动音效：

```js
T.g9Clicks.forEach(t => { add(t, 'click'); add(t + 0.05, 'pop'); });
let pt = T.poleStart, interval = 0.22;
while (pt < T.poleEnd) { add(pt, 'tick'); pt += interval; interval *= 0.82; } // 越来越密
```

### 2.3 cue 的时间语义（极易错，务必遵守）

- 大多数 cue 的 `t` 是**触发时刻**（声音从这里开始）。
- `whoosh / riser / whip` 这类"先蓄力、后命中"的声音，`t` 表示**命中 / 到顶时刻**，
  并带 `dur`；`sfx.py` 会把声音**结束点**对准 `t`（`t_start = t - dur`）。
  这样画面砸中的瞬间正好是 whoosh 的落点，而不是起点。

---

## 3. 第二步：搭舞台 `index.html`

- 用 `@font-face` 声明**本地字体**（不要依赖网络字体，离线渲染才稳），`font-display:block` 避免首帧字体闪烁。
- 放一个固定尺寸的 `<svg id="stage" viewBox="0 0 1920 1080">`。
- 舞台里**不写内容**，全部交给 `render.js` 在加载时建好。

---

## 4. 第三步：`render.js` —— 一次建元素，纯函数出帧

这是工程量最大的文件，但结构非常固定。

### 4.1 加载时把所有元素建好一次

- 先在 `<defs>` 里准备好：滤镜（沸腾 / 纸纹 / 噪点）、图标 `<symbol>`、渐变等。
- 按"场景"建若干 `<g>` 分组（`gIntro / gCard / gPanel / gGrid... / gMeter / gEnd`）。
- 所有元素**一开始就全部存在于 DOM**，靠 `display` 显隐，而不是动态增删。

### 4.2 暴露纯函数 `render(t)`

```js
function render(t) {
  const frame = Math.round(t * T.fps);
  // 1. 按时间区间切场景显隐
  // 2. 只改属性 / transform / 文字内容
  // 3. 统一更新 world 根 transform（震屏 / 变焦）
}
window.render = render;
render(0); // 首帧
```

铁律：
- **同一个 `t` 必须输出同一帧**；不允许 `Math.random()`、不允许 `setTimeout`/Promise 等异步。
- 一切随机都走**确定性哈希**，以帧号（必要时加元素编号）为种子：
  ```js
  const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  ```
- `render` 只做三件事：`setAttribute`、切 `display`、改 `textContent`。

### 4.3 场景显隐

```js
show(gCard, t >= T.cardStamp && t < T.cardFling);
```

用时间区间，不要用事件标志位（标志位会破坏"纯函数、可回放"）。

### 4.4 震屏 / 变焦统一作用在 `#world` 根上

- 建一个 `<g id="world">` 包住所有场景；震屏、推镜、变焦都只改 world 的一个 transform。
- 各场景内部不要再各自做整体位移，否则叠加难以预测。
- 例：粉碎段 `world.setAttribute('transform', translate(...) scale(...) )`。

### 4.5 "沸腾"手绘抖动（boil）

朋克 / 手绘风的灵魂是线条每帧轻微抖动：

```js
// defs 里建 boil1/2/3：feTurbulence(fractalNoise) + feDisplacementMap，scale 递增
// render 每帧更新 feTurbulence 的 seed
feTurb.setAttribute('seed', frame + baseSeed);
```

- 给**每个可见场景**都挂沸腾滤镜，否则静止场景会拉满"死帧"指标。
- **seed 每帧更新**（不要每 3 帧才换——3 帧组内必然出现相同帧）。
- 不同元素用不同强度（`boil1/2/3` 的 displacement scale 不同）。

### 4.6 缓动函数（备齐，反复用）

```js
smooth   // smoothstep，匀速段落
easeOutCubic
backOut  // 到位时轻微过冲再回弹——"砸下来"的弹性，事件入场首选
```

### 4.7 质感零件（朋克拼贴的积木）

- **硬投影**：复制主体路径，填深色，`translate(dx,dy)` 垫在下面（不是模糊阴影，是实心偏移）。
- **撕纸 / 胶带**：不规则 path + 半透明米色矩形，轻微旋转。
- **纸纹**：高频 `feTurbulence` + colorMatrix 压成淡灰颗粒，整屏叠一层。
- **爆炸框 / 集中线 / 速度线**：以中心为原点，确定性生成放射线段；冲击时闪现。

---

## 5. 第四步：`render_frames.js` —— 逐帧渲染（要扛得住崩溃）

用 playwright-core 驱动**系统 Chromium**（不下载 playwright 浏览器，用 `executablePath` / `CHROMIUM_PATH` 指定）。

四个必须有的能力：

1. **断点续渲**：渲染前扫描 `frames/`，已存在的帧跳过。中断、改 bug 后重跑只补缺失帧。
2. **崩溃自动重建**：单帧失败（页面 / context / 浏览器进程死掉）时，关掉旧页面、整体重启浏览器、重试该帧（每帧多次重试）。
3. **有限并发**：多个页面并行提速，但**高倍变焦 + 沸腾滤镜时并发过高会把整个浏览器搞崩**；默认 `WORKERS=2`，可用环境变量调。
4. **字体就绪后再截**：每个新页面先 `document.fonts.load(...)` + `document.fonts.ready`，否则首帧可能退回默认字体。

浏览器启动参数（稳定性，详见踩坑）：

```
--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu
--force-color-profile=srgb --hide-scrollbars
--js-flags=--max-old-space-size=1536 --renderer-process-limit=4
```

另外：第一个工作页面负责把 `window.SFX_CUES` 导出成 `sfx_cues.json`，作为画面到声音的桥。

---

## 6. 第五步：声音 `sfx.py`（概要，详见 sound-guide.md）

- 读 `sfx_cues.json`，每个 cue 对应一个**纯代码合成函数**（click / pop / tick / whoosh / slam / buzz / riser / PA / dong / tear / ding / type / hum / glitch / room…）。
- `place(y, t_start, gain, pan)` 把声音贴进立体声总线，支持声像（pan）。
- whoosh/riser/whip 按"结束点对齐 cue.t"。
- 配乐版另叠一条按 BPM 的音乐床（不同段落换曲风 / 节奏型）。
- **定格笑点**：失败弹窗处开一个"真静音窗口"，连房间底噪都归零。
- 最后软限幅（`tanh`）并把峰值归一到 **−1dBFS**，保证不大声破音、又足够响。

---

## 7. 第六步：自检 + 编码

1. `metrics.py` 算能量指标（阈值见 qa-checklist），**不过不交付**：
   - 平均帧差 ≥ 6（画面整体在动）；
   - 连续静止帧占比 ≤ 10%（不允许长时间死画面，刻意定格除外）；
   - 黑 + 红面积 ≥ 12%（朋克风的对比度 / 情绪浓度；换风格时这个指标要按新风格重定义）。
2. `encode.sh` 用 ffmpeg 合成：H.264 High / yuv420p / AAC 48kHz 立体声 / `+faststart`。
3. `ffprobe` 核对：分辨率、帧率、帧数、编码、像素格式、采样率、声道、**精确时长**。
4. 抽关键帧做人工目检（文字不被切、数字正确、署名在）。

---

## 8. 事件"五件套" —— "看起来有劲"的通用配方

**每一个重点事件**都叠这五层（与风格无关）：

1. **主体 backOut 到位**：元素用 backOut 缓动砸入，带轻微过冲回弹；
2. **硬投影**：实心偏移阴影垫在下面，增加重量感；
3. **闪白 / 推镜**：命中瞬间整屏一帧白（或快速推近 zoom）；
4. **集中线 / 速度线**：放射线段从主体爆开，强化冲击方向；
5. **同帧音效**：slam / burst / whoosh 的落点精确对准这一帧。

缺任何一层，打击感都会明显变弱。这是复用率最高的套路，换风格时整套保留，只换每层的视觉画法。

---

## 9. 节奏与笑点设计（可复用的喜剧手法）

- **加速滴答**：某段让 tick 的间隔按比例缩短（`interval *= 0.82`），制造"越来越慌"。
- **定格 + 真静音**：失败 / 尴尬结果出现后，画面定住、声音全灭约半秒，再恢复——动画里的"冷场"笑点。
- **跳切（jump cut）**：固定间隔快速切若干近景，配合交替的 pa/slam，制造信息轰炸。
- **重复与递进**：九宫格 → 4×4 → 6×6 → 16×16，网格越来越夸张，光标越来越多，层层升级。
- **反差结尾**：前面拼命证明"我不是机器人"，结尾一笔反转成"（我是机器人。）"。

---

## 10. 生产纪律（每次都照做）

1. 先写 `timeline.js`（内容 + 节奏），再写画面，再写声音；时间只在 timeline 里。
2. 渲染关键帧时**主动断言无 NaN、收集 console error/pageerror**（SVG 对 NaN 不抛异常，只静默 warning，见踩坑）。
3. 长渲染一定走"断点续渲 + 崩溃重启"，不要假设浏览器永远不崩。
4. 改完先补渲染受影响帧 → 重跑 metrics → 再 encode，最后 ffprobe + 抽帧目检。
5. 踩到的每个坑，立刻记进 `docs/pitfalls.md`（症状 / 根因 / 对策），保持"一处真相"。
