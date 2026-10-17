# 架构设计文档

> ⛔ **以 SKILL.md「阶段门控总则」为准**：本架构的「分层路由 / 九步状态机」仍成立，但**不再自动端到端跑完整条链**——每个节点（停止点）结束即 ⛔ 暂停、给下一步选项、等用户确认后再路由；且 **Step 4 资产阶段，路由层（含 `doubao-creative-design` / `seedream-50` / `image_gen`）可直接调用文生图生成美术资产，但每张/批出图必须立即交付用户审核（成图+所用提示词+三维），通过才定稿 @**（用户自制为可选路径）；视频生成（Layer 4 的 image_to_video / text_to_video）仍由 AI 执行，**不设生成前阻断：直接生成，生成后把成片+完整脚本/分镜+完整提示词一起给用户看，用户认可才生成下一个**。下文凡涉及「自动连续 / 出图 / 生成前确认」的旧表述，均以本门控总则为准。

## 一、整体架构

`video-master-suite` 采用**分层架构**，从用户输入到最终交付分为四层：

```
┌─────────────────────────────────────────────────────┐
│                   用户输入层                          │
│        自然语言需求 / 已有素材 / 参考图片              │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 入口路由层（Layer 1）                  │
│    六大任务类型识别 + 起始阶段判断 + 缺失信息澄清       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                工作流引擎层（Layer 2）                 │
│   标准九步工作流 / 商业视频六步 / 后期处理决策树等      │
│   每步明确：调用哪个子技能 + 输入 + 输出 + 停止点       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                子技能调度层（Layer 3）                 │
│   20+ 子技能统一调用 + 融合串联 + 重叠去重 + 参数传递   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                工具执行层（Layer 4）                   │
│   image_to_video / text_to_video / mediakit-cli /    │
│   jianying API / image_gen / audio_gen 等底层工具     │
└─────────────────────────────────────────────────────┘
```

## 二、入口路由层设计

### 2.1 六大任务类型判定

| 任务类型 | 触发关键词 | 工作流 |
|---|---|---|
| A. 短剧/剧情片 | 短剧、微电影、剧情片、动态漫、动画短片、90秒、剧本、分镜、角色设定 | 九步标准工作流 |
| B. 商业视频 | 产品广告、商品广告、UGC、口播、带货、信息流、企业宣传、品牌片、TVC | 六步商业工作流 |
| C. 素材后期 | 剪辑、拼接、裁剪、调速、滤镜、字幕、混音、增强画质、转码、抠像、拆条 | 工具路由决策树 |
| D. 在线视频提取 | 下载视频、提取字幕、转写、逐字稿、视频总结、画面分析、B站/抖音链接 | 三步提取工作流 |
| E. 音频制作 | 生成音频、配音、音效、背景音乐、BGM、人声分离、音频转码 | 生成+处理两阶段 |
| F. 图片资产 | 角色设定图、三视图、场景图、封面图、关键帧、海报、生图 | 资产分批确认流程 |

### 2.2 起始阶段判断

根据用户已有素材，自动跳过已完成阶段：

| 用户已有 | 起始步骤 |
|---|---|
| 只有想法/题材 | Step 1 需求澄清 |
| 已有剧本 | Step 3 分镜设计 |
| 已有分镜 | Step 4 资产准备 |
| 已有提示词 | Step 6 视频生成 |
| 已有视频片段 | Step 7 质量审核 |
| 有多段素材 | Step 8 后期合成 |

## 三、工作流引擎层设计

### 3.1 短剧九步工作流状态机

```
[需求澄清] → [剧本] → [分镜] → [资产] → [提示词] → [生成] → [审核] → [后期] → [交付]
     │          │        │        │         │         │        │        │
     └──────────┴────────┴────────┴─────────┴─────────┴────────┴────────┘
                         每个节点都是停止点（等待用户确认）
```

**关键设计原则**：
- 每个步骤完成后必须停止，等待用户明确确认后才进入下一步
- 上游产物是下游的输入，不允许跳步
- 任何步骤失败可回退到上一步调整

### 3.2 阶段间数据传递

```
Step 2 剧本 → { 剧情梗概, 人物小传, 场景清单, 完整剧本 }
Step 3 分镜 → { 分镜表(镜号/时长/景别/动作/台词), 情绪曲线 }
Step 4 资产 → { 角色设定图URL列表, 场景图URL列表, 参考图资产表 }
Step 5 提示词 → { 单镜Prompt列表, 风格引擎配置, @艾特映射表 }
Step 6 生成 → { 视频片段URL列表, 生成日志, 版本记录 }
Step 7 审核 → { 审核报告, 不合格镜头清单, 修复方案 }
Step 8 后期 → { 合成成片URL, 字幕文件, 混音工程 }
Step 9 交付 → { 最终成片URL, 多平台版本, 封面图 }
```

## 四、子技能调度层设计

### 4.1 主从技能模式

每个工作流步骤有一个**主技能**（负责核心逻辑）和若干**辅助技能**（补充能力）：

| 步骤 | 主技能 | 辅助技能 |
|---|---|---|
| Step 1 | doubao-creative-drama | — |
| Step 2 | ai-drama-master-suite | jimeng-studio（即梦适配） |
| Step 3 | ai-drama-master-suite | jimeng-studio（即梦适配） |
| Step 4 | script-asset-master（提示词包主） | image-reference；⛔ AI 可直接调用 doubao-creative-design/seedream-50/image_gen 出图，但每张/批成图+提示词+三维必交付用户审核，通过才定稿 @ |
| Step 5 | ai-drama-master-suite | image-reference, seedance-25 |
| Step 6 | ai-drama-master-suite | jimeng-director, seedance-25 |
| Step 7 | ai-drama-master-suite | jimeng-director, byted-mediakit-video |
| Step 8 | byted-mediakit-editing | jianying-editor, seed-audio, byted-mediakit-audio |
| Step 9 | byted-mediakit-video | doubao-creative-design |

### 4.2 技能融合规则

**可融合组合**（串联使用，1+1>2）：

1. **ai-drama-master-suite + jimeng-studio + jimeng-director**
   - ai-drama 提供通用框架，jimeng 提供即梦平台专属提示词风格和批量调度
   - 适用：即梦平台短剧全流程

2. **doubao-creative-video + seedance-25 + image-reference**
   - creative-video 做商业视频规划，seedance-25 做生成引擎约束，image-reference 做参考图拆解
   - 适用：产品广告 / UGC 视频

3. **byted-mediakit-editing + jianying-editor**
   - 简单操作用 mediakit-cli（快速、无GUI），复杂多轨用剪映（专业、模板丰富）
   - 适用：后期合成阶段

4. **seed-audio + byted-mediakit-audio + byted-mediakit-editing**
   - seed-audio 生成原始音频，mediakit-audio 做人声分离，mediakit-editing 做混音合流
   - 适用：音频后期全链路

5. **doubao-creative-design + image-reference + seedance-25**
   - ⛔ 以阶段门控总则为准：creative-design 可直接出资产图，但每张/批成图+提示词+三维必交付用户审核、通过才定稿 @；image-reference 拆解为提示词，seedance-25 直接生成视频、生成后成片+完整脚本/提示词必看
   - 适用：从0到1的视频资产生成

6. **doubao-video-extract + byted-mediakit-video + doubao-creative-video**
   - 下载在线视频 → mediakit 分析高光/剧情 → creative-video 二次创作
   - 适用：视频二创 / 解说 / 混剪

7. **ai-drama-master-suite + doubao-creative-drama**
   - ai-drama 提供8模块，creative-drama 提供更严格的资产分批确认规范
   - 适用：高一致性要求的短剧

**重叠去重**（只保留一个）：

| 重叠组 | 保留 | 弃用原因 |
|---|---|---|
| ai-drama-master-suite / drama-master | ai-drama-master-suite | drama-master 是旧版重复 |
| ai-drama-video-production / drama-production | ai-drama-video-production | drama-production 是旧版重复 |
| image-reference / video-ref-image-master | image-reference | 内容完全相同 |
| jimeng-studio / jimeng-short-drama-studio | jimeng-studio | short-drama-studio 是别名 |
| jimeng-director / jimeng-short-drama-director | jimeng-director | short-drama-director 是别名 |

## 五、全局铁律层设计

全局铁律是**跨所有子技能的统一约束**，在工作流引擎层强制执行，不依赖子技能自身是否实现：

| 铁律 | 执行时机 | 校验方式 |
|---|---|---|
| Seedance 2.5 优先 | Step 6 生成前 | 检查 model_version 参数 |
| 提示词原文透传 | Step 6 生成时 | 对比用户确认文本与工具入参 |
| 生成前展示提示词 | Step 5/6 之间 | 检查提示词是否完整、透明备好（@ 已审核资产，不省略）；生成后随成片一起展示 |
| 强制图生视频@艾特 | Step 5/6 | 检查 prompt 中 @图片N 引用 + image_reference_url_list |
| 内嵌预览交付 | Step 6/8/9 | 检查是否调用 present_files 交付视频 |
| 台词写进提示词 | Step 5 | 检查有台词镜头的 prompt 内容 |
| 分步执行 | 全流程 | 每步后检查是否等待用户确认 |

## 六、扩展机制

### 6.1 新增子技能集成

1. 在 `SKILL.md` 的「子技能调用速查表」中添加新技能条目
2. 在对应工作流步骤中添加调用说明
3. 如果与现有技能有重叠，在「技能融合与串联规则」中说明去重策略
4. 如果引入新的全局约束，添加到「全局铁律」

### 6.2 新增任务类型

1. 在「入口路由」中添加新任务类型和触发关键词
2. 设计对应工作流（步骤 + 每步子技能）
3. 添加到「子技能调用速查表」
4. 添加对应的自检门清单
