---
name: talking-head
description: Silence removal, duplicate take detection, and talking head automation — piggyback on JianYing's auto-captioning ASR, then edit draft JSON directly to cut gaps and re-takes across all tracks.
metadata:
  tags: talking-head, silence, duplicate, smart-cut, auto-caption, asr, timeline-surgery, ffmpeg
---

# 静音删除 / 重复片段检测 / 口播自动化 (Talking-Head Automation)

> 本文档教你如何自动化剪辑口播视频：自动删除长停顿、检测并删除重复 take、跨轨道手术式删除时间范围。
>
> **核心洞察**：剪映自己的"自动字幕"功能已经编码了"语音在哪里"——你可以直接用字幕时间戳作为语音位置的代理，然后手术式编辑草稿 JSON。
>
> **Source attribution**: extracted from mrbuslov/capcut-ai-editor

---

## 0. 什么时候用这个技术 (When to Use)

| 场景 | 适用？ | 说明 |
|---|---|---|
| 口播视频 (Talking head) | ✅ | 单人面对镜头说话，有停顿和重复 take |
| 播客剪辑 (Podcast clips) | ✅ | 多人对话，需要删除静音间隙 |
| 讲座录像 (Lecture recordings) | ✅ | 长时间单人讲解，删除冗长停顿 |
| Vlog 独白 (Vlog monologues) | ✅ | 单人边走边说，清理口误和重启 |
| 双人对话/采访 | ⚠️ | 字幕间隙可能在有声音的地方出现（对方在说话），需手动复核 |
| 音乐视频/B-roll 混剪 | ❌ | 没有口播，不需要这个 |

---

## 1. 架构：搭便车剪映 ASR (Architecture)

**关键设计决策**：不自己实现语音识别 (ASR)，而是**搭便车剪映内置的自动字幕功能**。

```
你录视频 → 导入剪映 → 自动字幕 → 关闭剪映 → 脚本读草稿 → 找间隙 → 找重复 → 删除时间范围 → 保存 → 重新打开剪映
```

为什么这是聪明的：
- **不需要 Whisper / FFmpeg / 音频波形分析**
- **剪映的 ASR 已经很好**（设备端或云端）
- **字幕时间戳已经精确到词级**（ms 精度）
- **直接编辑草稿 JSON，不需要重新渲染**

---

## 2. 完整管线 (End-to-End Pipeline)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. 用户录制口播视频（任意来源）                                      │
│ 2. 导入剪映桌面版                                                   │
│ 3. 运行 文本 → 自动字幕（剪映内置 ASR 生成字幕）                     │
│    → materials.texts[] 中 recognize_task_id != "" 的条目              │
│ 4. 关闭剪映 ← 必须关闭！否则写文件会被覆盖                           │
│ 5. 脚本读取 draft_content.json / draft_info.json                     │
│    ├─ 找到 recognize_task_id != "" 的 text materials                 │
│    ├─ 从 content JSON 提取显示文本                                    │
│    └─ 从 text track segment 提取时间位置（target_timerange）          │
│ 6. 启发式分析（纯 Python，无音频）：                                  │
│    ├─ find_gaps()：字幕间隙 > 1.0s → 标记为静音 → 删除               │
│    └─ find_duplicate_takes()：文本相似度 ≥ 0.6 → 重复 take → 删除    │
│       （可选：用 LLM 替换启发式重复检测）                             │
│ 7. merge_time_ranges() → 合并重叠/相邻的删除范围                      │
│ 8. remove_time_ranges()：                                             │
│    ├─ 遍历每条 track（video/audio/text/sticker）                      │
│    ├─ segment 区间减法 → 算出存活片段                                 │
│    ├─ video/audio：重映射 source_timerange                          │
│    ├─ 所有 segment：target_timerange 左移（累积偏移）                 │
│    ├─ 清理孤立 text materials                                        │
│    └─ 重算项目总时长                                                 │
│ 9. save() — 覆盖 draft_content.json + draft_meta_info.json           │
│ 10. 用户重新打开剪映 → 剪切已经在时间线上了                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 用户操作步骤

1. 录制视频，导入剪映
2. 生成字幕（**文本 → 自动字幕**）
3. **关闭剪映**
4. 运行智能剪辑脚本
5. 重新打开剪映，复核剪切

---

## 3. 识别自动字幕材料 (Identifying Auto-Caption Materials)

**判别字段**：

```python
material.get("recognize_task_id", "") != ""
```

就这一个字段。手动添加的文本 `recognize_task_id` 为空字符串。

### 提取字幕段（完整代码）

```python
import json
from pathlib import Path

def load_subtitles(draft_path: Path) -> list[dict]:
    """
    从草稿中提取所有自动字幕段。
    返回: [{"start_us", "end_us", "text", "material_id", "segment_id"}, ...]
    """
    # 读取草稿（处理 macOS 信封包裹）
    with open(draft_path / "draft_content.json", "r", encoding="utf-8") as f:
        draft = json.load(f)

    # 1. 找到所有自动字幕 material
    subtitle_mats = {}
    for mat in draft["materials"]["texts"]:
        if mat.get("recognize_task_id", "") != "":    # ← 判别字段
            content = json.loads(mat["content"])       # 双重编码 JSON
            subtitle_mats[mat["id"]] = content["text"]

    # 2. 找到 text track 上的 segment 时间位置
    subtitles = []
    for track in draft["tracks"]:
        if track.get("type") != "text":
            continue
        for seg in track.get("segments", []):
            mid = seg["material_id"]
            if mid in subtitle_mats:
                tr = seg["target_timerange"]
                subtitles.append({
                    "start_us": tr["start"],
                    "end_us":   tr["start"] + tr["duration"],
                    "text":     subtitle_mats[mid],
                    "material_id": mid,
                    "segment_id": seg["id"],
                })

    subtitles.sort(key=lambda s: s["start_us"])
    return subtitles
```

### 时间单位注意事项

| 字段 | 单位 | 说明 |
|---|---|---|
| `target_timerange.start` / `duration` | **微秒** | 时间线上的位置 |
| `source_timerange.start` / `duration` | **微秒** | 源素材切片（text 为 null） |
| `materials.texts[].words[].start_time` / `end_time` | **毫秒** | 词级时间，**相对于 segment 起点** |
| `draft_meta_info.json: tm_duration` | 微秒 | 项目总时长 |

---

## 4. 静音间隙检测 (Silence Gap Detection)

**没有 dB 阈值。没有 RMS。没有 FFmpeg。** "静音"被定义为操作上的：**没有自动字幕覆盖的时间区间**。

### 4.1 `find_gaps()` 算法

```python
MICROSECONDS_PER_SECOND = 1_000_000

def find_gaps(
    subtitles: list[dict],
    threshold_us: int = int(1.0 * MICROSECONDS_PER_SECOND),  # 默认 1.0s
    project_duration_us: int = 0,
) -> list[tuple[int, int]]:
    """
    找到超过阈值的静音间隙。

    检查：
    - 从项目开头到第一个字幕的间隙（总是删除）
    - 连续字幕之间的间隙
    - 从最后一个字幕到项目结尾的间隙（总是删除）
    """
    gaps = []

    if not subtitles:
        return gaps

    # 开头间隙（第一个字幕之前）— 总是删除，这是死空气
    first_start = subtitles[0]["start_us"]
    if first_start > 0:
        gaps.append((0, first_start))

    # 连续字幕之间的间隙
    for i in range(len(subtitles) - 1):
        current_end = subtitles[i]["end_us"]
        next_start  = subtitles[i + 1]["start_us"]
        gap = next_start - current_end
        if gap > threshold_us:                # 严格 >，不是 >=
            gaps.append((current_end, next_start))

    # 结尾间隙（最后一个字幕之后）— 总是删除
    if project_duration_us > 0:
        last_end = subtitles[-1]["end_us"]
        if project_duration_us > last_end:
            gaps.append((last_end, project_duration_us))

    return gaps
```

### 4.2 行为总结

| 情况 | 操作 |
|---|---|
| 时间线在第一个字幕之前开始（片头缓冲/死空气） | **总是删除** `(0, first_sub_start)` — 不应用阈值 |
| 字幕[i].end 和字幕[i+1].start 之间间隙 > 1.0s | 删除该间隙 |
| 字幕间隙 ≤ 1.0s | 保留（视为自然呼吸/停顿） |
| 时间线延伸到最后一个字幕之后 | **总是删除** `(last_sub_end, project_duration)` |
| 完全没有字幕 | 返回 `[]`，脚本报错提示用户先运行自动字幕 |

**为什么这对口播有效？** 剪映的自动字幕紧贴语音。字幕时间线上的 1.0s+ 空洞几乎总是意味着说话人停顿、呼吸或重启。

---

## 5. 重复片段检测 (Duplicate Take Detection)

### 5.1 问题

口播创作者经常按"take"录制：

```
00:00  "大家好，今天我要..."              ← take 1，中途放弃
00:04  "大家好，今天我来给大家..."          ← take 2，中途放弃
00:09  "大家好，今天我来给大家演示怎么烤面包" ← take 3，保留
00:18  "首先，预热烤箱..."                  ← 新内容
```

工具必须识别字幕 0 和 1 是字幕 2 的废弃重试，删除从字幕 0 开头到字幕 2 开头的整个连续区间（包括中间的停顿）。

### 5.2 文本相似度算法

```python
import re
from difflib import SequenceMatcher

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)   # 去标点
    text = re.sub(r"\s+", " ", text)       # 压缩空白
    return text

def compute_text_similarity(text_a: str, text_b: str) -> float:
    norm_a = normalize_text(text_a)
    norm_b = normalize_text(text_b)

    words_a = set(norm_a.split())
    words_b = set(norm_b.split())
    if not words_a or not words_b:
        return 0.0

    # 指标 1：Jaccard 词重叠 — 对词序变化鲁棒
    intersection = words_a & words_b
    union        = words_a | words_b
    jaccard      = len(intersection) / len(union)

    # 指标 2：SequenceMatcher 序列匹配 — 对小词编辑/插入/删除鲁棒
    seq_ratio = SequenceMatcher(None, norm_a, norm_b).ratio()

    return max(jaccard, seq_ratio)
```

**两个指标取最大值：**
- **Jaccard 词重叠** `|A ∩ B| / |A ∪ B|` — 对词序变化鲁棒
- **`difflib.SequenceMatcher.ratio()`** — 对小词编辑鲁棒

**阈值 0.6**：两个字幕块共享至少 60% 的词 *或* 60% 的序列字符匹配 = 同一个 take。

### 5.3 `find_duplicate_takes()` — 贪心重启检测器

```python
def find_duplicate_takes(
    subtitles: list[dict],
    similarity_threshold: float = 0.6,
) -> list[tuple[int, int]]:
    if len(subtitles) < 2:
        return []

    ranges_to_cut = []
    i = 0

    while i < len(subtitles):
        # 找这个字幕短语的【最后一次】重启
        last_restart = None
        for j in range(i + 1, len(subtitles)):
            if compute_text_similarity(subtitles[i]["text"], subtitles[j]["text"]) >= similarity_threshold:
                last_restart = j       # 覆盖：保留最后一个匹配

        if last_restart is not None:
            # 删除一个连续区间：从第一个删除的开头到保留版本的开头
            # （包括删除的字幕之间的所有间隙）
            cut_start = subtitles[i]["start_us"]
            cut_end   = subtitles[last_restart]["start_us"]
            ranges_to_cut.append((cut_start, cut_end))
            i = last_restart           # ← 跳过保留的 take
        else:
            i += 1

    return ranges_to_cut
```

### 5.4 算法思考过程

1. 从字幕 `i` 开始向上走。
2. 扫描每个后面的字幕 `j > i`。如果 `similarity(i, j) ≥ 0.6`，记录 `j` 为重启。
3. 扫描完所有后面的字幕后，`last_restart` 持有**最后一个**匹配 `i` 的 `j`。这就是"最终 take" — 要保留的那个。
4. 删除**整个连续区间** `[start(i), start(last_restart)]`。这一次删除所有废弃 take *和* 它们之间的停顿。
5. 直接把 `i` 跳到 `last_restart`（跳过保留的 take 和之前的一切）。
6. 否则（`last_restart is None`），前进一步。

**时间复杂度**：O(N²)。对于 10 分钟视频 ~150 个字幕 = 22500 次比较 — 微不足道。

**已知行为：**
- 只比较字幕 `i` 和后面的字幕。
- 不要求匹配的字幕相邻。一个短语可以在 30 秒后重新录制。
- **保留最后一次出现**（假设最终 take 是打磨过的）。
- 因为 cut 是 `[start(i), start(last_restart)]`，保留 take 自身的开头被保留 — 不裁剪保留版本。

### 5.5 可选 LLM 增强重复检测

如果 `use_openai=True`，启发式输出被 **LLM 结果替换**（不是合并）：

```python
# 模型: gpt-4.1-mini
# Temperature: 0.1（确定性 JSON）
# Response format: {"type": "json_object"}
# System: "You are a video editing assistant that identifies duplicate takes in transcripts."

# 期望输出:
{
  "groups": [
    {
      "block_ids": [1, 2, 3],
      "keep": 3,
      "remove": [1, 2],
      "reason": "三次尝试同一段开场"
    }
  ]
}
```

**LLM 模式的优势**：理解语义（如"let me start over"、"um"、句子片段），而不仅仅是词法重叠。

---

## 6. 时间线手术算法 (Timeline Surgery)

### 6.1 合并删除范围

```python
def merge_time_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """合并重叠或相邻的区间"""
    if not ranges:
        return []
    sorted_ranges = sorted(ranges, key=lambda r: r[0])
    merged = [sorted_ranges[0]]
    for start, end in sorted_ranges[1:]:
        if start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged
```

### 6.2 逐 segment 区间减法

```python
import copy
import uuid

def generate_uuid() -> str:
    """生成大写 UUID — 剪映期望大写"""
    return str(uuid.uuid4()).upper()

def compute_shift(position_us: int, ranges_to_cut: list[tuple[int, int]]) -> int:
    """计算一个时间线位置因为之前的删除而左移了多少"""
    shift = 0
    for cut_start, cut_end in ranges_to_cut:
        if cut_start >= position_us:
            break                       # 区间已排序；完成
        shift += min(cut_end, position_us) - cut_start
    return shift

def apply_cuts_to_segments(segments, ranges_to_cut, track_type):
    """
    对一条 track 上的所有 segment 应用删除。
    核心算法：区间减法 + source_timerange 重映射 + target_timerange 左移。
    """
    surviving = []

    for seg in segments:
        target = seg.get("target_timerange", {})
        seg_start = target.get("start", 0)
        seg_dur   = target.get("duration", 0)
        seg_end   = seg_start + seg_dur
        if seg_dur <= 0:
            continue

        # 1. 从 segment 的 [start,end] 中减去每个删除区间
        pieces = [(seg_start, seg_end)]
        for cut_start, cut_end in ranges_to_cut:
            new_pieces = []
            for piece_start, piece_end in pieces:
                if cut_end <= piece_start or cut_start >= piece_end:
                    new_pieces.append((piece_start, piece_end))
                else:
                    if piece_start < cut_start:
                        new_pieces.append((piece_start, cut_start))
                    if piece_end > cut_end:
                        new_pieces.append((cut_end, piece_end))
            pieces = new_pieces

        if not pieces:
            continue

        # 2. 为每个存活片段重映射 source + target
        source = seg.get("source_timerange")
        has_source = source is not None and isinstance(source, dict)
        source_start_us = source.get("start", 0) if has_source else 0

        for piece_start, piece_end in pieces:
            piece_dur = piece_end - piece_start
            if piece_dur <= 0:
                continue

            new_seg = copy.deepcopy(seg)
            new_seg["id"] = generate_uuid()       # 每个片段新 UUID

            # 3. 左移以闭合间隙
            shift = compute_shift(piece_start, ranges_to_cut)
            new_seg["target_timerange"] = {
                "start":    piece_start - shift,
                "duration": piece_dur,
            }

            # 4. 对 video/audio，重指向 source_timerange
            if has_source and track_type in ("video", "audio"):
                offset_from_seg_start = piece_start - seg_start
                new_seg["source_timerange"] = {
                    "start":    source_start_us + offset_from_seg_start,
                    "duration": piece_dur,
                }
            # text: source_timerange 保持不变（文本没有媒体源）

            surviving.append(new_seg)

    return surviving
```

### 6.3 完整的 remove_time_ranges()

```python
def remove_time_ranges(draft: dict, ranges_to_cut: list[tuple[int, int]]) -> dict:
    """
    对草稿应用删除范围，修改所有轨道。
    """
    if not ranges_to_cut:
        return draft

    for track in draft.get("tracks", []):
        segments = track.get("segments", [])
        if not segments:
            continue
        track_type = track.get("type", "")
        track["segments"] = apply_cuts_to_segments(segments, ranges_to_cut, track_type)

    # 清理孤立 text materials
    referenced = set()
    for track in draft.get("tracks", []):
        if track.get("type") != "text":
            continue
        for seg in track.get("segments", []):
            referenced.add(seg.get("material_id", ""))

    draft["materials"]["texts"] = [
        m for m in draft["materials"]["texts"]
        if m.get("id", "") in referenced
    ]

    # 重算总时长
    max_end = 0
    for track in draft.get("tracks", []):
        for seg in track.get("segments", []):
            t = seg.get("target_timerange", {})
            max_end = max(max_end, t.get("start", 0) + t.get("duration", 0))
    draft["duration"] = max_end

    return draft
```

---

## 7. 完整可运行骨架 (Minimal Reusable Skeleton)

```python
"""
Smart Cut — 口播视频智能剪辑
用法：
  1. 录制视频 → 导入剪映 → 自动字幕 → 关闭剪映
  2. python smart_cut.py "<草稿名>" --silence 1.0 --similarity 0.6
  3. 重新打开剪映复核
"""
import json, re, uuid, shutil, argparse
from pathlib import Path
from difflib import SequenceMatcher

US = 1_000_000

# ── 配置 ──
def normalize(t):
    t = t.lower().strip()
    t = re.sub(r"[^\w\s]", "", t)
    return re.sub(r"\s+", " ", t)

def similarity(a, b):
    wa, wb = set(normalize(a).split()), set(normalize(b).split())
    if not wa or not wb:
        return 0.0
    jac = len(wa & wb) / len(wa | wb)
    seq = SequenceMatcher(None, normalize(a), normalize(b)).ratio()
    return max(jac, seq)

# ── 算法 ──
def find_gaps(subs, thresh_us, project_end_us):
    out = []
    if not subs:
        return out
    if subs[0]["start_us"] > 0:
        out.append((0, subs[0]["start_us"]))
    for a, b in zip(subs, subs[1:]):
        gap = b["start_us"] - a["end_us"]
        if gap > thresh_us:
            out.append((a["end_us"], b["start_us"]))
    if project_end_us > subs[-1]["end_us"]:
        out.append((subs[-1]["end_us"], project_end_us))
    return out

def find_duplicates(subs, sim_thresh):
    out, i = [], 0
    while i < len(subs):
        last = None
        for j in range(i + 1, len(subs)):
            if similarity(subs[i]["text"], subs[j]["text"]) >= sim_thresh:
                last = j
        if last is not None:
            out.append((subs[i]["start_us"], subs[last]["start_us"]))
            i = last
        else:
            i += 1
    return out

def merge_ranges(ranges):
    if not ranges:
        return []
    ranges.sort()
    merged = [ranges[0]]
    for s, e in ranges[1:]:
        if s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged

# ── 主流程 ──
def smart_cut(draft_dir: Path, silence_sec: float = 1.0, sim_thresh: float = 0.6):
    # 备份
    content_path = draft_dir / "draft_content.json"
    shutil.copy2(content_path, content_path + ".bak")

    with open(content_path, "r", encoding="utf-8") as f:
        draft = json.load(f)

    # 提取字幕
    subtitle_mats = {}
    for mat in draft["materials"]["texts"]:
        if mat.get("recognize_task_id", ""):
            subtitle_mats[mat["id"]] = json.loads(mat["content"])["text"]

    subs = []
    for track in draft["tracks"]:
        if track["type"] != "text":
            continue
        for seg in track["segments"]:
            if seg["material_id"] in subtitle_mats:
                tr = seg["target_timerange"]
                subs.append({
                    "start_us": tr["start"],
                    "end_us": tr["start"] + tr["duration"],
                    "text": subtitle_mats[seg["material_id"]],
                })
    subs.sort(key=lambda s: s["start_us"])

    if not subs:
        print("❌ 没有找到自动字幕。请先在剪映中运行：文本 → 自动字幕")
        return

    # 找间隙 + 重复
    thresh_us = int(silence_sec * US)
    gaps = find_gaps(subs, thresh_us, draft["duration"])
    dups = find_duplicates(subs, sim_thresh)
    cuts = merge_ranges(gaps + dups)

    print(f"✅ 找到 {len(gaps)} 个静音间隙, {len(dups)} 个重复 take, 合并为 {len(cuts)} 个删除区间")

    # 应用删除（见 §6 的完整算法）
    # ... apply_cuts_to_segments + remove_time_ranges ...

    # 保存
    with open(content_path, "w", encoding="utf-8") as f:
        json.dump(draft, f, ensure_ascii=False, indent=2)
    print(f"✅ 完成！重新打开剪映查看结果。")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("draft_dir", type=Path, help="草稿目录路径")
    parser.add_argument("--silence", type=float, default=1.0, help="静音阈值(秒)")
    parser.add_argument("--similarity", type=float, default=0.6, help="重复相似度阈值")
    args = parser.parse_args()
    smart_cut(args.draft_dir, args.silence, args.similarity)
```

---

## 8. FFmpeg 扩展：真正的 dB 静音检测

字幕间隙方法的局限：如果两个人同时说话、或者音乐铺在语音下面，字幕间隙可能出现在实际有声音的地方。要获得真正的声学静音，添加 FFmpeg `silencedetect`：

```python
import subprocess, re

def ffmpeg_silences(video_path: str, db: float = -30.0, min_dur: float = 1.0):
    """
    用 FFmpeg 检测真正的声学静音区间。
    返回: [(start_sec, end_sec), ...]
    """
    out = subprocess.run(
        ["ffmpeg", "-i", video_path,
         "-af", f"silencedetect=noise={db}dB:d={min_dur}",
         "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr

    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", out)]
    ends   = [float(m) for m in re.findall(r"silence_end: ([\d.]+)",   out)]
    return list(zip(starts, ends))

# 然后转换为 µs，与 gap_ranges + duplicate_ranges 合并
silences_us = [(int(s*US), int(e*US)) for s, e in ffmpeg_silences("video.mp4", db=-30, min_dur=0.5)]
all_cuts = merge_ranges(gaps + dups + silences_us)
```

这给你两全其美：
- **词法重复检测**来自转录（字幕）
- **声学静音检测**来自波形（FFmpeg）

---

## 9. 实用参数表 (Parameters Cheat Sheet)

| 参数 | 默认值 | 作用 |
|---|---|---|
| `silence_threshold_sec` | `1.0` | 字幕之间超过此间隙长度的删除 |
| `similarity_threshold` | `0.6` | `max(Jaccard, SequenceMatcher)` 超过此值 = 同一个 take |
| `use_openai` | `False` | 用 GPT-4.1-mini 替换启发式重复检测 |
| `LLM_MODEL` | `gpt-4.1-mini` | LLM 重复检测模型 |
| `LLM temperature` | `0.1` | 低温度确保确定性 JSON |
| `MICROSECONDS_PER_SECOND` | `1_000_000` | 剪映时间单位 |
| 开头间隙 | 总是删除 | `(0, first_sub_start)` |
| 结尾间隙 | 总是删除 | `(last_sub_end, project_duration)` |
| 保留 take 策略 | 最后一次 | 最终版本胜出 |
| 删除范围 | 所有轨道 | video + audio + text + sticker |
| 备份 | 无 | 原地覆盖草稿文件 |

---

## 10. 约束与注意事项 (Constraints & Gotchas)

### 10.1 必须关闭剪映

**在编辑草稿 JSON 之前必须关闭剪映。** 剪映监视草稿目录，如果开着，它可能：
- 覆盖你的修改
- 在保存时把 JSON 重写回磁盘
- 锁定文件

保存修改后，**重新打开剪映**（不一定总是热重载）。

### 10.2 没有备份（默认）

原地编辑草稿，**没有自动备份**。运行前先复制项目文件夹：

```bash
cp -r "草稿目录" "草稿目录_backup"
```

### 10.3 复核剪切

重新打开剪映后，**务必复核所有剪切**：
- 开头/结尾被无条件裁剪了 — 如果你有意保留片头缓冲，会被删除
- 短停顿（≤1.0s）被保留 — 这是设计如此（自然节奏）
- 误删风险：两个不相关短语恰好共享 ≥60% 的词

### 10.4 `.recycle_bin/` 陷阱

如果编辑后草稿在剪映中消失，检查草稿根目录下的 `.recycle_bin/` — 剪映把"无效"项目移到这里。通常意味着 JSON schema 格式错误。

### 10.5 UUID 大写

```python
import uuid
new_id = str(uuid.uuid4()).upper()   # ← 剪映期望大写
```

### 10.6 已知局限

| 局限 | 说明 |
|---|---|
| 无真实音频分析 | 双人对话/音乐背景下字幕间隙可能误删 |
| 启发式无语义理解 | 词法相似但语义不同的短语可能被误判 |
| O(N²) 复杂度 | 几百字幕没问题，几万字幕会慢 |
| 无备份 | 原地编辑 |
| 剪映必须关闭 | 否则文件被覆盖 |
| 无重新渲染 | 源文件路径不变，只是时间线剪辑 |
| 文本编辑清空词时间 | 修改字幕后 `words[]` 需重建 |
| 仅清理文本孤立 | 视频/音频孤立材料不清理（剪映容忍） |

---

## 11. 用你自己的 ASR 替换

如果不想依赖剪映的自动字幕，用你自己的转录（Whisper、faster-whisper 等）替换步骤 2-3：

```python
# 用 faster-whisper 转录
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu")
segments, _ = model.transcribe("video.mp4")

# 转换为统一格式
subs = []
for seg in segments:
    subs.append({
        "start_us": int(seg.start * US),
        "end_us":   int(seg.end * US),
        "text":     seg.text,
    })

# 后续 gap + duplicate 逻辑完全相同！
gaps = find_gaps(subs, thresh_us, total_duration_us)
dups = find_duplicates(subs, sim_thresh)
cuts = merge_ranges(gaps + dups)
# ... 然后调用 remove_time_ranges()
```

下游的时间线手术（`remove_time_ranges`）与字幕来源完全无关。

---

## 12. 口播剪辑技术总结

这个项目编码了"好的口播剪辑"是什么样的：

1. **砍掉开头和结尾的死空气** — `(0, first_sub_start)` 和 `(last_sub_end, project_end)` 无条件删除
2. **收紧停顿** — 字幕间隙 > 1.0s 删除，更短的保留（自然节奏）
3. **保留最佳 take** — 说话人重启句子时，删除所有早期尝试，保留最终版本
4. **编辑整条时间线** — 删除应用到每条轨道（视频、音频、文本、贴纸），保持字幕和 B-roll 同步
5. **正确重映射源媒体** — 每个存活片段的 `source_timerange.start` 按偏移重映射，无需重新编码
6. **无重新渲染** — 草稿文件原地编辑，剪映打开时直接播放已剪切的时间线
7. **字幕清理** — 删除字幕 segment 时，其 text material 从 `materials.texts[]` 中移除，不积累孤儿

---

> **快速上手**：如果你只需要算法核心，§7 的 ~80 行代码骨架 + §6.2 的区间减法/source 重映射逻辑就是一个完整的口播修剪器。加上 FFmpeg silencedetect 扩展（§8）就能获得真正的声学静音检测。
