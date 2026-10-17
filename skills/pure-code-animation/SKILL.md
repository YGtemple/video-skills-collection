---
name: pure-code-animation
description: >-
  用纯代码制作 30 秒、1920×1080、多风格动画短片：画面 HTML+SVG+JS、无头 Chromium 逐帧截图，
  声音 Python(numpy/scipy) 合成、ffmpeg 编码；不使用任何图像/视频/音乐生成式模型或外部素材
  （中文人声旁白可用 TTS，是唯一例外）。用于：做一支纯代码动画、把同一引擎换成新视觉风格或新题材、
  给动画加中文人声解说、批量产出 30 秒讽刺/科普短片。触发词：纯代码动画、用代码做动画/视频、
  code animation、fifi 动画、SVG 动画成片、换风格/换皮肤、30 秒动画、纯代码短片。
---

# 纯代码动画（Pure-Code Animation）

把"会变的"和"不变的"分开：

- **管线永远不变**：取时间 → 算画面 → 逐帧截图 → 合成声音 → 自检 → ffmpeg 编码。
- **会变的只有两类**：**内容**（发生什么、什么节奏，写在 `timeline.js`）和
  **皮肤**（色板 / 字体 / 造型 / 质感 / 曲风）。
- 画面和声音都由 `timeline.js` 派生，天然同步，不需要在两个地方对时间。

灵感来源与原始提示词见 [references/fifi-original-prompt.md](references/fifi-original-prompt.md)。

---

## 硬规格（每支片都必须满足）

- 横屏 **16:9，1920×1080，30fps，正好 900 帧，时长精确 30.000000s**。
- 视频 **H.264 / profile High / yuv420p**；音频 **AAC / 48kHz / 立体声**；`-movflags +faststart`（moov 前置）。
- 声音峰值归一到 **−1dBFS**，不破音；**不烧逐句字幕**（标题 / 横幅 / 印章 / 插卡属画面本体，可保留）。
- 片尾署名：**"由 Doubao 在30秒内用纯代码制作完成"**。
- 全程不用生成式图像 / 视频 / 音乐模型、不用外部素材；**旁白 TTS 是唯一例外**。

---

## 标准工作流（端到端）

1. **调研选题**：抓当下高共鸣情绪（社交平台热搜 / 新闻），适配"层层升级 + 结尾反转"结构；
   科普向则用"打破误解 → 展示 → 正向点题"。
2. **写 `timeline.js`**：集中事件表 `T`（语义键名 + 注释，重复结构用"起点+步长+次数"），
   并确定性生成音效线索 `SFX_CUES`。**其他文件不写裸秒数。**
3. **搭 `index.html`**：本地 `@font-face`（`font-display:block`）+ 固定 `#stage` viewBox。
4. **写 `render.js`**：加载时一次性建好所有 `<g>` 元素（靠 `display` 显隐，不动态增删）；
   暴露纯函数 `render(t)`，只做 setAttribute / 切 display / 改 textContent。
5. **逐帧渲染**：`render_frames.js` 用 playwright-core 驱动**系统 Chromium**（`CHROMIUM_PATH` 指定），
   必须有断点续渲、崩溃整体重启、有限并发（默认 WORKERS=2）、字体就绪后再截。
6. **合成声音**：`sfx.py` 读 `sfx_cues.json`，numpy/scipy 合成音效与配乐；需要时叠加 TTS 旁白（下节）。
7. **自检**：`metrics.py` 跑该风格指标 + ffprobe 九项 + 关键帧联系表目检，**不过不交付**。
8. **编码**：`encode.sh`（Linux/macOS）或等价 ffmpeg 命令（Windows 用 PowerShell）。

---

## 开始一支新片

1. 复制 [assets/engine-template/](assets/engine-template/) 为新片目录，起一个风格 / 题材 slug 名。
2. 安装依赖：`npm i`（playwright-core）；设 `CHROMIUM_PATH` 指向系统 Chrome/Chromium。
3. 把字体放进 `fonts/`（模板随附 Anton、Permanent Marker；中文字体见下）。
4. 按上面工作流改 `timeline.js` / `render.js` / `sfx.py`，先渲染少量关键帧验证，再全量。
5. 渲染 → 声音 → 指标 → 编码 → 目检 → 交付。

**字体**：务必走本地、渲染前等 `document.fonts.ready`。大体积中文字体（ZCOOL 黄油体 / 站酷快乐体 /
霞鹜文楷 / Noto 等）不随模板打包，按目标风格放入 `fonts/` 并在 `index.html` 声明。

---

## 换风格（做别的视觉风格）

皮肤六维度：**色板、字体、造型词汇、投影/质感、沸腾 boil、音乐曲风**。
先把散落颜色收敛为 `render.js` 顶部的 `PALETTE` 常量，再逐项替换。

**关键：每换一套皮肤，能量指标必须按新风格重定义**（高留白、暗底、黑白、定格、像素各有口径），
不能把上一种风格的阈值直接搬过来。完整六维度改法、**20 支 / 18 风格已验证目录与指标口径**见
[references/restyling-guide.md](references/restyling-guide.md)。

- 手绘类（朋克 / 水彩）保留沸腾；干净类（扁平 / 网格 / 赛博）关闭 boil，用真实 UI 运动补偿。
- 高留白 / boil 关闭 → 帧差用**内容区口径** + 真死帧兜底；暗底 → NAA；黑白 → 配准扣颗粒；
  定格 → pose 采样；网点类 → 全分辨率口径。

---

## 加中文人声旁白（可选，自片11起）

- 文案克制：开场交代处境、转折帮跟上、结尾点题；**不把画面念满、不剧透笑点**。
- 用 `text_to_audio_plus` 逐句生成、按风格选音色；该工具在子代理不可用时由 Organizer 亲自生成，
  **禁用 edge-tts / SAPI 顶替**。
- 人声居中，有人声段配乐 / 音效自动 **ducking 约 −9dB**；偏长句优先以紧凑语速重生成而非 atempo。
- 交付**旁白版（主推）+ 无旁白配乐版（备用）**。详见 [references/sound-guide.md](references/sound-guide.md) 第 7 节。

---

## 自检与交付

按 [references/qa-checklist.md](references/qa-checklist.md) 逐项打勾：ffprobe 九项、风格指标、
联系表目检（文字不裁切、数字正确、署名在）、声音峰值与旁白可懂度、跨平台播放。

成片按内容 + 编号归档（本地，如 `…/05_成片/序号_片名_版本.mp4`），并维护项目 README 清单。

---

## 合规约束（务必遵守）

- **不启动、不使用用户机器上的任何 VPN / 代理软件，不改系统代理**；需 VPN 才能做的步骤直接跳过并注明。
- **不依赖 / 不强制 GitHub 推送**；是否本地提交按用户要求。
- 产物默认放用户指定的数据盘（不占用系统盘）。

---

## 文件地图

- [references/playbook.md](references/playbook.md)：完整方法论（架构 / 五件套 / 喜剧手法 / 生产纪律）。
- [references/restyling-guide.md](references/restyling-guide.md)：换风格六维度 + 20 支风格库与指标口径。
- [references/sound-guide.md](references/sound-guide.md)：音效 / 配乐合成 + 旁白 TTS 与 ducking。
- [references/pitfalls.md](references/pitfalls.md)：踩坑 P1–P17（症状 / 根因 / 对策）。
- [references/qa-checklist.md](references/qa-checklist.md)：交付前自检清单。
- [references/fifi-original-prompt.md](references/fifi-original-prompt.md)：原始灵感提示词。
- [assets/engine-template/](assets/engine-template/)：可复制的引擎脚手架（含 render / sfx / metrics / encode）。
