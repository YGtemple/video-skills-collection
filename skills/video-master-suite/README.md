# 🎬 Video Master Suite（视频全能大师）

> 整合所有视频相关 AI 技能的统一大技能包 —— 一个入口，覆盖从想法到成片的全链路。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Skill Type](https://img.shields.io/badge/Doubao%20Skill-Video%20Suite-blue)]()
[![Sub-skills](https://img.shields.io/badge/子技能-20%2B-orange)]()

## 📖 项目简介

`video-master-suite` 是一个为豆包（Doubao）AI 助手设计的**统一视频制作大技能包**。它将 20+ 个分散的视频相关技能（短剧创作、视频生成、后期剪辑、音频处理、图片资产、在线视频提取等）整合为一个智能入口，自动识别任务类型并按标准工作流调度子技能。

无论你是想做一部 90 秒短剧、一条产品广告、剪辑一段素材，还是下载分析在线视频，这个技能包都能自动规划「第一步做什么、第二步调用哪个技能、哪些技能可以融合串联」。

## ✨ 核心特性

- **六大任务类型自动路由**：短剧剧情 / 商业视频 / 素材后期 / 在线视频提取 / 音频制作 / 图片资产
- **标准九步工作流**：需求澄清 → 剧本 → 分镜 → 资产 → 提示词 → 生成 → 审核 → 后期 → 交付
- **20+ 子技能统一调度**：每一步明确标注调用哪个子技能，无需手动切换
- **技能融合与去重**：7 组可融合组合 + 5 组重叠技能去重，避免重复调用
- **全局铁律统一**：Seedance 2.5 优先、提示词原文透传、强制图生视频 @艾特、内嵌预览交付
- **MediaKit 49 工具速查**：editing / video / audio / image 四域工具完整映射

## 📦 包含的子技能

### 短剧与剧情创作
| 技能 | 职责 |
|---|---|
| `ai-drama-master-suite` | 短剧全链路 8 模块（剧本→分镜→提示词→生成→审核→后期→交付） |
| `doubao-creative-drama` | 短篇短剧规划与资产分批确认 |
| `jimeng-studio` | 即梦平台前期（剧本→资产→分镜→提示词） |
| `jimeng-director` | 即梦平台后期（生成调度→质量审核→一致性→合成） |
| `ai-drama-video-production` | 校园/青春动态漫逐片段制作 |

### 视频生成与引擎
| 技能 | 职责 |
|---|---|
| `doubao-creative-video` | 通用商业视频（UGC / Marketing / Corporate） |
| `seedance-25` | Seedance 2.5 引擎硬约束（原文透传 + 直接生成、生成后成片与完整提示词必看） |
| `seedream-50` | Seedream 5.0 Pro 图片生成 |
| `seed-audio` | 音频生成（T2A / A2A） |
| `image-reference` | 图生视频参考图深度遵循 |

### 媒体处理工具集（MediaKit）
| 技能 | 工具数 | 职责 |
|---|---|---|
| `byted-mediakit-editing` | 20 | 裁剪/拼接/调速/滤镜/字幕/混音 |
| `byted-mediakit-video` | 29 | 增强/检测/抽帧/抠像/拆条/转码 |
| `byted-mediakit-audio` | 4 | 人声分离/转码/端点检测 |
| `byted-mediakit-image` | 21 | 压缩/抠图/OCR/增强 |

### 其他
| 技能 | 职责 |
|---|---|
| `doubao-video-extract` | 在线视频下载/转写/画面理解 |
| `jianying-editor` | 剪映 Python API 专业剪辑 |
| `doubao-creative-design` | 图片创意设计（角色/场景/封面） |

## 🚀 安装方法

### 方式一：手动安装（推荐）

1. 克隆或下载本仓库
2. 将 `SKILL.md` 复制到豆包用户技能目录：
   - **Windows**: `%USERPROFILE%\AppData\Local\Doubao\User Data\Profile 2\.doubao\agent_mode\workspace\.user_skills\video-master-suite\`
   - **macOS**: `~/.doubao/agent_mode/workspace/.user_skills/video-master-suite/`
3. 重启豆包或刷新技能列表
4. 在对话中输入视频相关需求，技能会自动触发

### 方式二：Git 克隆

```bash
# 进入用户技能目录
cd "%USERPROFILE%\AppData\Local\Doubao\User Data\Profile 2\.doubao\agent_mode\workspace\.user_skills"

# 克隆仓库
git clone https://github.com/your-username/video-master-suite.git
```

## 🎯 使用方法

### 快速开始

直接用自然语言描述你的视频需求，技能会自动识别类型并启动对应工作流：

```
"帮我做一个90秒的都市悬疑短剧"
→ 自动进入任务A，从Step 1需求澄清开始

"帮我生成一条15秒的产品广告视频"
→ 自动进入任务B，商业视频工作流

"帮我把这几段视频剪辑到一起，加字幕"
→ 自动进入任务C，素材后期工作流

"下载这个B站视频并提取字幕"
→ 自动进入任务D，视频提取工作流
```

### 标准九步工作流（短剧类）

```
Step 1  需求澄清与规划   → doubao-creative-drama
Step 2  剧本创作         → ai-drama-master-suite + jimeng-studio
Step 3  分镜设计         → ai-drama-master-suite + jimeng-studio
Step 4  资产与参考图准备 → doubao-creative-design + image-reference
Step 5  提示词生成       → ai-drama-master-suite + seedance-25
Step 6  视频生成执行     → ai-drama-master-suite + jimeng-director + seedance-25
Step 7  质量审核与一致性 → ai-drama-master-suite + byted-mediakit-video
Step 8  后期合成         → byted-mediakit-editing + jianying-editor + seed-audio
Step 9  成片交付         → byted-mediakit-video + doubao-creative-design
```

### 提供人物图片时

如果你提供了角色参考图片，技能会自动：
1. 建立参考图资产表（一人一角色，不重复使用）
2. 在提示词中用 `@图片N` 格式艾特对应人物
3. 强制使用图生视频模式，不使用纯文字生成
4. 直接生成，生成后把成片 + 完整脚本/分镜 + 完整提示词一起给你看，你认可才生成下一个

## 📐 全局铁律

所有子技能统一遵守以下规则：

1. **Seedance 2.5 最高优先级** — 所有视频生成默认使用 Seedance 2.5，提示词原文透传不改写
2. **直接生成、成片与完整提示词必看** — 不设生成前阻断；每个视频生成后把成片 + 完整脚本/分镜 + 完整提示词一起给你看，你认可才生成下一个（提示词完整透明、不省略）
3. **强制图生视频 + @艾特** — 用户提供的人物图片必须 @艾特，不使用纯文字生成
4. **内嵌预览播放器交付** — 每个视频生成后以内嵌预览形式交付，用户确认后再继续
5. **台词写进提示词** — 有台词的镜头直接写进 prompt，不使用 TTS 单独合成
6. **分步执行不跳步** — 每个阶段完成后停下等待确认
7. **合规安全** — 暴力/伤害画面经过合规替换，逐镜人工审核

## 📁 项目结构

```
video-master-suite/
├── README.md                    # 项目说明（本文件）
├── SKILL.md                     # 主技能文件（豆包读取的核心文件）
├── LICENSE                      # MIT 开源协议
├── .gitignore                   # Git 忽略配置
├── docs/
│   ├── architecture.md          # 架构设计文档
│   ├── skill-mapping.md         # 子技能详细映射表
│   └── faq.md                   # 常见问题
├── examples/
│   └── example-workflow.md      # 完整工作流示例
└── assets/
    └── workflow-diagram.png     # 工作流流程图（可选）
```

## 🤝 贡献指南

欢迎贡献！如果你想添加新的子技能集成、优化工作流或修复问题：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献方向

- [ ] 新增子技能集成（如更多视频平台、更多剪辑工具）
- [ ] 优化工作流步骤和决策树
- [ ] 添加更多完整工作流示例
- [ ] 补充 MediaKit 工具的使用案例
- [ ] 多语言文档支持

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## ⚠️ 免责声明

- 本技能包仅用于合法的视频创作与媒体处理
- 不包含、不推荐、不指导任何去水印操作
- 生成内容请遵守各平台规则和相关法律法规
- AI 生成内容可能存在不完美之处，建议人工审核后使用

## 📮 联系方式

- 问题反馈：[GitHub Issues](https://github.com/your-username/video-master-suite/issues)
- 讨论交流：[GitHub Discussions](https://github.com/your-username/video-master-suite/discussions)

---

*如果这个技能包对你有帮助，欢迎给个 ⭐ Star！*
