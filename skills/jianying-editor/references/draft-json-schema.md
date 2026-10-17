# JianYing draft_content.json Schema Reference

> Source: `pyJianYingDraft/` source code — `script_file.py`, `segment.py`, `track.py`, `video_segment.py`, `audio_segment.py`, `text_segment.py`, `effect_segment.py`, `keyframe.py`, `animation.py`, `local_materials.py`, `script_material.py`, `time_util.py`
> 
> All time values are in **microseconds** (1 second = 1,000,000 µs).

---

## Top-Level Structure

```json
{
  "fps": 30.0,
  "duration": 15000000,
  "config": { "maintrack_adsorb": true },
  "canvas_config": {
    "width": 1080,
    "height": 1920,
    "ratio": "original"
  },
  "materials": { ... },
  "tracks": [ ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| fps | float | Frames per second (default 30.0) |
| duration | int | Total draft duration in microseconds |
| config.maintrack_adsorb | bool | Main track magnetic snap toggle |
| canvas_config.width | int | Canvas width in pixels |
| canvas_config.height | int | Canvas height in pixels |
| canvas_config.ratio | string | "original" |
| materials | object | All material instances (see below) |
| tracks | array | Track list (see below) |

---

## Materials Object

The `materials` key is a flat dictionary where each key maps to an array of material objects. The full list of keys (from `ScriptMaterial.export_json()`):

```json
{
  "audios": [...],
  "videos": [...],
  "stickers": [...],
  "texts": [...],
  "audio_effects": [...],
  "audio_fades": [...],
  "animations": [...],
  "video_effects": [...],
  "chromas": [...],
  "speeds": [...],
  "masks": [...],
  "transitions": [...],
  "effects": [...],
  "canvases": [...],

  "ai_translates": [],
  "audio_balances": [],
  "audio_track_indexes": [],
  "beats": [],
  "color_curves": [],
  "digital_humans": [],
  "drafts": [],
  "flowers": [],
  "green_screens": [],
  "handwrites": [],
  "hsl": [],
  "images": [],
  "log_color_wheels": [],
  "loudnesses": [],
  "manual_deformations": [],
  "material_animations": [...],
  "material_colors": [],
  "multi_language_refs": [],
  "placeholders": [],
  "plugin_effects": [],
  "primary_color_wheels": [],
  "realtime_denoises": [],
  "shapes": [],
  "smart_crops": [],
  "smart_relights": [],
  "sound_channel_mappings": [],
  "tail_leaders": [],
  "text_templates": [],
  "time_marks": [],
  "video_trackings": [],
  "vocal_beautifys": [],
  "vocal_separations": []
}
```

---

### Video Material (`materials.videos[]`)

```json
{
  "id": "<uuid_hex>",
  "material_id": "<uuid_hex>",
  "local_material_id": "",
  "material_name": "video.mp4",
  "path": "/absolute/path/to/video.mp4",
  "duration": 5000000,
  "width": 1920,
  "height": 1080,
  "type": "video",
  "category_name": "local",
  "category_id": "",
  "check_flag": 63487,
  "crop": {
    "upper_left_x": 0.0, "upper_left_y": 0.0,
    "upper_right_x": 1.0, "upper_right_y": 0.0,
    "lower_left_x": 0.0, "lower_left_y": 1.0,
    "lower_right_x": 1.0, "lower_right_y": 1.0
  },
  "crop_ratio": "free",
  "crop_scale": 1.0,
  "media_path": "",
  "audio_fade": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| id / material_id | string (hex) | Material unique ID |
| material_name | string | Display name (defaults to filename) |
| path | string | Absolute file path |
| duration | int (µs) | Material duration |
| width / height | int (px) | Resolution |
| type | string | `"video"` or `"photo"` |
| check_flag | int | 63487 for video, 3 for audio |
| crop.* | float [0,1] | Crop rectangle normalized coords (origin: top-left) |
| crop_ratio | string | "free" |

For images (photos), `type` is `"photo"` and `duration` defaults to `10800000000` (~3 hours).

---

### Audio Material (`materials.audios[]`)

```json
{
  "id": "<uuid_hex>",
  "local_material_id": "<uuid_hex>",
  "music_id": "<uuid_hex>",
  "name": "audio.mp3",
  "path": "/absolute/path/to/audio.mp3",
  "duration": 10000000,
  "type": "extract_music",
  "category_name": "local",
  "category_id": "",
  "check_flag": 3,
  "app_id": 0,
  "source_platform": 0,
  "copyright_limit_type": "none",
  "effect_id": "",
  "formula_id": "",
  "wave_points": []
}
```

---

### Sticker Material (`materials.stickers[]`)

```json
{
  "id": "<uuid_hex>",
  "resource_id": "7405878923323641129",
  "sticker_id": "7405878923323641129",
  "source_platform": 1,
  "type": "sticker"
}
```

| Field | Description |
|-------|-------------|
| resource_id / sticker_id | The sticker's resource ID (from search or template extraction) |
| source_platform | 1 for remote stickers |

---

### Text Material (`materials.texts[]`)

```json
{
  "id": "<uuid_hex>",
  "content": "<JSON string, see below>",
  "type": "subtitle",
  "typesetting": 0,
  "alignment": 0,
  "letter_spacing": 0.0,
  "line_spacing": 0.02,
  "line_feed": 1,
  "line_max_width": 0.82,
  "force_apply_line_max_width": false,
  "check_flag": 7,
  "global_alpha": 1.0,

  "background_style": 1,
  "background_color": "#000000",
  "background_alpha": 1.0,
  "background_round_radius": 0.0,
  "background_height": 0.14,
  "background_width": 0.14,
  "background_horizontal_offset": 0.0,
  "background_vertical_offset": 0.0
}
```

**`content` is itself a JSON string** containing:

```json
{
  "text": "Hello World",
  "styles": [{
    "range": [0, 11],
    "size": 8.0,
    "bold": false,
    "italic": false,
    "underline": false,
    "fill": {
      "alpha": 1.0,
      "content": {
        "render_type": "solid",
        "solid": { "alpha": 1.0, "color": [1.0, 1.0, 1.0] }
      }
    },
    "strokes": [{
      "width": 0.08,
      "content": { "solid": { "alpha": 1.0, "color": [0.0, 0.0, 0.0] } }
    }],
    "shadows": [{
      "diffuse": 0.025,
      "alpha": 1.0,
      "distance": 5.0,
      "angle": -45.0,
      "content": { "solid": { "color": [0.0, 0.0, 0.0] } }
    }],
    "font": { "id": "<resource_id>", "path": "D:" },
    "effectStyle": { "id": "<effect_id>", "path": "C:" }
  }]
}
```

| Field | Description |
|-------|-------------|
| type | `"subtitle"` if auto-wrap enabled, `"text"` otherwise |
| typesetting | 0=horizontal, 1=vertical |
| alignment | 0=left, 1=center, 2=right |
| letter_spacing | Mapped: `letter_spacing_input * 0.05` |
| line_spacing | Mapped: `0.02 + line_spacing_input * 0.05` |
| check_flag | Bitmask: base=7, +8=border, +16=background, +32=shadow |
| global_alpha | Text opacity |
| background_* | Background box styling (if check_flag & 16) |
| styles[].range | [start_char, end_char] in the text |
| styles[].fill.content.solid.color | RGB array [0,1] |
| styles[].strokes[].width | Stroke width (mapped from input: `width/100*0.2`) |
| styles[].shadows[].diffuse | Shadow diffuse (mapped: `diffuse_input/100/6`) |
| styles[].font.id | Font resource ID |
| styles[].effectStyle.id | 花字 effect ID |

---

### Speed Material (`materials.speeds[]`)

```json
{
  "id": "<uuid_hex>",
  "speed": 1.0,
  "curve_speed": null,
  "mode": 0,
  "type": "speed"
}
```

| Field | Description |
|-------|-------------|
| speed | Playback speed multiplier (1.0 = normal) |
| curve_speed | Always null (curve speed ramp not supported) |
| mode | 0 for constant speed |

---

### Audio Fade Material (`materials.audio_fades[]`)

```json
{
  "id": "<uuid_hex>",
  "fade_in_duration": 1000000,
  "fade_out_duration": 2000000,
  "fade_type": 0,
  "type": "audio_fade"
}
```

---

### Animation Material (`materials.animations[]` / `materials.material_animations[]`)

```json
{
  "id": "<uuid_hex>",
  "type": "sticker_animation",
  "multi_language_current": "none",
  "animations": [
    {
      "name": "渐显",
      "id": "624705",
      "type": "in",
      "resource_id": "6798320778182922760",
      "start": 0,
      "duration": 500000,
      "platform": "all",
      "panel": "video",
      "material_type": "video",
      "anim_adjust_params": null
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| type (outer) | Always `"sticker_animation"` |
| animations[].type | `"in"`, `"out"`, `"group"` (video) or `"in"`, `"out"`, `"loop"` (text) |
| animations[].start | Offset from segment start (µs) |
| animations[].duration | Duration (µs) |
| panel | `"video"` for video animations, `""` for text |
| material_type | `"video"` for video, `"sticker"` for text |

---

### Video Effect Material (`materials.video_effects[]`)

```json
{
  "id": "<uuid_hex>",
  "name": "全息扫描",
  "effect_id": "<effect_id>",
  "resource_id": "<resource_id>",
  "type": "video_effect",
  "apply_target_type": 0,
  "value": 1.0,
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
      "value": 1.0
    }
  ],
  "apply_time_range": null,
  "category_id": "",
  "category_name": "",
  "common_keyframes": [],
  "disable_effect_faces": [],
  "formula_id": "",
  "platform": "all",
  "time_range": null,
  "track_render_index": 0,
  "version": ""
}
```

| Field | Description |
|-------|-------------|
| type | `"video_effect"` (scene) or `"face_effect"` (character) |
| apply_target_type | 0=segment, 2=global (independent effect track) |
| value | Effect intensity multiplier |
| adjust_params[] | Effect parameters (0–100 mapped to actual range) |

---

### Filter Material (`materials.effects[]` — filter entries)

```json
{
  "id": "<uuid_hex>",
  "name": "哈苏蓝",
  "effect_id": "<effect_id>",
  "resource_id": "<resource_id>",
  "type": "filter",
  "value": 0.7,
  "apply_target_type": 0,
  "platform": "all",
  "source_platform": 1,
  "sub_type": "none",
  "adjust_params": [],
  "bloom_params": null,
  "color_match_info": {
    "source_feature_path": "", "target_feature_path": "", "target_image_path": ""
  },
  "enable_skin_tone_correction": false,
  "exclusion_group": [],
  "face_adjust_params": [],
  "formula_id": "",
  "intensity_key": "",
  "multi_language_current": "",
  "panel_id": "",
  "time_range": null,
  "version": ""
}
```

Note: `value` is normalized [0,1] (input intensity 0–100 → divide by 100).

---

### Transition Material (`materials.transitions[]`)

```json
{
  "id": "<uuid_hex>",
  "name": "叠化",
  "effect_id": "322577",
  "resource_id": "6724845717472416269",
  "type": "transition",
  "duration": 500000,
  "is_overlap": true,
  "platform": "all",
  "category_id": "",
  "category_name": ""
}
```

| Field | Description |
|-------|-------------|
| duration | Transition duration in µs |
| is_overlap | Whether transition overlaps adjacent segments |

Transitions are attached to the **preceding** segment's `extra_material_refs`.

---

### Mask Material (`materials.masks[]`)

```json
{
  "id": "<uuid_hex>",
  "name": "线性",
  "type": "mask",
  "resource_type": "line",
  "resource_id": "6791652175668843016",
  "platform": "all",
  "position_info": "",
  "config": {
    "aspectRatio": 1.0,
    "centerX": 0.0,
    "centerY": 0.0,
    "feather": 0.0,
    "height": 0.5,
    "invert": false,
    "rotation": 0.0,
    "roundCorner": 0.0,
    "width": 0.5
  }
}
```

| Field | Description |
|-------|-------------|
| resource_type | "line", "mirror", "circle", "rectangle", "geometric_shape" |
| config.centerX / centerY | Normalized to half-material-size units |
| config.width / height | Normalized (fraction of material dimension) |
| config.feather | [0, 1] (input 0–100 → /100) |
| config.roundCorner | [0, 1] (input 0–100 → /100), rectangle only |

---

### Chroma (Color Key) Material (`materials.chromas[]`)

```json
{
  "id": "<uuid_UPPERCASE>",
  "type": "chroma",
  "version": "v2",
  "color": "#e2ecd0ff",
  "intensity_value": 0.2,
  "shadow_value": 0.0,
  "edge_smooth_value": 0.0,
  "spill_value": 0.0,
  "should_transfer_color": True
}
```

| Field | Description |
|-------|-------------|
| color | Key color as `#RRGGBBAA` |
| intensity / shadow / edge_smooth / spill | All [0, 1] (input 0–100 → /100) |

---

### Mix Mode Material (`materials.effects[]` — mix_mode entries)

```json
{
  "id": "<uuid_hex>",
  "type": "mix_mode",
  "name": "滤色",
  "effect_id": "871339",
  "resource_id": "6758325170760323597",
  "value": 1.0,
  "apply_target_type": 0,
  "platform": "all",
  "source_platform": 0,
  "category_id": "",
  "category_name": "",
  "sub_type": "none",
  "time_range": null
}
```

---

### Canvas (Background Fill) Material (`materials.canvases[]`)

```json
{
  "id": "<uuid_hex>",
  "type": "canvas_blur",
  "blur": 0.0625,
  "color": "#00000000",
  "source_platform": 0
}
```

| Field | Description |
|-------|-------------|
| type | `"canvas_blur"` or `"canvas_color"` |
| blur | [0, 1] — JianYing has 4 levels: 0.0625, 0.375, 0.75, 1.0 |
| color | `#RRGGBBAA` |

---

### Audio Effect Material (`materials.audio_effects[]`)

```json
{
  "id": "<uuid_hex>",
  "name": "电音",
  "resource_id": "<resource_id>",
  "type": "audio_effect",
  "audio_adjust_params": [ ... ],
  "category_id": "sound_effect",
  "category_name": "场景音",
  "sub_type": 1,
  "is_ugc": false,
  "production_path": "",
  "speaker_id": "",
  "time_range": { "duration": 0, "start": 0 }
}
```

For ToneEffect (音色), only `audio_adjust_params` and `type`/`id`/`name`/`resource_id` are present (no category fields).

---

### Text Bubble / Flower Text Materials (`materials.effects[]` — text_shape / text_effect)

**Bubble (文本气泡):**
```json
{
  "id": "<uuid_hex>",
  "type": "text_shape",
  "effect_id": "<effect_id>",
  "resource_id": "<resource_id>",
  "apply_target_type": 0,
  "value": 1.0
}
```

**花字 (Text Effect):**
```json
{
  "id": "<uuid_hex>",
  "type": "text_effect",
  "effect_id": "<effect_id>",
  "resource_id": "<effect_id>",
  "source_platform": 1,
  "apply_target_type": 0,
  "value": 1.0
}
```

Note: For 花字, `effect_id` and `resource_id` are the same value.

---

## Tracks Array

```json
"tracks": [
  {
    "attribute": 0,
    "flag": 0,
    "id": "<uuid_hex>",
    "is_default_name": false,
    "name": "video",
    "type": "video",
    "segments": [ ... ]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| attribute | int | 0 = normal, 1 = muted |
| flag | int | Always 0 |
| id | string (hex) | Track unique ID |
| is_default_name | bool | Whether name was auto-generated |
| name | string | Track display name |
| type | string | `"video"`, `"audio"`, `"effect"`, `"filter"`, `"sticker"`, `"text"`, `"adjust"` |
| segments | array | List of segment objects (see below) |

Track rendering order is determined by array index (`render_index` on each segment).

---

## Segment Structure

### Base Segment Fields (all segment types)

```json
{
  "id": "<uuid_hex>",
  "material_id": "<uuid_hex>",
  "target_timerange": { "start": 0, "duration": 5000000 },
  "common_keyframes": [ ... ],
  "keyframe_refs": [],
  "enable_adjust": true,
  "enable_color_correct_adjust": false,
  "enable_color_curves": true,
  "enable_color_match_adjust": false,
  "enable_color_wheels": true,
  "enable_lut": true,
  "enable_smart_color_adjust": false,
  "last_nonzero_volume": 1.0,
  "reverse": false,
  "track_attribute": 0,
  "track_render_index": 0,
  "render_index": 0,
  "visible": true
}
```

| Field | Description |
|-------|-------------|
| id | Segment unique ID |
| material_id | Links to corresponding material in `materials.videos/audios/texts/...` |
| target_timerange.start | Position on timeline (µs) |
| target_timerange.duration | Segment duration on timeline (µs) |
| common_keyframes | Array of KeyframeList objects (see below) |
| reverse | Play in reverse |
| visible | Whether segment is visible |
| render_index | Set by exporter based on track order |

---

### Video/Audio Segment Additional Fields

```json
{
  "source_timerange": { "start": 0, "duration": 5000000 },
  "speed": 1.0,
  "volume": 1.0,
  "is_tone_modify": false,
  "extra_material_refs": [
    "<speed_id>",
    "<fade_id?>",
    "<animation_id?>",
    "<effect_id?>",
    "<filter_id?>",
    "<mask_id?>",
    "<transition_id?>",
    "<chroma_id?>",
    "<mix_mode_id?>",
    "<canvas_id?>"
  ],

  "clip": {
    "alpha": 1.0,
    "rotation": 0.0,
    "flip": { "horizontal": false, "vertical": false },
    "scale": { "x": 1.0, "y": 1.0 },
    "transform": { "x": 0.0, "y": 0.0 }
  },
  "uniform_scale": { "on": true, "value": 1.0 },
  "hdr_settings": { "intensity": 1.0, "mode": 1, "nits": 1000 }
}
```

| Field | Description |
|-------|-------------|
| source_timerange | Range within the source material (µs). null for stickers/text |
| speed | Playback speed (also in materials.speeds, referenced by extra_material_refs) |
| volume | Audio volume [0, 1] |
| is_tone_modify | Whether pitch follows speed change |
| extra_material_refs | Array of material IDs linked to this segment |
| clip.alpha | Opacity [0, 1] |
| clip.rotation | Rotation in degrees (clockwise) |
| clip.flip.horizontal/vertical | Flip toggles |
| clip.scale.x/y | Scale factors (1.0 = no scale) |
| clip.transform.x/y | Position offset in half-canvas-units |
| uniform_scale.on | Whether X/Y scaling is locked together |

For audio segments: `clip` = `null`, `hdr_settings` = `null`.

---

### Keyframe List Structure (`common_keyframes[]`)

```json
{
  "id": "<uuid_hex>",
  "material_id": "",
  "property_type": "KFTypePositionX",
  "keyframe_list": [
    {
      "id": "<uuid_hex>",
      "time_offset": 2500000,
      "values": [0.5],
      "curveType": "Line",
      "graphID": "",
      "left_control": { "x": 0.0, "y": 0.0 },
      "right_control": { "x": 0.0, "y": 0.0 }
    }
  ]
}
```

**Property types:**

| property_type | Description | Unit |
|---------------|-------------|------|
| KFTypePositionX | X position | Half-canvas-width units |
| KFTypePositionY | Y position | Half-canvas-height units |
| KFTypeRotation | Rotation angle | Degrees |
| KFTypeScaleX | X scale | 1.0 = original |
| KFTypeScaleY | Y scale | 1.0 = original |
| UNIFORM_SCALE | Uniform scale (both axes) | 1.0 = original |
| KFTypeAlpha | Opacity | [0, 1] |
| KFTypeSaturation | Saturation | [-1, 1], 0=original |
| KFTypeContrast | Contrast | [-1, 1], 0=original |
| KFTypeBrightness | Brightness | [-1, 1], 0=original |
| KFTypeVolume | Volume | [0, 1], audio only |

| Field | Description |
|-------|-------------|
| time_offset | µs from segment start |
| values | Array (always 1 element) |
| curveType | Always "Line" (linear interpolation) |
| left_control / right_control | Bezier control points (unused, always 0,0) |

---

## Time Remapping / Speed

Currently, only **constant speed** is supported. The `Speed` object has:

```json
{
  "curve_speed": null,
  "mode": 0,
  "speed": 1.5,
  "type": "speed"
}
```

`curve_speed` is always `null` — curve-based speed ramping (time remapping) is not generated by the library.

The relationship between source and target timing:
- `source_timerange.duration = target_timerange.duration * speed`
- If both `source_timerange` and `speed` are specified, `target_timerange.duration` is auto-computed as `source_timerange.duration / speed`.
