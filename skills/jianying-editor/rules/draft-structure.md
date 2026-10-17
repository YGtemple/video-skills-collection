---
name: draft-structure
description: Draft JSON complete structure reference — top-level fields, materials, tracks, segments, keyframes, transitions, masks, speed, and all gotchas. Read this when you need to directly read or modify draft_content.json / draft_info.json beyond what JyProject wraps.
metadata:
  tags: draft, json, schema, materials, tracks, segments, keyframes, mask, transition, speed, gotchas
---

# Draft JSON 结构完整参考 (Draft Structure Reference)

> 本文件是剪映/CapCut 草稿文件的 **完整 JSON Schema 参考**。当 `JyProject` 封装未覆盖某个操作时（例如直接读取字幕时间戳、手动手术式删除时间范围、调试字段错位），你需要直接读写 `draft_content.json` / `draft_info.json`。本文档告诉你每一个字段的含义、单位和陷阱。
>
> **Source attribution**: extracted from pyJianYingDraft, capcut-mate, pyCapCut, capcut-cli

---

## 0. 核心心智模型 (Two Mental Models)

在深入字段之前，必须内化这两点：

1. **`tracks` 和 `materials` 是扁平且解耦的**。一个 segment **从不内联**它的 material —— 它通过 `material_id` 引用。要搞清楚一个 segment 是什么，就走 `segment.material_id` → `materials.<type>` 查表。
2. **格式是过度规格化 (overspecified) 的**。很多字段剪映设了默认值就忽略。**编辑时不要删除未知字段** —— 保留原有结构，否则剪映可能行为异常或拒绝打开。

---

## 1. 磁盘上的草稿是什么 (On-Disk Layout)

一个草稿是一个**目录**，不是单个文件：

```
<draft-id>/
├── draft_content.json       ← Windows CapCut 主文件；macOS 剪映的时间线可能包在 draft_info.json 里
├── draft_info.json          ← macOS CapCut + 剪映主文件（包裹时间线的信封）
├── draft_meta_info.json     ← name, cover, created/modified, draft_materials[] 侧车注册
├── draft_agency_config.json
├── draft_biz_config.json
├── draft_settings
├── performance_opt_info.json
├── common_attachment/
├── attachment_editing.json
├── attachment_pc_common.json
└── assets/                  ← 所有导入素材的本地副本
    ├── video/
    ├── audio/
    └── image/
```

**草稿根目录 (Store Roots)：**

| OS | CapCut | 剪映 (JianYing) |
|---|---|---|
| macOS | `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/` | `~/Movies/JianyingPro/User Data/Projects/com.lveditor.draft/` |
| Windows | `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\` | `%LOCALAPPDATA%\JianyingPro\...\com.lveditor.draft\` |

根目录还有一个 `root_meta_info.json` 索引文件 —— 列出所有草稿。**没在这个索引里的草稿不会出现在剪映的项目列表里**，即使文件夹和 JSON 完全有效。

### 平台标记 (Platform Marker)

```jsonc
"platform": { "app_source": "cc", "app_version": "6.5.0", "os": "mac" }
```

- `app_source`: `"cc"` = CapCut，`"lv"` = 剪映 (lv_editor)。
- `app_version` 决定使用哪套枚举命名空间（装饰性资源 id 因构建版本不同而不同）。

### ⚠️ 剪映 6.0+ 加密

剪映 6.0+ 把 `draft_content.json` 写成**加密载荷**，不是明文 JSON。这种版本上无法直接读写草稿。你必须从捆绑的明文模板开始，让剪映首次打开时自动升级（剪映 11.4 macOS 据报可工作）。

---

## 2. 顶层字段 (Top-Level Fields)

### 最小有效骨架 (Minimal Skeleton)

```jsonc
{
  "id": "",
  "name": "",
  "duration": 0,
  "fps": 30,
  "canvas_config": { "width": 1920, "height": 1080, "ratio": "16:9" },
  "platform": { "app_source": "cc", "app_version": "6.5.0", "os": "mac" },
  "tracks": [],
  "materials": {
    "videos": [], "audios": [], "texts": [], "stickers": [],
    "video_effects": [], "transitions": [], "masks": [], "chromas": [],
    "audio_fades": [], "audio_effects": [], "canvases": [], "speeds": [],
    "sound_channel_mappings": [], "vocal_separations": [],
    "placeholders": [], "common_mask": []
  }
}
```

### 完整字段集 (Full Field Set)

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string (uuid) | 草稿唯一 ID，匹配 `Timelines/<UUID>/` 目录名 |
| `name` | string | 项目显示名 |
| `duration` | int (µs) | 时间线总长度，**微秒** |
| `fps` | float | 帧率，默认 30.0 |
| `version` | int | 应用写入的版本标记（>0）；现代构建可能拒绝缺少它的草稿 |
| `new_version` | string | 应用写入的版本字符串（非空） |
| `canvas_config.width` / `height` | int | 画布宽高（像素） |
| `canvas_config.ratio` | string | `"16:9"` / `"9:16"` / `"1:1"` / `"original"` |
| `config.adjust_disable_v2` | bool | 色彩调整开关 |
| `config.export_range` | int | 0 = 导出全部 |
| `materials` | object | 所有素材实例（见 §3） |
| `tracks` | array | 轨道列表（见 §4） |
| `platform` | object | `{app_source, app_version, os}` |
| `last_modified_platform` | object | `{app_id, app_version, app_version_code, device_id}` — 应用写入标记 |
| `extra_info.last_modified_platform` | object | 同上，嵌套在 extra_info 里 |
| `draft_fold_path` | string | 草稿目录绝对路径 |
| `draft_root_path` | string | `com.lveditor.draft/` 根目录绝对路径 |

### ⚠️ 应用版本标记 (Gotcha)

现代剪映/CapCut 构建会拒绝缺少以下标记的草稿：
- 顶层 `version`（数字 > 0）
- 顶层 `new_version`（非空字符串）
- `extra_info.last_modified_platform`（对象，非 null）
- 根级 `last_modified_platform`

**如果你从零创建草稿但被剪映拒绝打开**，先从一个剪映自己生成的草稿复制骨架（继承这些标记），然后清空 `tracks` 和 `materials`。

---

## 3. Materials 对象（所有素材类型）

`materials` 是一个扁平字典，每个键映射到一个数组。每个条目至少有一个 `id`（uuid）和一个 `type` 判别字段。

### 3.1 `materials.videos[]` — 视频文件 AND 图片

判别字段是 `type`: `"video"` 或 `"photo"`（静态图片）。

```jsonc
{
  "id": "<uuid>",
  "type": "video",              // 或 "photo"
  "path": "/abs/path/to/assets/video/clip.mp4",  // 绝对路径！
  "material_name": "clip.mp4",
  "duration": 5000000,          // 微秒
  "width": 1920, "height": 1080,
  "category_id": "", "category_name": "local",
  "check_flag": 7,
  "has_audio": true,            // 图片为 false
  "crop": {                     // 归一化源裁剪四边形
    "lower_left_x": 0,  "lower_left_y": 1,
    "lower_right_x": 1, "lower_right_y": 1,
    "upper_left_x": 0,  "upper_left_y": 0,
    "upper_right_x": 1, "upper_right_y": 0
  },
  "local_material_id": "",      // ← 侧车注册 key（见 §10）
  "material_url": "",          // 远程素材 URL
  "reverse_path": "",
  "stable": { "matrix_path": "", "stable_level": 0, "time_range": { "duration": 0, "start": 0 } },
  "video_algorithm": {
    "algorithms": [], "deflicker": null, "motion_blur_config": null,
    "noise_reduction": null, "path": "", "quality_enhance": null, "time_range": null
  }
}
```

| 字段 | 说明 |
|---|---|
| `path` | **绝对路径**到磁盘文件。相对路径会导致 "file inaccessible" |
| `duration` | 素材总时长，微秒。图片 (photo) 默认约 1080000000 µs（~3小时） |
| `crop.*` | 归一化坐标 [0,1]，原点左上角 |
| `has_audio` | 视频 true，图片 false |
| `material_url` | 远程/在线素材 URL。pyCapCut 在线素材约定：`material_url = "<url>"`, `path = "placeholder"`, `is_ai_generate_content = true` |

**JyProject 对应方法**: `project.add_media_safe(path, start_time, duration, track_name=..., source_start=...)` 自动探测 width/height/duration（通过 ffprobe）。

### 3.2 `materials.audios[]`

```jsonc
{
  "id": "<uuid>",
  "path": "/abs/path/to/assets/audio/music.mp3",
  "name": "music.mp3",
  "duration": 180000000,        // 微秒
  "type": "extract_music",      // 本地导入；曲库音频用 type "music" + music_id
  "category_id": "", "category_name": "local",
  "check_flag": 1,
  "music_id": "", "request_id": "",
  "wave_points": [],            // 波形显示点
  "local_material_id": ""
}
```

本地音频 (`type: "extract_music"`) 在 CapCut ↔ 剪映之间可移植；曲库音频 (`type: "music"` 带 `music_id`) 不可移植。

### 3.3 `materials.texts[]` — 文本素材（JSON-in-JSON 陷阱）

```jsonc
{
  "id": "<uuid>",
  "type": "text",               // 或 "subtitle"（自动换行时）
  "content": "<JSON-ENCODED STRING — 见下方>",  // ⚠️ 双重编码！
  "alignment": 1,               // 0=左, 1=中, 2=右
  "font_size": 15,
  "text_color": "#FFFFFF",      // "#RRGGBB" 或 "#RRGGBBAA"
  "letter_spacing": 0,
  "line_spacing": 0.02,
  "line_max_width": 0.82,
  "check_flag": 7,              // bitmask: base=7, +8=border, +16=background, +32=shadow
  "global_alpha": 1.0,
  "has_shadow": false, "shadow_alpha": 0.8, "shadow_angle": -45,
  "shadow_color": "#000000FF", "shadow_distance": 8, "shadow_smoothing": 1,
  "has_border": false, "border_width": 0, "border_color": "#000000FF", "border_alpha": 1,
  "background_color": "#00000000", "background_alpha": 0, "background_style": 0,
  "background_round_radius": 0, "background_width": 0.14, "background_height": 0.14
}
```

**`content` 是双重序列化的 JSON 字符串**（最关键的陷阱）：

```python
import json

material = materials["texts"][0]
content_str = material["content"]        # 这是一个 STRING，不是 dict
content = json.loads(content_str)        # 第一次解析 → dict
display_text = content["text"]           # "Hello world"
styles = content["styles"]               # 逐段样式
```

解析后的 `content` 结构：

```jsonc
{
  "text": "Hello world",
  "styles": [
    {
      "range": [0, 11],                 // ⚠️ UTF-16 code-unit 偏移（JS 字符串索引）
      "size": 18,
      "bold": false, "italic": false, "underline": false,
      "fill": {
        "alpha": 1,
        "content": {
          "render_type": "solid",
          "solid": { "alpha": 1, "color": [1.0, 0.84, 0.0] }  // [r,g,b] 0..1 floats
        }
      },
      "strokes": [{ "width": 0.08, "content": { "solid": { "alpha": 1.0, "color": [0,0,0] } } }],
      "shadows": [{ "diffuse": 0.025, "alpha": 1.0, "distance": 5.0, "angle": -45.0,
                    "content": { "solid": { "color": [0,0,0] } } }]
    }
  ],
  "layer_weight": 1,
  "effect": []
}
```

**⚠️ `range` 是 UTF-16 code units**，不是字节也不是字符。一个 BMP 字符（拉丁、中文）= 1 单位；一个 emoji/astral 字符 = 2（代理对）。多段颜色高亮时务必用 UTF-16 索引。

**自动字幕识别标记**: `material.get("recognize_task_id", "") != ""` —— 这个字段非空表示是剪映自动字幕生成的（见 `rules/talking-head.md`）。

**JyProject 对应方法**: `project.add_text_simple("Hello", start_time="1s", duration="3s", anim_in="复古打字机")` 自动处理 content 双重编码。

### 3.4 `materials.speeds[]` — 变速素材

```jsonc
{
  "id": "<uuid>",
  "speed": 1.0,                 // 播放速度倍率（1.0 = 正常）
  "curve_speed": null,          // 曲线变速（时间重映射）当前为 null —— 库不生成曲线
  "mode": 0,                    // 0 = 恒定速度
  "type": "speed"
}
```

速度与时间的关系：
- `source_timerange.duration = target_timerange.duration * speed`
- 如果同时指定了 `source_timerange` 和 `speed`，`target_timerange.duration` 自动计算为 `source_timerange.duration / speed`

### 3.5 `materials.audio_fades[]` — 音频淡入淡出

```jsonc
{
  "id": "<uuid>",
  "fade_in_duration": 1000000,   // 微秒（1秒）
  "fade_out_duration": 2000000,  // 微秒（2秒）
  "fade_type": 0,
  "type": "audio_fade"
}
```

也可以直接在 segment 上用内联对象：`segment.audio_fade = { "fade_in": 0, "fade_out": 0 }`。

### 3.6 `materials.video_effects[]` — 场景特效 + 滤镜

场景特效和颜色滤镜共享 `video_effects[]` 数组，用 `type` 判别：

```jsonc
{
  "id": "<uuid>",
  "type": "video_effect",       // 场景特效；或 "filter"（滤镜）；或 "face_effect"（人脸特效）
  "name": "VHS",
  "effect_id": "10001",          // 剪映内部枚举 id
  "resource_id": "",
  "value": 1.0,                  // 主强度 0..1
  "apply_target_type": 2,       // 0=单个 segment, 1=整条轨道类型, 2=全局合成
  "apply_target_track_type": 0,
  "adjust_params": [ { "name": "intensity", "default_value": 0.7, "value": 0.7 } ],
  "platform": "cc"
}
```

**⚠️ 效果通过 effect-track segment 应用，不是直接挂在视频 segment 上**。effect track 的 segment 指向一个 `video_effect` material。`apply_target_type` 决定作用范围。

### 3.7 `materials.transitions[]` — 转场

```jsonc
{
  "id": "<uuid>",
  "type": "transition",
  "name": "叠化",
  "effect_id": "322577",
  "resource_id": "6724845717472416269",
  "duration": 500000,            // 微秒（0.5秒）
  "is_overlap": true,
  "platform": "all"
}
```

**转场附加在 pair 中的第一个 segment 的 `extra_material_refs` 上**（即前一个片段）。

### 3.8 `materials.masks[]` / `materials.common_mask[]` — 蒙版

```jsonc
{
  "id": "<uuid>",
  "type": "mask",
  "resource_type": "circle",     // line / mirror / circle / rectangle / geometric_shape / heart / star
  "resource_id": "6791652175668843016",
  "name": "Circle",
  "platform": "cc",
  "config": {
    "rotation": 0,               // 度数
    "centerX": 0.0, "centerY": 0.0,  // 归一化（半素材尺寸单位）
    "feather": 0.0,              // [0,1]，输入 0-100 → /100
    "width": 0.5, "height": 0.5, // 归一化（素材维度的分数）
    "invert": false,
    "roundCorner": 0.0           // [0,1]，仅矩形
  }
}
```

| resource_type | 中文名 | 说明 |
|---|---|---|
| `line` | 线性 | 线性渐变蒙版 |
| `mirror` | 镜像 | 镜像对称 |
| `circle` | 圆形 | 圆形蒙版 |
| `rectangle` | 矩形 | 矩形蒙版（支持 roundCorner） |
| `geometric_shape` | 心形/星形等 | 几何形状 |

在剪映 5.9 / CapCut 9.6 中蒙版迁移到了 `common_mask[]`；旧版本在 `masks[]`。编辑时检查两个数组。

### 3.9 `materials.chromas[]` — 色度键（绿幕）

```jsonc
{
  "id": "<uuid_UPPERCASE>",
  "type": "chroma",
  "version": "v2",
  "color": "#e2ecd0ff",         // 键控颜色 #RRGGBBAA
  "intensity_value": 0.2,       // [0,1]
  "shadow_value": 0.0,
  "edge_smooth_value": 0.0,
  "spill_value": 0.0,
  "should_transfer_color": true
}
```

### 3.10 `materials.stickers[]` — 贴纸

```jsonc
{
  "id": "<uuid>",
  "type": "sticker",
  "name": "",
  "resource_id": "<library-uuid>",  // 只能在剪映 App 内浏览贴纸库获取
  "sticker_id": "",
  "source_platform": 1,
  "platform": "cc"
}
```

### 3.11 `materials.material_animations[]` — 入场/出场/组合动画

```jsonc
{
  "id": "<uuid>",
  "type": "sticker_animation",   // 误导性命名 —— 也服务 video/text/sticker
  "animations": [
    {
      "id": "<uuid>",
      "name": "渐显",
      "category_name": "ruchang",  // ruchang=入, chuchang=出, zuhe=组合
      "type": "in",               // in / out / group
      "resource_id": "...",
      "material_type": "video",
      "duration": 500000,         // 微秒
      "start": 0,                 // 从 segment 起点偏移（微秒）
      "platform": "all"
    }
  ]
}
```

一个条目最多容纳 3 个动画（in/out/group 各一个）。

### 3.12 Companion Material 模式（`extra_material_refs`）

每个 segment 除了主 `material_id` 外，还在 `extra_material_refs` 里携带 4-7 个"伴随" uuid：

| 伴随素材 | 数组 | 用于 |
|---|---|---|
| speed envelope | `materials.speeds` | video, audio, image |
| placeholder_info | `materials.placeholders` | 所有 segment（缺失素材回退） |
| sound_channel_mapping | `materials.sound_channel_mappings` | audio |
| vocal_separation | `materials.vocal_separations` | audio |
| canvas | `materials.canvases` | video, image |
| material_color | `materials.material_colors` | video, image |
| transition | `materials.transitions` | 前一个 segment |
| mask | `materials.masks` / `common_mask` | video, image |
| chroma | `materials.chromas` | video, image |
| animation | `materials.material_animations` | video, text, sticker |

**为什么需要这个模式？** 因为剪映的素材系统是扁平字典 + 引用解耦的。一个视频 segment 本身不存储速度、蒙版、转场 —— 这些都是独立的 material 对象，通过 `extra_material_refs` 数组引用。创建 segment 时必须同时创建这些伴随 material 并把它们的 id 塞进 `extra_material_refs`。

---

## 4. Tracks 轨道

轨道是一条时间线通道上的有序 segment 列表。**数组顺序就是 z-order**：`tracks[]` 中第一个 = 最底层，最后一个 = 最顶层。

```jsonc
{
  "id": "<uuid>",
  "type": "video",            // 见下表
  "name": "video",            // 用户可见名称
  "segments": [ /* §5 */ ],
  "attribute": 0,            // 0=正常, 1=静音
  "flag": 0,
  "is_default_name": true,
  "render_index": 0,          // z-order 整数；视频 14000 / 文本 15000 / 音频 11000
  "is_edit_collapsed": false,
  "default_cover": { "type": "cover", "value": "" }
}
```

### Track `type` 取值

| `type` | 用于 | 注意 |
|---|---|---|
| `video` | 视频文件 **和图片**（图片 = 静态"视频"） | 大多数 segment 在这里 |
| `audio` | 配音、音乐、音效 | `segment.clip` 必须为 `null` |
| `text` | 文本/字幕 segment | 每个恰好一个 text material |
| `sticker` | 贴纸叠加 | 引用贴纸库的 `resource_id` |
| `effect` | 场景特效（VHS、抖动…） | effect-track segment 指向 `video_effect` material |
| `filter` | 颜色滤镜 | 同一 `video_effects` 数组 |
| `subtitle` | 保留给剪映自动字幕 | 导入器默认用 `text` |

**JyProject 对应方法**: `project.add_media_safe(..., track_name="VideoTrack")` 自动创建或复用轨道。`project.get_track_duration(track_name)` 获取轨道当前时长。

---

## 5. Segments 片段

### 5.1 公共字段（所有 segment 类型）

```jsonc
{
  "id": "<uuid>",
  "material_id": "<uuid>",          // → materials.<type> by id
  "raw_segment_id": "<track-id>",
  "target_timerange": { "start": 0, "duration": 5000000 },   // 微秒：时间线上的位置+长度
  "source_timerange": { "start": 0, "duration": 5000000 },   // 微秒：源素材的切片（text 为 null）
  "speed": 1.0,
  "volume": 1.0,                     // [0,1]
  "visible": true,
  "reverse": false,
  "render_index": 14000,
  "track_render_index": 0,
  "track_attribute": 0,
  "extra_material_refs": [ "<speed-uuid>", "<placeholder-uuid>", ... ],
  "common_keyframes": [ /* §6 */ ],
  "keyframe_refs": [],
  "uniform_scale": { "on": true, "value": 1.0 },
  "is_loop": false,
  "cartoon": false,
  "last_nonzero_volume": 1.0,
  "enable_adjust": true, "enable_color_curves": true,
  "enable_color_wheels": true, "enable_lut": true,
  "audio_fade": { "fade_in": 0, "fade_out": 0 },
  "play_rate": 1.0
}
```

**最重要的 4 个字段：**
1. `material_id` → 哪个素材
2. `target_timerange` → 在时间线上哪里、多长
3. `source_timerange` → 源素材的哪个入/出点（剪辑点）。text 通常为 null。
4. `extra_material_refs` → 伴随素材引用

### 5.2 视频 segment 扩展：clip transform

```jsonc
"clip": {
  "alpha": 1.0,                     // 不透明度 [0,1]
  "rotation": 0.0,                  // 顺时针度数
  "scale": { "x": 1.0, "y": 1.0 }, // 缩放因子（1.0 = 原始）
  "transform": { "x": 0.0, "y": 0.0 },  // 归一化坐标，-1..1，0 = 中心
  "flip": { "horizontal": false, "vertical": false }
}
```

- `transform.x/y` 是**半画布单位**：`x=0` 居中，`x=-1` 左边缘，`x=1` 右边缘。
- `uniform_scale.on = true` 时 x/y 锁定等比缩放。

### 5.3 音频 segment 扩展

```jsonc
// 音频 segment 的 clip 必须为 null！
"clip": null,
"volume": 1.0,                      // [0,1]
"audio_fade": { "fade_in": 0, "fade_out": 0 },  // 微秒
```

**⚠️ 不要给音频 segment 附加 clip/transform**。音频没有画面变换。

### 5.4 时间单位：永远是微秒

1 秒 = `1_000_000` µs。所有地方：`duration`, `target_timerange`, `source_timerange`, keyframe `time_offset`, transition `duration`, animation `duration`。高层 API 接受 `"3s"` 字符串，JSON 里必须是 µs 整数。

---

## 6. Keyframes 关键帧

### 6.1 `common_keyframes[]` — 逐属性动画

```jsonc
"common_keyframes": [
  {
    "id": "<uuid>",
    "material_id": "",
    "property_type": "KFTypePositionX",
    "keyframe_list": [
      { "id":"<uuid>", "time_offset": 0,        "values":[0.0], "curveType":"Line",
        "left_control": {"x":0,"y":0}, "right_control": {"x":0,"y":0} },
      { "id":"<uuid>", "time_offset": 1000000,  "values":[0.5], "curveType":"Line",
        "left_control": {"x":0,"y":0}, "right_control": {"x":0,"y":0} }
    ]
  }
]
```

- 每个属性一个条目；`keyframe_list` 按 `time_offset` 排序。
- `time_offset` 是**从 segment 起点算起的微秒**，不是时间线起点。

### 属性类型对照表

| `property_type` | 说明 | 范围 |
|---|---|---|
| `KFTypePositionX` | X 位置 | -1..1（半画布宽单位） |
| `KFTypePositionY` | Y 位置 | -1..1（半画布高单位） |
| `KFTypeRotation` | 旋转 | 顺时针度数 |
| `KFTypeScaleX` | X 缩放 | 倍率（1.0 = 原始） |
| `KFTypeScaleY` | Y 缩放 | 倍率 |
| **`UNIFORM_SCALE`** | 等比缩放 | 倍率（1.0 = 原始） |
| `KFTypeAlpha` | 不透明度 | 0..1 |
| `KFTypeSaturation` | 饱和度 | -1..1，0=原始 |
| `KFTypeContrast` | 对比度 | -1..1，0=原始 |
| `KFTypeBrightness` | 亮度 | -1..1，0=原始 |
| `KFTypeVolume` | 音量 | 0..1（仅音频） |

> **⚠️ `uniform_scale` 破坏了命名模式**。写成 `KFTypeUniformScale` 会被剪映静默忽略 —— 必须是裸字符串 `UNIFORM_SCALE`。

**curveType**（到下一关键帧的插值）：
- `"Line"` 线性（默认）
- `"Smooth"` 缓入缓出
- `"Beizer"` 自定义贝塞尔
- `"FreeCurveInOut"` 贝塞尔通过 `left_control`/`right_control` 手柄 —— 剪映 UI 写的缓动预设就是这个

### ⚠️ Alpha 关键帧不渲染陷阱

**你不能用 alpha 关键帧淡入淡出视频/图片 segment** —— 剪映在导出时静默忽略 `KFTypeAlpha`（编辑器里显示但不渲染）。要淡出，用**动画系统**（`material_animations[]` 里的 fade-in/fade-out）。运动关键帧（position, scale, rotation）**确实会渲染** —— Ken Burns 效果可行。

**JyProject 对应方法**:
```python
from pyJianYingDraft import KeyframeProperty as KP

segment = project.add_media_safe("clip.mp4", start_time=0, duration="4s")
segment.add_keyframe(KP.uniform_scale, 0, 1.0)        # 起点 µs
segment.add_keyframe(KP.uniform_scale, 4_000_000, 1.5) # 终点 µs
```

---

## 7. Speed / Ramp 变速结构

当前只支持**恒定速度**：

```jsonc
{
  "curve_speed": null,
  "mode": 0,
  "speed": 1.5,
  "type": "speed"
}
```

`curve_speed` 始终为 `null` —— 曲线变速（时间重映射）不由库生成。如果你需要速度斜坡，需要手动构造 `curve_speed` 数组（高级用法，未被 pyJianYingDraft 封装）。

---

## 8. 直接读写 draft_content.json 的场景 (When to Go Beyond JyProject)

`JyProject` / `pyJianYingDraft` 封装覆盖了 90% 的常规操作。以下场景需要直接操作 JSON：

### 8.1 读取自动字幕时间戳（Talking Head 场景）

```python
import json

draft_path = project.draft_path  # 草稿目录
with open(f"{draft_path}/draft_content.json", "r", encoding="utf-8") as f:
    draft = json.load(f)

# 找到所有自动字幕 material
subtitle_mats = {}
for mat in draft["materials"]["texts"]:
    if mat.get("recognize_task_id", "") != "":   # ← 自动字幕判别字段
        content = json.loads(mat["content"])      # 双重编码
        subtitle_mats[mat["id"]] = content["text"]

# 找到 text track 上的 segment 时间位置
for track in draft["tracks"]:
    if track["type"] != "text":
        continue
    for seg in track["segments"]:
        mid = seg["material_id"]
        if mid in subtitle_mats:
            tr = seg["target_timerange"]
            print(f"  [{tr['start']/1e6:.2f}s - {(tr['start']+tr['duration'])/1e6:.2f}s] {subtitle_mats[mid]}")
```

### 8.2 手术式删除时间范围（Smart Cut 场景）

见 `rules/talking-head.md` 的完整算法。核心是：遍历每条 track 的每个 segment，用区间减法算出存活片段，重映射 `source_timerange`，左移 `target_timerange`。

### 8.3 调试字段错位

```python
# 用 draft_inspector 查看
# python <SKILL_ROOT>/scripts/draft_inspector.py show --name "Project" --kind content --json
```

### 8.4 信封解包 (Envelope Unwrapping)

新版 macOS 草稿把时间线包在 `draft_info.json` 的信封里。如果直接读 `draft_content.json` 找不到 `tracks` 数组，递归解包：

```python
def find_timeline(obj, depth=0):
    """递归查找包含 tracks[] 和 materials{} 的对象"""
    if depth > 5:
        return None
    if isinstance(obj, dict):
        if "tracks" in obj and "materials" in obj:
            return obj
        for key in ("draft_content", "draft_info", "timeline", "content", "data", "draft"):
            if key in obj:
                result = find_timeline(obj[key], depth+1)
                if result:
                    return result
        for v in obj.values():
            result = find_timeline(v, depth+1)
            if result:
                return result
    elif isinstance(obj, str):
        try:
            return find_timeline(json.loads(obj), depth+1)
        except (json.JSONDecodeError, RecursionError):
            pass
    return None
```

---

## 9. 常见陷阱汇总 (Gotchas)

| # | 陷阱 | 说明 |
|---|---|---|
| 1 | **时间是微秒** | 1 s = 1 000 000 µs。所有 timerange / keyframe / transition duration 都是 µs |
| 2 | **文本 content 双重编码** | `material["content"]` 是 JSON 字符串，不是 dict。必须 `json.loads()` 两次 |
| 3 | **文本 range 是 UTF-16 单位** | emoji 占 2 个 code unit |
| 4 | **Alpha 关键帧不渲染** | 视频/文本导出时忽略 `KFTypeAlpha`。用动画系统做淡入淡出 |
| 5 | **`UNIFORM_SCALE` 裸字符串** | 不是 `KFTypeUniformScale`，必须是裸 `UNIFORM_SCALE` |
| 6 | **保留未知字段** | 格式过度规格化，删除默认字段会导致剪映行为异常 |
| 7 | **material_id 解耦** | segment 不内联 material，永远按 id 查表 |
| 8 | **侧车注册** | 没有 `draft_materials[]` 条目 → "file inaccessible" 提示 |
| 9 | **存储索引** | 没有 `root_meta_info.json` 条目 → 草稿不出现在项目列表 |
| 10 | **应用版本标记** | 现代构建可能拒绝裸模板草稿；从已有 app 草稿复制骨架 |
| 11 | **编辑器运行中** | 剪映打开时写文件可能被覆盖。编辑前**必须关闭剪映** |
| 12 | **音频 clip=null** | 不要给音频 segment 附加 clip/transform |
| 13 | **转场附加在前一个 segment** | 通过 `extra_material_refs` |
| 14 | **效果通过 effect track segment** | 不是直接挂在视频 segment 上 |
| 15 | **路径是绝对的** | `materials.*.path` 必须是绝对路径，相对路径会断 |
| 16 | **UUID 大写** | 剪映期望大写 UUID：`str(uuid.uuid4()).upper()` |
| 17 | **JianYing 6.0+ 加密** | draft_content.json 是不透明载荷，无法直接读写 |
| 18 | **render_index 决定合成顺序** | 视频 14000 / 文本 15000 / 音频 11000 |
| 19 | **UTF-8 无 BOM** | 写 JSON 时用 `ensure_ascii=False, encoding="utf-8"` |
| 20 | **原子写入 + 备份** | 写之前先写 `.bak`，失败可回滚 |

---

## 10. CapCut vs 剪映 (Cross-Build Portability)

约 95% Schema 相同，但**装饰性资源 id 因构建版本不同**：

| | CapCut | 剪映 |
|---|---|---|
| `platform.app_source` | `"cc"` | `"lv"` |
| 主文件 | `draft_content.json` (Win) / `draft_info.json` (mac) | `draft_info.json` |

**可移植的**：用户导入的视频/音频/图片/文本、运动关键帧、segment 时间、多样式文本 range、轨道/segment 结构、微秒时间单位、归一化坐标。

**跨构建会断裂的**：装饰性资源（转场/蒙版/动画/贴纸/滤镜）渲染为 no-op、字体回退、曲库音频丢失来源。

---

## 11. 快速参考：JyProject 方法 ↔ JSON 字段映射

| JyProject 方法 | 操作的 JSON 字段 |
|---|---|
| `JyProject(name, width=, height=, fps=)` | `canvas_config`, `fps` |
| `project.add_media_safe(path, start, duration)` | 创建 `materials.videos[]` + video track segment |
| `project.add_clip(path, src_start, dur)` | 同上，指定 source_start |
| `project.add_text_simple(text, start, dur)` | 创建 `materials.texts[]`（双重编码 content）+ text track segment |
| `project.add_media_safe(..., track_name=)` | 创建/复用指定 type 的 track |
| `segment.add_keyframe(KP.x, t_us, val)` | segment 的 `common_keyframes[]` |
| `project.save()` | 写入 `draft_content.json` + `draft_meta_info.json` |
| `project.export_video(out, res, fps)` | 触发导出（见 `rules/batch-export.md`） |

---

> **当你不确定某个字段长什么样时**，最好的参考是：在剪映里手动创建一个草稿，然后用 `draft_inspector.py show --name "Draft" --kind content --json` 导出完整 JSON，对照查看。这比任何文档都准确。
