---
name: effects
description: Searching for and applying effects, filters, transitions, masks, mix modes, and chroma key.
metadata:
  tags: effects, filters, transitions, search, asset_id, masks, chroma, mix-modes, beauty
---

# Effects, Filters & Transitions

Jianying uses unique string IDs (e.g., `734521...`) for local assets. These IDs change or vary by version.
**You MUST NOT guess IDs.** You MUST search for them first.

## 1. Search for Asset IDs

Use the `asset_search.py` script to find the correct ID for a request.

```bash
# Syntax
python <SKILL_ROOT>/scripts/asset_search.py "<Keyword>" -c <Category>

# Categories (-c):
# - filters (滤镜)
# - video_scene_effects (画面特效)
# - transitions (转场)
# - text_animations (文字动画)

# Example: Search for "Glitch" effects
python <SKILL_ROOT>/scripts/asset_search.py "故障" -c video_scene_effects
# Output: [Found] Name: 故障_I, ID: 1234567...
```

## 2. Apply in Code

Once you have the ID, apply it using the wrapper.

*Note: The current `JyProject` wrapper exposes specific methods for effects. If a direct method like `add_effect(id)` is not explicitly documented in the wrapper, you may need to use `add_media_safe` if the effect is treated as a track item, or use advanced internal methods.*

**(Common Pattern for Transitions)**
Transitions are usually applied between clips. Current wrapper support for specific transition transitions on clips may vary. Check `jy_wrapper.py` for `add_transition` capability.

**(Common Pattern for Global Effects)**
Effects often sit on their own track above the main video.
```python
# Conceptual example - verify against jy_wrapper.py actual code if method exists
# project.add_effect("1234567", start_time="0s", duration="5s")
```

*Self-Correction*: If the `jy_wrapper.py` only supports basic media/text, use `asset_search` primarily to inform the user or configuration files. If `add_effect` is not present, request the user to add it manually or extend the wrapper.
*(Assuming `add_effect` or similar capability exists or is planned as part of the "Generative Editing" vision described in original SKILL.md)*

---

## 3. JyProject VFX API (Built-in Methods)

The `JyProject` wrapper exposes two concrete VFX methods via `VfxOpsMixin`:

### `add_effect_simple()` — Add a scene effect to its own track

```python
project.add_effect_simple(
    effect_name="故障_I",          # Resolved via VideoSceneEffectType enum + synonyms
    start_time="0s",               # If None, appends at end of EffectTrack
    duration="3s",
    track_name="EffectTrack"       # Auto-created if missing
)
```

**How it works internally:**
1. Ensures an `effect`-type track exists (`draft.TrackType.effect`).
2. Resolves the effect name via `_resolve_enum(draft.VideoSceneEffectType, effect_name)` — supports synonyms and fuzzy matching.
3. Creates an `EffectSegment` wrapping an `EffectMaterial(eff_type)` with the given time range.
4. Adds the segment to the track via `self.script.add_segment(seg, track_name)`.

### `add_transition_simple()` — Apply a transition between clips

```python
# Option A: Pass the video segment directly
project.add_transition_simple(
    transition_name="叠化",         # Resolved via TransitionType enum + synonyms
    video_segment=my_segment,       # The segment BEFORE the transition
    duration="0.5s"
)

# Option B: Auto-pick the last segment on a track
project.add_transition_simple(
    transition_name="叠化",
    track_name="VideoTrack",        # Takes the last segment on this track
    duration="0.5s"
)
```

**How it works internally:**
1. If `video_segment` is not provided, grabs the last segment from the specified track.
2. Resolves the transition name via `_resolve_enum(draft.TransitionType, transition_name)`.
3. Creates a `draft.Transition(trans_type, safe_tim(duration))` object.
4. Calls `video_segment.add_transition(trans)` — this attaches the transition material to the segment's `extra_material_refs`.

> **Key rule**: Transitions are attached to the **preceding** segment of the pair (the segment before the cut), via `extra_material_refs`.

---

## 4. How Effects Work Internally (EffectSegment + EffectMaterial Pattern)

Scene effects (画面特效) use a two-object pattern:

```
EffectMaterial  ← describes WHAT the effect is (effect_id, resource_id, adjust_params)
       ↑
EffectSegment   ← describes WHEN/HOW LONG on the timeline (Timerange)
```

### Video Effect Material (`materials.video_effects[]`)

```jsonc
{
  "id": "<uuid>",
  "name": "全息扫描",
  "effect_id": "<short_numeric_id>",
  "resource_id": "<long_string_id>",
  "type": "video_effect",           // or "face_effect" for character effects
  "apply_target_type": 0,            // 0=one segment, 2=global (independent effect track)
  "value": 1.0,                      // master intensity 0..1
  "render_index": 11000,
  "source_platform": 0,
  "adjust_params": [
    {
      "name": "effects_adjust_filter",
      "default_value": 1.0,
      "max_value": 1.0,
      "min_value": 0.0,
      "parameterIndex": 0,
      "portIndex": 0,
      "value": 0.5                   // actual intensity
    }
  ],
  "apply_time_range": null,
  "category_id": "",
  "category_name": "",
  "platform": "all",
  "time_range": null
}
```

**Parameter mapping**: Input slider values (0–100) are mapped to the effect's actual range:
`actual_value = min_value + (max_value - min_value) * input / 100`

### Filter Material (`materials.effects[]` with `type: "filter"`)

```jsonc
{
  "id": "<uuid>",
  "name": "哈苏蓝",
  "effect_id": "<effect_id>",
  "resource_id": "<resource_id>",
  "type": "filter",
  "value": 0.7,                      // normalized [0,1] — input 0-100 → /100
  "apply_target_type": 0,
  "platform": "all",
  "source_platform": 1,
  "adjust_params": [],
  "enable_skin_tone_correction": false
}
```

> **Note**: For filters, `resource_id` often equals `effect_id`.

---

## 5. Complete Transition Reference (转场)

Transitions are stored in `materials.transitions[]` and attached to the **preceding** segment via `extra_material_refs`.

| Name | resource_id | effect_id | Default Duration (s) | is_overlap |
|------|-------------|-----------|---------------------|------------|
| 3D空间 | 7049979667406656014 | 1506926 | 1.5 | true |
| 上下翻页 | 7397337005387944457 | 77055399 | 1.0 | true |
| 上移 | 6724846395116753416 | 2917279 | 0.5 | true |
| 下移 | 6724849276100284942 | 2917280 | 0.5 | true |
| 中心旋转 | 6858191434294497805 | 878914 | 0.5 | false |
| 云朵 | 6955722927161479694 | 2912469 | 0.5 | true |
| 倒影 | 6748313807031898627 | 369691 | 0.5 | true |
| 冰雪结晶 | 6919369228701143559 | 1017910 | 0.5 | false |
| 冲鸭 | 7030714241359286821 | 1441672 | 0.5 | false |
| 分割 | 6968372308419285540 | 4211683 | 0.5 | true |
| 分割 II | 6969782622868214302 | 4211740 | 0.5 | true |
| 分割 III | 6969793843403166215 | 4211739 | 0.5 | true |
| 分割 IV | 6969793934356648455 | 4211738 | 0.5 | true |
| 前后对比 II | 7299290706277831218 | 28895844 | 0.8 | true |
| 动漫云朵 | 6777178865119793678 | 2911876 | 0.5 | false |
| 动漫漩涡 | 6858191448827761160 | 878913 | 0.5 | false |
| 动漫火焰 | 6777178765643485709 | 2911875 | 0.5 | false |
| 动漫闪电 | 6777178696609436174 | 2911874 | 0.5 | false |
| 压缩 | 6751618376780485133 | 4212466 | 0.5 | true |
| 叠加 | 6914112332205396488 | 1003369 | 1.0 | true |
| 叠化 | 6724845717472416269 | 322577 | 0.5 | true |
| 右移 | 6726711296063967748 | 2917287 | 1.0 | true |
| 向上 | 6724227090872275463 | 359459 | 1.0 | false |
| 向上擦除 | 6724849456891564557 | 2917281 | 0.5 | true |
| 向下 | 6724227330190873100 | 359449 | 1.0 | false |
| 向下擦除 | 6724849752921346573 | 2917282 | 0.5 | true |
| 向下流动 | 6858191469807669773 | 878912 | 0.5 | false |
| 向右 | 6724227599616184836 | 359527 | 1.0 | false |
| 向右上 | 6724227870559834635 | 359567 | 0.5 | true |
| 向右下 | 6724228621742903815 | 359537 | 0.5 | true |
| 向右拉伸 | 6987299127025472031 | 4211782 | 0.5 | true |
| 向右擦除 | 6724849898857959950 | 2917284 | 0.5 | true |
| 向右流动 | 6858191483573375495 | 878911 | 0.5 | false |
| 向左 | 6724227717195108867 | 359529 | 0.5 | false |
| 向左上 | 6724230442679013902 | 359533 | 0.5 | true |
| 向左下 | 6724230577211314695 | 359535 | 0.5 | true |

*(80+ total transitions. Full list in `data/transitions.csv`.)*

### Transition JSON structure

```jsonc
{
  "id": "<uuid>",
  "name": "叠化",
  "effect_id": "322577",
  "resource_id": "6724845717472416269",
  "type": "transition",
  "duration": 500000,           // µs (0.5s)
  "is_overlap": true,
  "platform": "all",
  "category_id": "",
  "category_name": ""
}
```

---

## 6. Complete Mask Reference (蒙版)

| Type | resource_type | resource_id | effect_id | Default Aspect Ratio |
|------|--------------|-------------|-----------|---------------------|
| 线性 (Linear) | `line` | 6791652175668843016 | 636071 | 1.0 |
| 镜面 (Mirror) | `mirror` | 6791699060140020232 | 636073 | 1.0 |
| 圆形 (Circle) | `circle` | 6791700663249146381 | 636075 | 1.0 |
| 矩形 (Rectangle) | `rectangle` | 6791700809454195207 | 636077 | 1.0 |
| 爱心 (Heart) | `geometric_shape` | 6794051276482023949 | 636079 | 1.115 |
| 星形 (Star) | `geometric_shape` | 6794051169434997255 | 636081 | 1.05 |

### Mask config parameters

```jsonc
{
  "id": "<uuid>",
  "name": "线性",
  "type": "mask",
  "resource_type": "line",
  "resource_id": "6791652175668843016",
  "platform": "all",
  "config": {
    "aspectRatio": 1.0,           // From the table above
    "centerX": 0.0,               // Normalized to half-material-size units
    "centerY": 0.0,               // Normalized to half-material-size units
    "feather": 0.0,               // [0, 1] — input 0-100 → /100
    "height": 0.5,                // Normalized (fraction of material dimension)
    "width": 0.5,                 // Normalized (fraction of material dimension)
    "invert": false,              // Boolean — invert the mask
    "rotation": 0.0,              // Degrees
    "roundCorner": 0.0            // [0, 1] — rectangle only, input 0-100 → /100
  }
}
```

> **Note**: In JianYing 5.9+ / CapCut 9.6, masks may be stored in `materials.common_mask[]` instead of `materials.masks[]`. Both arrays exist; check both when reading.

---

## 7. Filter Reference (滤镜)

Filters are stored in `materials.effects[]` with `type: "filter"`. Each filter has a unique `resource_id` (which often equals its `effect_id`).

**Notable free filters:**

| Name | resource_id | Has Intensity Param |
|------|-------------|---------------------|
| 1980 | 7127828208690433311 | No |
| ABG | 7127679308897832206 | No |
| Ditto | 7195816046077496635 | No |
| KE1 | 7127819154018536741 | No |
| 书意 | 7368493100127292723 | Yes (effects_adjust_filter) |
| 亢奋 | 7166472327801097476 | No |
| 亮夏 | 7505804389395877120 | Yes |
| 亮肤 | 7127655008715230495 | No |
| 仲夏绿光 | 7127675970252754189 | No |
| 似锦 | 7188014191834418493 | No |
| 低保真 | 7304170509661506843 | No |
| 侘寂灰 | 7127609569416711455 | No |
| 元气新年 | 7457859598221987110 | Yes |
| 克洛伊 | 7366640728493002018 | Yes |
| 冬日烧烤 | 7449704838763466035 | Yes |
| 冬漫 | 7302324323270872346 | No |
| 冬离 | 7300786822068571418 | No |
| 冰火 | 7303812389177265447 | No |
| 冰肌 | 7199089344756370743 | No |
| 冷气机 | 7263359186883366155 | No |
| 冷白 | 7127614731187178783 | No |
| 冷蓝 | 7127618237117877518 | No |
| 净白肤 | 7411580367452376361 | Yes |
| 凛冬 | 7449996162343390473 | Yes |
| 凝黛 | 7298279202350976282 | Yes |
| 初恋 | 7195812984306814267 | No |
| 千里江山 | 7208495854938901793 | No |
| 千金妝 | 7370585884078443802 | Yes |
| 去黄增质 | 7438854064458239258 | Yes |
| 去黄提亮 | 7438853477616340250 | Yes |

*(300+ total filters. Full list in `data/filters.csv`.)*

---

## 8. Mix Modes (混合模式)

Mix modes are stored in `materials.effects[]` with `type: "mix_mode"`. They control how a clip blends with layers below it.

| Name | resource_id | effect_id |
|------|-------------|-----------|
| 正片叠底 (Multiply) | 6758325895519277582 | 871333 |
| 颜色减淡 (Color Dodge) | 6758325800031752712 | 871334 |
| 颜色加深 (Color Burn) | 6758325724848853518 | 871335 |
| 线性加深 (Linear Burn) | 6758325619253056013 | 871336 |
| 柔光 (Soft Light) | 6758325439212556814 | 871337 |
| 强光 (Hard Light) | 6758325264670790152 | 871338 |
| 滤色 (Screen) | 6758325170760323597 | 871339 |
| 叠加 (Overlay) | 6758324989931295240 | 871340 |
| 变亮 (Lighten) | 6758324919789949453 | 871341 |
| 变暗 (Darken) | 6758324839670354445 | 871342 |

```jsonc
{
  "id": "<uuid>",
  "type": "mix_mode",
  "name": "滤色",
  "effect_id": "871339",
  "resource_id": "6758325170760323597",
  "value": 1.0,
  "apply_target_type": 0,
  "platform": "all",
  "source_platform": 0,
  "sub_type": "none",
  "time_range": null
}
```

---

## 9. Chroma Key / Green Screen (色度键 / 绿幕)

Chroma key materials are stored in `materials.chromas[]` and referenced from the segment's `extra_material_refs`.

```jsonc
{
  "id": "<uuid_UPPERCASE>",
  "type": "chroma",
  "version": "v2",
  "color": "#e2ecd0ff",          // Key color as #RRGGBBAA
  "intensity_value": 0.2,         // [0, 1] — input 0-100 → /100
  "shadow_value": 0.0,            // [0, 1]
  "edge_smooth_value": 0.0,       // [0, 1]
  "spill_value": 0.0,             // [0, 1]
  "should_transfer_color": true
}
```

**Parameters:**
- `color`: The color to key out (typically green `#00FF00` or blue `#0000FF`).
- `intensity_value`: How strongly the key color is removed.
- `shadow_value`: Shadow tolerance.
- `edge_smooth_value`: Edge feathering/smoothing.
- `spill_value`: Spill suppression (removes green/blue tint from edges).

---

## 10. Color Adjustment Structure

Color adjustments are controlled via flags on the segment and companion materials:

**Segment-level enable flags:**
```jsonc
{
  "enable_adjust": true,
  "enable_color_curves": true,
  "enable_color_match_adjust": false,
  "enable_color_wheels": true,
  "enable_lut": true,
  "enable_smart_color_adjust": false,
  "common_keyframe_color_adjusts": []
}
```

**Companion materials:**
- `materials.color_curves[]` — color curve adjustments
- `materials.primary_color_wheels[]` / `materials.log_color_wheels[]` — color wheel grading
- `materials.material_colors[]` — clip color/gradient fills
- `materials.hsl[]` — HSL secondary corrections

**Adjustment track**: A track with `type: "adjust"` carries adjustment segments that apply color grading across a range of the timeline.

---

## 11. Beauty / 美颜 Sliders

Beauty (美颜) effects are applied via the `add_beauty` API (not currently exposed in the JyProject wrapper). Supported parameters (all 0–100 input):

| Parameter | Chinese Name | Description |
|-----------|-------------|-------------|
| 匀肤 | 匀肤 | Skin smoothing / even-out |
| 丰盈 | 丰盈 | Skin plumping / volumizing |
| 磨皮 | 磨皮 | Skin polish / retouching |
| 祛法令纹 | 祛法令纹 | Nasolabial fold removal |
| 亮眼 | 亮眼 | Eye brightening |
| 祛黑眼圈 | 祛黑眼圈 | Dark circle removal |
| 美白 | 美白 | Skin whitening |
| 白牙 | 白牙 | Teeth whitening |
| 肤色 | 肤色 (暖白) | Skin tone preset |
| 肤色强度 | 肤色强度 | Skin tone intensity (default 60) |

Beauty effects are stored in `materials.vocal_beautifys[]` / `materials.beautifys[]` and referenced from video segments via `extra_material_refs`.

---

## 12. Canvas / Background Fill (画布)

Canvas materials control the background behind clips (e.g., letterbox bars, background blur):

```jsonc
{
  "id": "<uuid>",
  "type": "canvas_blur",          // or "canvas_color"
  "blur": 0.0625,                 // [0, 1] — 4 levels: 0.0625, 0.375, 0.75, 1.0
  "color": "#00000000",           // #RRGGBBAA
  "source_platform": 0
}
```

---

## Source

Knowledge extracted from:
- **pyJianYingDraft** source: `effect_segment.py`, `video_segment.py`, `track.py` — the `EffectSegment` / `EffectMaterial` / `Transition` class model.
- **capcut-mate**: `metadata/transition_meta.py`, `metadata/filter_meta.py`, `metadata/transition_meta.py` — the authoritative transition/filter ID tables.
- **capcut-cli** (`renezander030`): mix mode entries, chroma key structure, mask config parameters, canvas material structure.
- **Extracted subtitle/effects knowledge**: full transition list (80+), mask types, 30+ filters, 10 mix modes, beauty parameters.
