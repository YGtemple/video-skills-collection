# 子技能详细映射表

> ⛔ **以 SKILL.md「阶段门控总则」为准**：本映射表的「触发 / 工作流位置」仍有效，但**路由不自动端到端跑到底**——每个子技能结束即暂停、给选项、等用户确认后再路由；且**美术资产 AI 可直接调用文生图生成，但每张/批出图必须立即交付用户审核（成图+所用提示词+三维），通过才定稿 @**（用户自制为可选）。下表中 `doubao-creative-design` / `seedream-50` 的「生成图片 / 逐张交付」能力，由 AI 直接出图、逐张交付用户审核；路由层在资产阶段另经 `script-asset-master` 给「两套提示词+三维+清单顺序+建议」。视频生成（seedance-25 等）仍由 AI 执行，**不设生成前阻断：直接生成，生成后成片+完整脚本/分镜+完整提示词一起给用户看，用户认可才生成下一个**。

本文档列出 `video-master-suite` 整合的所有子技能及其详细映射关系。

## 一、短剧与剧情创作类

### 1.1 ai-drama-master-suite

| 属性 | 说明 |
|---|---|
| **定位** | 短剧全链路主框架（8模块） |
| **触发** | 短剧、微电影、动态漫全流程制作 |
| **核心模块** | 剧本创作 / 分镜设计 / 提示词生成 / 视频生成 / 质量审核 / 一致性管理 / 后期合成 / 成片交付 |
| **工作流位置** | 任务A Step 2-9 主技能 |
| **关键规则** | Seedance 2.5 优先、提示词原文透传、强制图生视频@艾特、内嵌预览交付、台词写进提示词 |
| **时长支持** | 90秒四幕结构 / 5分钟五阶段 |
| **风格引擎** | 横屏电影质感（阿莱65）/ 竖屏Seedance / 通用竖屏 |

### 1.2 doubao-creative-drama

| 属性 | 说明 |
|---|---|
| **定位** | 短篇短剧规划与资产分批确认 |
| **触发** | 单集5-10分钟以内短篇制作 |
| **核心阶段** | planner → scriptwriter → storyboard → assets → frame → prompt |
| **工作流位置** | 任务A Step 1 主技能 |
| **关键规则** | 资产分批送审（主角→配角→场景全景→场景视角）、逐个生成逐个审核（禁止未认可批量自动出片）、图片即时交付审核 |
| **片段时长** | 项目侧锁定15秒 |

### 1.3 jimeng-studio

| 属性 | 说明 |
|---|---|
| **定位** | 即梦平台前期制作（剧本→提示词） |
| **触发** | 即梦AI短剧、90秒短视频脚本、即梦提示词 |
| **核心阶段** | 剧本创作 → 资产标准化 → 素材锚定 → 分镜大纲 → 单镜提示词 |
| **工作流位置** | 任务A Step 2-5 辅助技能（即梦平台适配） |
| **风格引擎** | 横屏电影质感（16:9/21:9）/ 竖屏Seedance末世水世界（9:16）/ 通用竖屏（9:16） |
| **关键规则** | 90秒四幕时间锁、合规替换词库、竖屏单镜仅一个核心动作 |

### 1.4 jimeng-director

| 属性 | 说明 |
|---|---|
| **定位** | 即梦平台后期制作（生成→交付） |
| **触发** | 批量生成即梦视频、审核AI短剧、剪辑合成 |
| **核心阶段** | 生成执行管理 → 逐镜质量审核 → 多镜一致性管理 → 后期合成与交付 |
| **工作流位置** | 任务A Step 6-8 辅助技能（即梦平台适配） |
| **关键规则** | 七维审核、四维一致性追踪、逐个生成逐个审核（禁止未认可批量自动出片）、每镜最多重试3次 |

### 1.5 ai-drama-video-production

| 属性 | 说明 |
|---|---|
| **定位** | 校园/青春动态漫逐片段制作 |
| **触发** | 基于角色设定图和分镜脚本的校园/青春/剧情类动态漫 |
| **核心能力** | 参考图驱动、逐片段确认、防漂移/防多手约束、无BGM无字幕 |
| **工作流位置** | 任务A特定题材（校园青春）Step 4-6 |
| **关键规则** | 每片段至少2张参考图、构图安全区预留、防多人漂移、防多手约束 |

## 二、视频生成与引擎类

### 2.1 doubao-creative-video

| 属性 | 说明 |
|---|---|
| **定位** | 通用商业视频生成主入口 |
| **触发** | 产品广告、UGC口播、企业宣传、视频编辑、media_to_video |
| **核心路由** | UGC口播 / Marketing无分镜 / Corporate商务 / 媒体素材路由 |
| **工作流位置** | 任务B全流程主技能 |
| **关键规则** | 产品/企业资料门控、默认分镜表不分镜图；视频直接生成，生成后成片+完整脚本/提示词一起给用户看、认可才下一个 |

### 2.2 seedance-25

| 属性 | 说明 |
|---|---|
| **定位** | Seedance 2.5 引擎硬约束技能 |
| **触发** | 使用Seedance 2.5生成视频、原文透传提示词 |
| **核心规则** | model_version固定seedance_2.5、提示词逐字原文透传、直接生成、生成后成片+完整脚本/提示词必看 |
| **工作流位置** | 任务A/B Step 6/4 所有视频生成的引擎约束 |
| **时长** | 5-30秒整数 |
| **比例** | 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 |

### 2.3 seedream-50

| 属性 | 说明 |
|---|---|
| **定位** | Seedream 5.0 Pro 图片生成 |
| **触发** | 用户明确要求使用5.0 Pro生成/编辑图片 |
| **核心规则** | Prompt改写组装后接力doubao-creative-design、显式传入modelversion=seedream_5.0_pro |
| **工作流位置** | 任务F，用户指定5.0 Pro时 |

### 2.4 seed-audio

| 属性 | 说明 |
|---|---|
| **定位** | 自然语言音频生成 |
| **触发** | 生成音频、配音、音效、BGM、多角色对话音频 |
| **两种模式** | T2A（无参考音频）/ A2A（有@音频N指代） |
| **工作流位置** | 任务E，任务A Step 8音频补充 |
| **关键规则** | 用户描述原样保留、复杂场景单次调用不拆分 |

### 2.5 image-reference

| 属性 | 说明 |
|---|---|
| **定位** | 图生视频参考图深度遵循 |
| **触发** | 提供参考图片要求保持角色/场景/服装一致性 |
| **核心能力** | 参考图分类优先级、深度拆解清单、提示词结构化、跨镜一致性保障 |
| **工作流位置** | 任务A Step 4-5，所有图生视频场景 |
| **参考图分类** | 角色设定图P0 / 场景图P0 / 道具图P1 / 分镜构图P1 / 风格参考P2 |

## 三、MediaKit 媒体处理工具集

### 3.1 byted-mediakit-shared（入口）

| 属性 | 说明 |
|---|---|
| **定位** | MediaKit 统一入口 |
| **触发** | 任何mediakit-cli调用前 |
| **核心能力** | 能力导航、CLI使用规范、JSON参数传参、异步任务查询 |
| **工作流位置** | 任务C/E/F，调用任何mediakit工具前必须先读 |

### 3.2 byted-mediakit-editing（20工具）

| 类别 | 工具 |
|---|---|
| 裁剪拼接 | trim-video, crop-video, concat-video, stitch-video |
| 调速音量 | adjust-video-speed, adjust-video-volume, adjust-audio-speed |
| 滤镜特效 | apply-video-filter, apply-camera-motion |
| 字幕 | add-subtitle-to-video |
| 音频 | extract-audio, mix-audio, mux-audio-video, concat-audio, trim-audio, fade-audio, fade-video-audio |
| 其他 | flip-video, rotate-video, extract-animated-image |

### 3.3 byted-mediakit-video（29工具）

| 类别 | 工具 |
|---|---|
| 画质 | enhance-video, enhance-video-fast, enhance-video-generative, assess-video-quality, martencode-video |
| 字幕 | asr-subtitles, video-ocr, erase-video-subtitle, erase-video-subtitle-pro |
| 拆条分析 | analyze-video-highlights, analyze-video-storyline, generate-highlights-microdrama, generate-highlights-minigame, generate-highlights-movie, drama-script, drama-recap, drama-recap-vertical |
| 分段 | segment-scenes, semantic-segment |
| 抠像 | matte-portrait-video, matte-greenscreen-video |
| 隐私 | face-blur-video |
| 转码 | transcode-video, remux-video |
| 其他 | extract-frames, probe-video-metadata, video-understand-router, add-video-invisible-watermark, extract-video-invisible-watermark |

### 3.4 byted-mediakit-audio（4工具）

| 工具 | 说明 |
|---|---|
| separate-voice | 人声背景声分离 |
| detect-voice-activity | 语音端点检测 |
| transcode-audio | 音频转码 |
| probe-audio-metadata | 音频媒资探测 |

### 3.5 byted-mediakit-image（21工具）

| 类别 | 工具 |
|---|---|
| 压缩 | slim-image, compress-image, resize-image |
| 增强 | enhance-image, sharpen-image, adjust-image-color |
| 抠图 | remove-image-background |
| OCR/擦除 | image-ocr, erase-image |
| 隐私 | face-blur-image, mosaic-image, gaussian-blur-image |
| 裁剪 | crop-image, smart-crop-image, rotate-image, flip-image, round-corner-image |
| 其他 | add-image-watermark, evaluate-image-quality, probe-image-metadata, invert-image |

## 四、其他技能

### 4.1 doubao-video-extract

| 属性 | 说明 |
|---|---|
| **定位** | 在线视频下载/转写/理解 |
| **触发** | 视频链接、下载、字幕提取、逐字稿、画面分析 |
| **支持平台** | 快手、B站、AcFun、芒果TV、梨视频、微博、X、Facebook、Instagram、TikTok、Twitch、YouTube |
| **工作流位置** | 任务D全流程主技能 |
| **核心路由** | 只下载 → media-mode video / 要字幕 → run-lark / 要画面分析 → 抽帧取证 |

### 4.2 jianying-editor

| 属性 | 说明 |
|---|---|
| **定位** | 剪映 Python API 专业剪辑 |
| **触发** | 复杂多轨剪辑、动效、模板、录屏、智能变焦、影视解说 |
| **核心能力** | 素材导入、字幕生成、关键帧动画、滤镜转场、录屏、Web动效、TTS配音、批量导出 |
| **工作流位置** | 任务C复杂剪辑，任务A Step 8备选 |
| **关键规则** | 业务脚本放在项目根目录（不放在Skill目录）、默认横屏1920x1080 |

### 4.3 doubao-creative-design

| 属性 | 说明 |
|---|---|
| **定位** | 图片创意设计主入口 |
| **触发** | 生成图片、海报、封面、角色设定、场景图、关键帧 |
| **核心能力** | 产物路由、澄清门禁、核心资产管理、T2I/I2I、逐张present_files交付 |
| **工作流位置** | 任务F主技能，任务A Step 4/9 |
| **关键规则** | 生成一张立即交付用户审核一张、生图前必须过澄清门禁、已有参考图禁止用纯文生图替代；⛔ 以阶段门控总则为准：在本技能路由层中，AI 可直接调用出图，但每张/批成图+提示词+三维必交付用户审核、通过才定稿 @ |

## 五、技能调用优先级

当多个技能都能处理同一需求时，按以下优先级选择：

```
短剧/剧情需求：
  ai-drama-master-suite > doubao-creative-drama > jimeng-studio > ai-drama-video-production

视频生成：
  seedance-25（引擎约束）+ 对应创作技能 > 直接调用image_to_video

后期处理：
  byted-mediakit-editing（简单操作）> jianying-editor（复杂多轨）

图片生成（⛔ 美术资产 AI 可直接生成，但每张/批出图必交付用户审核、通过才定稿 @）：
  doubao-creative-design > seedream-50（用户指定5.0 Pro时）

音频：
  seed-audio（生成）> byted-mediakit-audio（处理）> byted-mediakit-editing（编辑）
```
