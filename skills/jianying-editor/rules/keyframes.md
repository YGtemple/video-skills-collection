---
name: keyframes
description: Adding keyframe animations (Zoom, Position, Opacity, Rotation, Color, Volume) to media segments.
metadata:
  tags: keyframes, animation, pip, zoom, pan, color, volume, easing, ken-burns
---

# Keyframes & Animation

You can add keyframe animations to video or image segments (e.g., for Picture-in-Picture, Ken Burns effects, or custom zooms).

## Prerequisites

To use keyframes, you need to import `KeyframeProperty` from the underlying library:

```python
from pyJianYingDraft import KeyframeProperty as KP
```

## How to Add Keyframes

1.  **Capture the Segment**: The `add_media_safe` method returns the created segment object.
2.  **Add Keyframes**: Use the `.add_keyframe(property, timestamp, value)` method on the segment.

```python
# 1. Add media and capture the segment instance
# Note: start_time and duration must be known to calculate absolute keyframe times
start_time = 1000000  # 1s (in microseconds)
segment = project.add_media_safe(
    r"C:\assets\image.png", 
    start_time=start_time, 
    duration="4s"
)

if segment:
    # 2. Define keyframe times (Absolute Timeline Time in microseconds)
    t_start = start_time
    t_end = start_time + 4000000 # 1s + 4s = 5s
    
    # 3. Add Keyframes
    
    # Example: Zoom In (Scale from 1.0 to 1.5)
    segment.add_keyframe(KP.uniform_scale, t_start, 1.0)
    segment.add_keyframe(KP.uniform_scale, t_end, 1.5)
    
    # Example: Fade Out (Opacity from 1.0 to 0.0)
    # segment.add_keyframe(KP.alpha, t_start, 1.0) # Check actual property name support
    
    # Example: Move X (Position)
    # Coordinates: 0.0 is center? (Verify with trial, usually normalized)
    segment.add_keyframe(KP.position_x, t_start, -0.5) # Left
    segment.add_keyframe(KP.position_x, t_end, 0.5)    # Right
```

## Supported Properties (`KeyframeProperty`)

Common properties (verify via `dir(KP)` if unsure):
- `KP.uniform_scale` (Scaling)
- `KP.position_x` / `KP.position_y` (Position)
- `KP.rotation` (Rotation in degrees)
- `KP.alpha` (Opacity, if supported by version)

## Constraints
- **Time Units**: Keyframe timestamps MUST be in **microseconds** (1 second = 1,000,000 us). This differs from the "3s" string format used in high-level APIs. You currently must convert manually.

---

## Complete KeyframeProperty Enum Reference

The underlying JSON uses `property_type` strings. The Python `KeyframeProperty` enum maps to these. **One entry per property** in the segment's `common_keyframes[]` array; each entry's `keyframe_list` is sorted by `time_offset`.

| Python (`KP.*`) | JSON `property_type` | Unit / Range | Notes |
|------------------|---------------------|--------------|-------|
| `KP.position_x` | `KFTypePositionX` | -1.0 to 1.0 (half-canvas-width units) | Horizontal position. 0 = center. |
| `KP.position_y` | `KFTypePositionY` | -1.0 to 1.0 (half-canvas-height units) | Vertical position. 0 = center. |
| `KP.rotation` | `KFTypeRotation` | Degrees (clockwise) | Rotation angle. |
| `KP.scale_x` | `KFTypeScaleX` | Multiplier (1.0 = original) | Independent X-axis scale. |
| `KP.scale_y` | `KFTypeScaleY` | Multiplier (1.0 = original) | Independent Y-axis scale. |
| `KP.uniform_scale` | **`UNIFORM_SCALE`** | Multiplier (1.0 = original) | Both axes locked together. |
| `KP.alpha` | `KFTypeAlpha` | 0.0 to 1.0 | Opacity. |
| `KP.saturation` | `KFTypeSaturation` | -1.0 to 1.0 (0 = original) | Color saturation adjustment. |
| `KP.contrast` | `KFTypeContrast` | -1.0 to 1.0 (0 = original) | Color contrast adjustment. |
| `KP.brightness` | `KFTypeBrightness` | -1.0 to 1.0 (0 = original) | Color brightness adjustment. |
| `KP.volume` | `KFTypeVolume` | 0.0 to 1.0 | Audio volume (audio segments only). |

### CLI/API aliases

At the wrapper or CLI layer, these aliases are accepted:
- `scale` → `uniform_scale`
- `x` → `position_x`
- `y` → `position_y`
- `opacity` → `alpha`

---

## `common_keyframes` JSON Structure

Every segment carries a `common_keyframes` array. Each entry animates **one property** over time:

```jsonc
"common_keyframes": [
  {
    "id": "uuid",
    "property_type": "KFTypePositionX",
    "keyframe_list": [
      {
        "id": "uuid",
        "time_offset": 0,            // µs from segment start (NOT timeline start!)
        "values": [0.0],             // Always a 1-element array
        "curveType": "Line",         // Interpolation to the NEXT keyframe
        "graphID": "",
        "left_control":  { "x": 0.0, "y": 0.0 },
        "right_control": { "x": 0.0, "y": 0.0 }
      },
      {
        "id": "uuid",
        "time_offset": 1000000,
        "values": [0.5],
        "curveType": "Line",
        "left_control":  { "x": 0.0, "y": 0.0 },
        "right_control": { "x": 0.0, "y": 0.0 }
      }
    ]
  },
  {
    "property_type": "UNIFORM_SCALE",
    "keyframe_list": [ ... ]
  }
]
```

### ⚠️ `time_offset` is relative to segment start

The `time_offset` in each keyframe is **microseconds from the segment's start**, not from the timeline origin. If a segment starts at 2,000,000 µs (2s) on the timeline and you want a keyframe at timeline time 3s, the `time_offset` should be `1,000,000` (1s into the segment).

When using the Python API (`segment.add_keyframe()`), you pass **absolute timeline time** in microseconds — the library converts it internally.

---

## Critical Gotchas

### 1. `UNIFORM_SCALE` vs separate `scale_x` / `scale_y`

The property type for uniform scale **breaks the naming convention**:

```
❌ WRONG: "KFTypeUniformScale"   ← silently ignored by JianYing, no render
✅ RIGHT: "UNIFORM_SCALE"         ← bare string, no KFType prefix
```

If you write `KFTypeUniformScale` into the JSON, JianYing will show the keyframe in the editor UI but **ignore it at render time**. Always use the bare `UNIFORM_SCALE` string.

**When to use which:**
- Use `KP.uniform_scale` (`UNIFORM_SCALE`) for standard zoom/punch-in effects where you want X and Y to scale together.
- Use `KP.scale_x` / `KP.scale_y` (`KFTypeScaleX` / `KFTypeScaleY`) only when you need asymmetric stretching (e.g., squashing or stretching independently).

### 2. Alpha keyframes don't always render

**You cannot reliably fade video/image segments with alpha keyframes.** JianYing may silently ignore `KFTypeAlpha` on video and text segments at render/export time — the keyframes show in the editor but the video stays at full opacity in the exported file.

**To fade**, use the **animation system** instead:

```python
# Fade IN using the intro animation system (writes a sticker_animation material)
from pyJianYingDraft import IntroType
seg.add_animation(IntroType.渐显, duration=500000)

# Fade OUT using the outro animation system
from pyJianYingDraft import OutroType
seg.add_animation(OutroType.渐隐, duration=500000)
```

**What DOES render reliably:**
- Position keyframes (`KFTypePositionX` / `KFTypePositionY`) — Ken Burns pan works.
- Scale keyframes (`UNIFORM_SCALE`, `KFTypeScaleX/Y`) — zoom in/out works.
- Rotation keyframes (`KFTypeRotation`) — rotation works.
- Color adjustment keyframes (brightness, contrast, saturation) — work.
- Volume keyframes (`KFTypeVolume`) — audio fade works.

### 3. Time unit consistency

Everywhere in the JSON: 1 second = 1,000,000 µs. This applies to `time_offset`, `duration`, `target_timerange`, `source_timerange`, transition durations, and animation durations.

---

## Interpolation / Easing Options

The `curveType` field on each keyframe defines the interpolation **to the NEXT keyframe**:

| `curveType` | Behavior |
|-------------|----------|
| `"Line"` | Linear interpolation (default). Constant speed. |
| `"Smooth"` | Ease in/out. Smooth acceleration and deceleration. |
| `"Beizer"` | Custom bezier curve. Uses `value_bezier_control_points`. |
| `"FreeCurveInOut"` | Bezier via `left_control` / `right_control` handles — this is what the JianYing UI writes for easing presets. |
| `"Hold"` | Step / hold — listed in the schema but not verified. Emulate hold by placing a `Line` keyframe one frame before the next one. |

The `left_control` and `right_control` objects define bezier handles:

```jsonc
"left_control":  { "x": 0.0, "y": 0.0 },
"right_control": { "x": 0.0, "y": 0.0 }
```

> The `pyJianYingDraft` library typically writes `"Line"` as `curveType` for all keyframes. Custom easing requires direct JSON editing.

---

## Color Adjustment Keyframes (色彩调节)

Brightness, contrast, and saturation can all be keyframed, allowing the color grade to change over time (e.g., gradually warming up a scene):

```python
from pyJianYingDraft import KeyframeProperty as KP

seg = project.add_media_safe(r"C:\scene.mp4", start_time="0s", duration="10s")

# Gradually increase brightness from 0 to +0.3 over 10 seconds
seg.add_keyframe(KP.brightness, 0, 0.0)
seg.add_keyframe(KP.brightness, 10000000, 0.3)

# Animate contrast from -0.2 to 0.1
seg.add_keyframe(KP.contrast, 0, -0.2)
seg.add_keyframe(KP.contrast, 10000000, 0.1)

# Animate saturation (e.g., starting grayscale and becoming colorful)
seg.add_keyframe(KP.saturation, 0, -1.0)
seg.add_keyframe(KP.saturation, 5000000, 0.0)
```

**Value ranges:**
- `KP.brightness`: -1.0 (black) to 1.0 (white), 0 = original
- `KP.contrast`: -1.0 to 1.0, 0 = original
- `KP.saturation`: -1.0 (grayscale) to 1.0 (max saturation), 0 = original

---

## Audio Volume Keyframes (音量关键帧)

Volume keyframes work on audio segments for precise audio mixing (ducking, fade curves):

```python
audio_seg = project.add_audio_safe(r"C:\bgm.mp3", start_time="0s", duration="30s")

# Duck the BGM from 1.0 to 0.2 when narration starts at 5s
audio_seg.add_keyframe(KP.volume, 0, 1.0)
audio_seg.add_keyframe(KP.volume, 5000000, 0.2)   # duck at 5s
audio_seg.add_keyframe(KP.volume, 15000000, 0.2)  # stay low
audio_seg.add_keyframe(KP.volume, 20000000, 1.0)   # restore at 20s
```

**Value range:** 0.0 (silent) to 1.0 (full volume).

---

## Position Keyframes (位置关键帧 / Ken Burns)

Position keyframes use normalized coordinates where 0.0 is center and ±1.0 is the edge:

```python
seg = project.add_media_safe(r"C:\panorama.jpg", start_time="0s", duration="6s")

# Ken Burns effect: slow pan from left to right while zooming in
seg.add_keyframe(KP.position_x, 0, -0.3)       # start: slightly left
seg.add_keyframe(KP.position_y, 0, 0.0)         # start: vertically centered
seg.add_keyframe(KP.uniform_scale, 0, 1.0)      # start: normal scale

seg.add_keyframe(KP.position_x, 6000000, 0.3)   # end: slightly right
seg.add_keyframe(KP.position_y, 6000000, 0.1)   # end: slightly up
seg.add_keyframe(KP.uniform_scale, 6000000, 1.3) # end: zoomed 30%
```

**Coordinate system:**
- `position_x`: -1.0 = left edge, 0.0 = center, 1.0 = right edge (in half-canvas-width units)
- `position_y`: -1.0 = bottom, 0.0 = center, 1.0 = top (in half-canvas-height units)

---

## Rotation Keyframes (旋转关键帧)

```python
seg = project.add_media_safe(r"C:\logo.png", start_time="0s", duration="4s")

# Slowly rotate from 0° to 180°
seg.add_keyframe(KP.rotation, 0, 0.0)
seg.add_keyframe(KP.rotation, 4000000, 180.0)

# Or a continuous spin: 0° → 360°
seg.add_keyframe(KP.rotation, 0, 0.0)
seg.add_keyframe(KP.rotation, 4000000, 360.0)
```

**Unit:** Degrees, clockwise positive.

---

## Speed / Ramp Keyframes

Speed changes are handled via the companion `Speed` material (not via `common_keyframes`):

```jsonc
{
  "id": "<uuid>",
  "type": "speed",
  "speed": 1.5,           // 1.5x playback speed
  "curve_speed": null,    // always null — curve-based speed ramping not supported
  "mode": 0               // 0 = constant speed
}
```

**Relationship between source and target timing:**
- `source_timerange.duration = target_timerange.duration × speed`
- If both `source_timerange` and `speed` are specified, `target_timerange.duration` is auto-computed as `source_timerange.duration / speed`.

> **Note**: Variable speed ramps (曲线变速) are **not generated** by the library. `curve_speed` is always `null`. For variable speed, you must manually edit the JSON or add multiple speed segments.

---

## Practical Examples

### Ken Burns (slow zoom + pan on a still image)

```python
from pyJianYingDraft import KeyframeProperty as KP

img_seg = project.add_media_safe(
    r"C:\assets\landscape.jpg",
    start_time="0s",
    duration="8s"
)

if img_seg:
    t0 = 0
    t1 = 8000000  # 8s in µs
    # Start: centered, normal scale
    img_seg.add_keyframe(KP.position_x, t0, 0.0)
    img_seg.add_keyframe(KP.position_y, t0, 0.0)
    img_seg.add_keyframe(KP.uniform_scale, t0, 1.0)
    # End: zoomed in 20%, slight upward pan
    img_seg.add_keyframe(KP.position_x, t1, 0.1)
    img_seg.add_keyframe(KP.position_y, t1, 0.1)
    img_seg.add_keyframe(KP.uniform_scale, t1, 1.2)
```

### Picture-in-Picture slide-in

```python
pip_seg = project.add_media_safe(
    r"C:\assets\overlay.png",
    start_time="2s",
    duration="5s"
)

if pip_seg:
    seg_start = 2000000
    # Start: off-screen to the right
    pip_seg.add_keyframe(KP.position_x, seg_start, 1.5)
    pip_seg.add_keyframe(KP.uniform_scale, seg_start, 0.5)
    # Slide in to center over 0.5s
    pip_seg.add_keyframe(KP.position_x, seg_start + 500000, 0.0)
    pip_seg.add_keyframe(KP.uniform_scale, seg_start + 500000, 1.0)
```

---

## Source

Knowledge extracted from:
- **pyJianYingDraft** source: `keyframe.py`, `segment.py` — the authoritative `KeyframeProperty` enum and `common_keyframes` JSON structure.
- **capcut-cli** (`renezander030`): `UNIFORM_SCALE` naming gotcha, alpha-keyframe-render trap, curveType interpolation options.
- **pyCapCut** (`Hadas7/pyCapCut`): time_offset relative-to-segment-start semantics, speed material structure.
