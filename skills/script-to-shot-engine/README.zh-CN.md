<div align="center">

# 🎬 Script-to-Shot Engine

**[English](README.md) | 中文**

**把剧本变成可直接投喂 Seedance 2.x 的逐镜头视频提示词**

![Version](https://img.shields.io/badge/version-2.3.2-blue)
![Model](https://img.shields.io/badge/Seedance-2.x-orange)
![Type](https://img.shields.io/badge/Skill-black)
![Lang](https://img.shields.io/badge/提示词-中文-green)

打戏 · 对峙文戏 · 连续拆段 · 全局风格锁定 · 资产连续性

**🧠 推荐模型：Kimi K3 · ChatGPT 5.6 Terra 及以上 · Claude Opus 4.6 及以上**

</div>

---

## 这是什么

一个Skill：读取你**已有的美术资产**（人物 / 场景 / 武器 / 道具）和剧本，内部设计动作因果链，输出**逐镜头、带时间戳、可直接投喂视频模型**的提示词——你只负责复制粘贴。

```text
镜头五（4.8-5.8秒）：光圈 f/2.8（浅景深，背景明显虚化），焦段 135mm（特写），货柜木板特写（close-up detail）固定拍摄（static shot）；
球棍"砰"地砸进木板，木屑飞溅，棍身短暂卡住。
```

## 🎯 两种场景模式

| | 动作模式 | 对峙模式 |
|---|---|---|
| **适用** | 打斗、追逐、枪战、玄幻、Boss 战 | 谈判、审问、摊牌、决裂等台词戏 |
| **因果链** | 发起 → 防守 → 命中 → 受力 → 恢复 | 施压 → 承受 → 泄露/反制 → 新平衡 |
| **镜头密度** | 15 秒 ≥10 镜，单镜 1–2 秒 | 15 秒 5–8 镜，单镜 2–4 秒 |
| **台词** | 点缀 | 剧本原句完整入镜，一句不跨镜 |

混合场景（先文后武）可**逐段切换**两种模式。

## 📦 输出结构

```markdown
## 美术资产对照卡        ← @资产名 + 短锚点，纯剧本推断外观自动标注
## 全局风格锁定          ← 六槽位风格锁定词，全场仅一次
## 视频生成提示词        ← 每段：空间站位 → 逐镜头（时间戳首尾相接）→ 结尾状态 → 约束
## 生成前提醒            ← 最多三条，只写真正会翻车的事
```

- ⏱ **时间戳闭环**：每镜含起止秒、光圈 `f/2.8`（附景深描述）、焦段 `85mm`（附景别描述），视听术语中英双语，从 0 秒连续到段尾
- 🔗 **连续拆段**：长戏按动作/张力结果处拆分，段间承接人物、武器、座位、血迹状态
- 🎭 **特殊风格化**：回忆、监控、幻觉等局部段落可叠加特殊风格，不污染全片锁定
- 🧷 **资产连续性**：武器持握手、倒地者位置、熄灭的光源，跨段严格追踪

## 🚀 安装

把整个文件夹放进 skills 目录，新会话自动生效：

```bash
# Kimi Desktop
git clone https://github.com/jiayushi1-ux/script-to-shot-engine.git \
  "<daimon-share>/daimon/skills/script-to-shot-engine"

# 通用
git clone https://github.com/jiayushi1-ux/script-to-shot-engine.git \
  ~/.config/agents/skills/script-to-shot-engine
```

或直接下载 ZIP 解压到 skills 目录。使用时说「**用 script-to-shot-engine 处理这个剧本**」即可。

## 🗂 目录结构

```
├── SKILL.md              # 主入口：模式路由 · 容量分档 · 输出协议
├── references/           # 按需加载的规则（编排 / 资产 / 连续 / 对峙 / 渲染）
└── examples/             # 打戏与对峙完整示例（15s / 30s / 90s）
```

---

<div align="center">
当前版本 <b>v2.3.2</b> · 适用 Seedance 2.x，其他视频模型可沿用相同结构
</div>
