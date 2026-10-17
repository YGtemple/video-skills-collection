# AI 视频制作技能库 · Video Skills Collection

> 一套完整的 AI 视频 / 短剧 / 动态漫制作技能包，从选题研究、剧本创作、分镜设计、美术资产、提示词生成、视频生成、质量审核到剪辑交付的全链路能力。
>
> 本仓库整理自本地 Doubao Agent 环境，**已去重、已统一格式**，任何支持 SKILL.md 规范的 Agent（Claude Code、Cursor、Codex、OpenClaw、DSH 等）都可以直接拉取使用。

---

## 🚀 快速开始

### 方式一：直接克隆

```bash
git clone https://github.com/YGtemple/video-skills-collection.git
```

然后把需要的技能目录复制到你的 agent 技能目录：

```bash
# 例如 Claude Code / 通用 agent
cp -r video-skills-collection/skills/ai-drama-master-suite ~/.agent/skills/
```

### 方式二：只拉取单个技能（推荐）

```bash
# 使用 svn 只拉一个目录
svn export https://github.com/YGtemple/video-skills-collection/trunk/skills/ai-drama-master-suite

# 或使用 degit
npx degit YGtemple/video-skills-collection/skills/ai-drama-master-suite my-skills/ai-drama-master-suite
```

### 方式三：在 Agent 里直接读

在对话里让 agent 直接读取：

```
请读取 https://raw.githubusercontent.com/YGtemple/video-skills-collection/main/skills/ai-drama-master-suite/SKILL.md 并按照它的规则帮我做短剧
```

---

## 📚 技能清单（20 个）

### 🎬 第一梯队：核心总控（先用这些）

| 技能 | 定位 | 参考文档 | 大小 | 适用场景 |
|---|---|---|---|---|
| **`ai-drama-master-suite`** | **AI 短剧全能大师**（最完整） | 43 个 | 890 KB | 短剧从 0 到 1 全流程：剧本→分镜→提示词→生成→审核→硬拼接→交付 |
| **`video-master-suite`** | **视频全能大师**（统一入口） | - | 116 KB | 六大任务类型总路由：短剧/商业视频/素材处理/视频提取/音频/图片 |
| **`drama-master`** | 短剧全能（精简版） | 7 个 | 149 KB | 同样的八大模块，主文件更轻，适合快速上手 |

> 💡 **建议先看 `ai-drama-master-suite`**，它是这套体系的"总纲"，其他技能都是它的上下游模块。

---

### ✍️ 第二梯队：剧本与故事

| 技能 | 定位 | 参考文档 | 大小 | 适用场景 |
|---|---|---|---|---|
| **`剧本创作工作室`** | 中文影视剧本工作室 | 35 个 | 712 KB | 中文剧本、竖屏短剧、动画、动态漫的故事开发与剧本诊断 |
| **`blockbuster-script-director`** | 爆款剧本改编导演 | 4 个 | 48 KB | 把小说/梗概/原创剧本改编升级为短剧、漫剧、微电影 |
| **`ai-story-vault`** | 爆款故事研究智库 | 7 个 | 99 KB | 联网检索抖音/B站/快手爆款，拆解爆款逻辑，辅助原创选题 |

---

### 🎞️ 第三梯队：分镜与提示词

| 技能 | 定位 | 参考文档 | 大小 | 适用场景 |
|---|---|---|---|---|
| **`drama-storyboard-director`** | 20年经验分镜导演 | 1 个 | 25 KB | 已有剧本 → 专业分镜脚本（16:9、无字幕、1-3秒一信息点） |
| **`script-to-shot-engine`** | 剧本转镜头引擎 | 5 个 | 79 KB | 打戏/动作/对峙文戏 → 可直接投喂 Seedance 的 Clip 提示词 |
| **`seedance-novel-storyboard`** | 小说转长视频分镜 | - | 12 KB | 小说原文 → 15秒叙事单元切割 → 连续长视频分镜 |
| **`video-prompt-master`** | 视频提示词生成大师 | 4 个 | 57 KB | 电商TVC / 宋式田园 / 中式诗意巨物 / AI 短剧四类风格提示词 |
| **`ai短剧漫剧提示词库`** | 全流程提示词库 | 14 个 | 1073 KB | 适配豆包写词 + Seedream 5.0 生图 + Seedance 2.5 生视频 |

---

### 🎨 第四梯队：美术资产与参考图

| 技能 | 定位 | 参考文档 | 大小 | 适用场景 |
|---|---|---|---|---|
| **`script-asset-master`** | 全资产大师 V3.0 | 3 个 | 60 KB | 场景+角色+道具三位一体资产提示词包 |
| **`video-ref-image-master`** | 参考图深度遵循 | 1 个 | 14 KB | 图生视频时保持角色/场景/服装一致性，解决变脸漂移 |

---

### 🎥 第五梯队：视频生成执行

| 技能 | 定位 | 参考文档 | 大小 | 适用场景 |
|---|---|---|---|---|
| **`jimeng-studio`** | 即梦AI短剧工作室 | 13 个 | 143 KB | 90秒短剧剧本→工业级分镜提示词（即梦引擎） |
| **`jimeng-short-drama-director`** | 即梦导演 | 6 个 | 99 KB | 批量生成调度、逐镜审核、一致性管理、后期合成指导 |
| **`ai-drama-video-production`** | 动态漫/短剧视频制作 | - | 51 KB | 校园/青春/剧情类动态漫逐片段生成 |
| **`video-generation-preferences`** | 用户硬约束 | - | 6 KB | 每次生成视频前必读的个人偏好配置 |

---

### 🎬 第六梯队：后期与交付

| 技能 | 定位 | 参考文档 | 大小 | 适用场景 |
|---|---|---|---|---|
| **`jianying-editor`** | 剪映自动化剪辑 | 10 个 | 9.1 MB | 剪映桌面自动化、草稿 JSON、批量导出、说话人剪辑、字幕、TTS |
| **`shortfilm-assembly-line`** | 主旋律短片流水线 | 3 个 | 16 KB | 革命历史题材：考据→剧本→资产→视频→自检→剪辑→交付 |
| **`pure-code-animation`** | 代码动画 | 6 个 | 390 KB | 用代码生成动画（非 AI 视频路线） |

---

## 🗂️ 目录结构

```
video-skills-collection/
├── README.md                    ← 本文件
├── INDEX.md                     ← 详细索引（含每个技能的全部参考文档清单）
├── skills/
│   ├── ai-drama-master-suite/   ← 短剧总控
│   │   ├── SKILL.md             ← 主文件（规则+索引）
│   │   └── references/          ← 43 个方法论文档
│   ├── video-master-suite/
│   ├── drama-master/
│   └── ...（共 20 个技能）
└── LICENSE
```

---

## 🔧 推荐使用路径

### 路径 A：做一条完整短剧（从 0 到 1）

```
ai-story-vault（找爆款选题）
    ↓
ai-drama-master-suite / 剧本创作工作室（写剧本）
    ↓
drama-storyboard-director（拆分镜）
    ↓
script-asset-master（生成美术资产）
    ↓
video-ref-image-master（锁一致性）
    ↓
ai-drama-master-suite 模块3（写提示词）
    ↓
ai-drama-master-suite 模块4（生成视频）
    ↓
jianying-editor（剪辑交付）
```

### 路径 B：只做分镜和提示词

```
剧本 → drama-storyboard-director → script-to-shot-engine → 提示词
```

### 路径 C：用即梦引擎做

```
jimeng-studio（剧本+资产+分镜） → jimeng-short-drama-director（执行+审核）
```

---

## ⚠️ 使用前必读

### 1. 这些技能有强依赖关系

`ai-drama-master-suite` 的 SKILL.md 里明确要求**先读 `script-asset-master`** 才能进入资产环节。单独拉一个技能可能跑不通，**建议至少一起拉 `ai-drama-master-suite` + `script-asset-master`**。

### 2. 门控机制

大部分技能采用**逐门确认**的设计：每完成一个阶段会停下来给选项，等用户确认才继续。这是为了防止 AI 一次性跑完整个流程产出垃圾。

如果你希望它自动跑完，需要在对话里明确说"不用门控，直接做完"。

### 3. 本地路径需要调整

原始技能里有些硬编码的本地路径（如 `/home/user/Doubao/chats/...`），换环境后可能失效。遇到路径错误时，让 agent 忽略或改用相对路径即可。

### 4. 关于依赖的外部服务

部分技能依赖特定平台 API：
- `jianying-editor` 依赖剪映桌面版 + 自动化工具
- `ai-story-vault` 需要联网搜索能力
- 视频生成类技能默认面向 Seedance 2.5 / 即梦 / 可灵

---

## 📊 技能统计

| 指标 | 数值 |
|---|---|
| 技能总数 | 20 个 |
| 参考文档总数 | 约 190 个 Markdown |
| 仓库总大小 | 约 12 MB |
| 覆盖环节 | 选题 → 剧本 → 分镜 → 资产 → 提示词 → 生成 → 审核 → 交付 |
| SKILL.md 规范 | 是（YAML frontmatter + name/description） |

---

## 📄 License

各技能版权归原作者所有。本仓库仅做整理与去重，便于跨 agent 复用。

---

**维护**：本仓库由整理脚本从本地 Doubao 环境导出，如技能有更新可重新导出覆盖。
