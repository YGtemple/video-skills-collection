<div align="center">

# 🎬 Script-to-Shot Engine

**English | [中文](README.zh-CN.md)**

**Turn scripts into shot-by-shot video prompts, ready to feed Seedance 2.x**

![Version](https://img.shields.io/badge/version-2.3.2-blue)
![Model](https://img.shields.io/badge/Seedance-2.x-orange)
![Type](https://img.shields.io/badge/Skill-black)
![Prompts](https://img.shields.io/badge/prompts-Chinese-green)

Fight choreography · Dialogue standoffs · Long-scene splitting · Global style lock · Asset continuity

**🧠 Recommended models: Kimi K3 · ChatGPT 5.6 Terra or above · Claude Opus 4.6 or above**

</div>

---

## What is this

A Skill that reads your **existing art assets** (characters / scenes / weapons / props) and your script, designs the action causal chain internally, and outputs **shot-by-shot, timestamped prompts ready for video models** — you just copy and paste.

```text
镜头五（4.8-5.8秒）：光圈 f/2.8（浅景深，背景明显虚化），焦段 135mm（特写），
货柜木板特写（close-up detail）固定拍摄（static shot）；球棍"砰"地砸进木板，木屑飞溅。
```

Prompts are generated in Chinese by design — Seedance handles them best that way. Every aperture value carries a Chinese depth-of-field note, every focal length carries a shot-size note, and cinematography terms are bilingual: Chinese first, English in parentheses on first use in each clip.

## 🎯 Two scene modes

| | Action mode | Standoff mode |
|---|---|---|
| **For** | Fights, chases, gunfights, fantasy, boss battles | Negotiation, interrogation, showdowns — dialogue-driven scenes |
| **Causal chain** | Attack → Block → Hit → Impact → Recover | Pressure → Endure → Slip/Counter → New balance |
| **Shot density** | ≥10 shots per 15s, 1–2s each | 5–8 shots per 15s, 2–4s each |
| **Dialogue** | Incidental | Full script lines embedded in shots, never split across shots |

Mixed scenes (talk first, fight later) can **switch modes clip by clip**.

## 📦 Output structure

```markdown
## Asset Reference Card      ← @asset names + short anchors; inferred looks auto-flagged
## Global Style Lock         ← six-slot style lock, emitted once for the whole film
## Video Generation Prompts  ← per clip: spatial setup → shots (seamless timestamps) → end state → constraints
## Pre-flight Notes          ← up to three honest warnings
```

- ⏱ **Closed-loop timestamps**: every shot carries start–end seconds, aperture `f/2.8` with a depth-of-field note, focal length `85mm` with a shot-size note, continuous from 0s to clip end
- 🔗 **Long-scene splitting**: split at completed action/turning points; characters, weapons, seats, blood states carry across clips
- 🎭 **Special stylization**: flashbacks, CCTV, hallucinations can be layered onto marked segments without polluting the global lock
- 🧷 **Asset continuity**: weapon hand, downed bodies, extinguished light sources — tracked across clips

## 🚀 Install

Drop the folder into your skills directory; new sessions pick it up automatically:

```bash
# Kimi Desktop
git clone https://github.com/jiayushi1-ux/script-to-shot-engine.git \
  "<daimon-share>/daimon/skills/script-to-shot-engine"

# Generic
git clone https://github.com/jiayushi1-ux/script-to-shot-engine.git \
  ~/.config/agents/skills/script-to-shot-engine
```

Or download the ZIP and extract it into your skills directory. Then just say **"use script-to-shot-engine on this script"**.

## 🗂 Structure

```
├── SKILL.md              # Entry: mode routing · capacity tiers · output protocol
├── references/           # On-demand rules (choreography / assets / continuity / standoff / renderer)
└── examples/             # Full examples (15s / 30s / 90s, action & standoff)
```

---

<div align="center">
Current version <b>v2.3.2</b> · Built for Seedance 2.x — the structure transfers to other video models
</div>
