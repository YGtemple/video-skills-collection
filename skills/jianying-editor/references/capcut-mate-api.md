# CapCut Mate API Reference

> Source: `capcut-mate/src/router/v1.py` + `src/schemas/*.py`
> Base URL: `http://localhost:30000/openapi/capcut-mate/v1/`
> Tech: FastAPI + Pydantic, Python 3.11+

---

## Overview

CapCut Mate is an open-source FastAPI service that automates JianYing (剪映) draft creation. It writes `draft_content.json` files directly on disk, then optionally triggers cloud rendering via the JianYing API. All time values are in **microseconds** (1 second = 1,000,000 µs).

**Concurrency model:** Most write endpoints use an async lock (30s timeout) per `draft_url` to prevent concurrent corruption of the same draft.

**URL convention:** `draft_url` returned by `create_draft` is a full URL pointing to `get_draft?draft_id=...`. Pass this same URL to every subsequent endpoint.

---

## API Endpoints (39 total)

### 1. Create Draft

- **Method:** `POST`
- **Path:** `/create_draft`
- **Request body:**
  ```json
  {
    "width": 1920,
    "height": 1080
  }
  ```
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | width | int | 1920 | Video width in pixels (≥1) |
  | height | int | 1080 | Video height in pixels (≥1) |
- **Response:**
  ```json
  {
    "draft_url": "http://localhost:30000/...",
    "tip_url": "..."
  }
  ```

---

### 2. Save Draft

- **Method:** `POST`
- **Path:** `/save_draft`
- **Request body:**
  ```json
  { "draft_url": "..." }
  ```
- **Response:**
  ```json
  { "draft_url": "..." }
  ```
- **Notes:** Flushes all pending edits to disk. Uses async lock.

---

### 3. Get Draft (file list)

- **Method:** `GET`
- **Path:** `/get_draft?draft_id={draft_id}`
- **Query params:**
  | Field | Type | Description |
  |-------|------|-------------|
  | draft_id | string (20–32 chars) | Draft ID extracted from draft_url |
- **Response:**
  ```json
  { "files": ["draft_content.json", "draft_meta_info.json", ...] }
  ```

---

### 4. Add Videos

- **Method:** `POST`
- **Path:** `/add_videos`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "video_infos": "[{\"video_url\":\"https://...mp4\",\"start\":0,\"end\":5000000}]",
    "scene_timelines": [{"start":0,"end":5000000}],
    "alpha": 1.0,
    "scale_x": 1.0,
    "scale_y": 1.0,
    "transform_x": 0,
    "transform_y": 0
  }
  ```
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | draft_url | string | — | Draft URL from create_draft |
  | video_infos | string (JSON) | — | JSON array string; each item: `{video_url, start, end, ...}`. video_url must be http/https |
  | scene_timelines | array | null | Optional scene timelines for video speed ramp: `[{start, end}]` |
  | alpha | float | 1.0 | Global opacity [0, 1] |
  | scale_x | float | 1.0 | X scale [0.1, 5.0] |
  | scale_y | float | 1.0 | Y scale [0.1, 5.0] |
  | transform_x | int | 0 | X offset in pixels |
  | transform_y | int | 0 | Y offset in pixels |
- **Response:**
  ```json
  {
    "draft_url": "...",
    "track_id": "...",
    "video_ids": ["..."],
    "segment_ids": ["..."],
    "segment_infos": [{"id":"...","start":0,"end":5000000}]
  }
  ```

---

### 5. Add Audios

- **Method:** `POST`
- **Path:** `/add_audios`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "audio_infos": "[{\"audio_url\":\"https://....mp3\",\"start\":0,\"end\":10000000}]"
  }
  ```
  | Field | Type | Description |
  |-------|------|-------------|
  | draft_url | string | Draft URL |
  | audio_infos | string (JSON) | JSON array string; each item: `{audio_url, start, end, ...}`. audio_url must be http/https |
- **Response:** `{draft_url, track_id, audio_ids[]}`

---

### 6. Add Images

- **Method:** `POST`
- **Path:** `/add_images`
- **Request body:** Same structure as add_videos but uses `image_infos` with `image_url` field.
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | image_infos | string (JSON) | — | `[{image_url, start, end, ...}]` |
  | alpha / scale_x / scale_y / transform_x / transform_y | — | same as add_videos |
- **Response:** `{draft_url, track_id, image_ids[], segment_ids[], segment_infos[]}`

---

### 7. Add Sticker

- **Method:** `POST`
- **Path:** `/add_sticker`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "sticker_id": "7405878923323641129",
    "start": 0,
    "end": 3000000,
    "scale": 1.0,
    "transform_x": 0,
    "transform_y": 0
  }
  ```
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | sticker_id | string | — | Sticker resource ID (from search_sticker) |
  | start / end | int (µs) | — | Display range |
  | scale | float | 1.0 | Scale [0.1, 5.0] |
  | transform_x / transform_y | int (px) | 0 | Position offset from canvas center |
- **Response:** `{draft_url, sticker_id, track_id, segment_id, duration}`

---

### 8. Add Keyframes

- **Method:** `POST`
- **Path:** `/add_keyframes`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "keyframes": "[{\"segment_id\":\"...\",\"property\":\"KFTypePositionX\",\"offset\":0.5,\"value\":0.2}]"
  }
  ```
  | Field | Type | Description |
  |-------|------|-------------|
  | segment_id | string | Target segment ID |
  | property | string | KFTypePositionX / KFTypePositionY / KFTypeScaleX / KFTypeScaleY / KFTypeRotation / KFTypeAlpha |
  | offset | float [0,1] | Time offset as fraction of segment duration |
  | value | float | Property value at that time |
- **Response:** `{draft_url, keyframes_added, affected_segments[]}`

---

### 9. Add Captions (Subtitles)

- **Method:** `POST`
- **Path:** `/add_captions`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "captions": "[{\"start\":0,\"end\":2000000,\"text\":\"Hello\",\"keyword\":\"Hello\"}]",
    "text_color": "#ffffff",
    "border_color": null,
    "alignment": 1,
    "alpha": 1.0,
    "font": null,
    "font_size": 15,
    "letter_spacing": null,
    "line_spacing": null,
    "line_max_width": 0.82,
    "scale_x": 1.0,
    "scale_y": 1.0,
    "transform_x": 0.0,
    "transform_y": 0.0,
    "style_text": false,
    "underline": false,
    "italic": false,
    "bold": false,
    "has_shadow": false,
    "shadow_info": null,
    "text_effect": null
  }
  ```

  **Global style fields:**
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | text_color | string (hex) | #ffffff | Default text color |
  | border_color | string (hex) | null | Stroke/border color |
  | alignment | int | 1 | 0=left,1=center,2=right (horizontal); 3=vc,4=vl,5=vr (vertical) |
  | alpha | float | 1.0 | Text opacity [0,1] |
  | font | string | null | Font name |
  | font_size | int | 15 | Font size |
  | letter_spacing | float | null | Letter spacing |
  | line_spacing | float | null | Line spacing |
  | line_max_width | float | 0.82 | Max line width as fraction of screen width [0,1] |
  | scale_x / scale_y | float | 1.0 | Scaling |
  | transform_x / transform_y | float | 0.0 | Position offset |
  | style_text | bool | false | Use rich text style |
  | underline / italic / bold | bool | false | Style toggles |
  | has_shadow | bool | false | Enable shadow |
  | shadow_info | ShadowInfo | null | Shadow params (see below) |
  | text_effect | string | null | 花字 effect name or effect_id |

  **CaptionItem fields (per caption in JSON array):**
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | start / end | int (µs) | — | Caption time range |
  | text | string | — | Caption content |
  | keyword | string | null | Keywords separated by `|` |
  | keyword_color | string (hex) | #ff7100 | Keyword highlight color |
  | keyword_border_color | string | null | Keyword border color |
  | keyword_font | string | null | Keyword font name |
  | keyword_font_size | int | null | Keyword font size |
  | keyword_has_shadow | bool | false | Keyword shadow toggle |
  | keyword_shadow_info | ShadowInfo | null | Keyword shadow params |
  | font_size | int | 15 | Per-caption font size |
  | in_animation | string | null | Entrance animation name |
  | out_animation | string | null | Exit animation name |
  | loop_animation | string | null | Loop animation name |
  | in_animation_duration | int (µs) | null | Entrance duration |
  | out_animation_duration | int (µs) | null | Exit duration |
  | loop_animation_duration | int (µs) | null | Loop cycle duration |
  | text_effect | string | null | Per-caption 花字 effect |

  **ShadowInfo sub-object:**
  | Field | Type | Default | Range |
  |-------|------|---------|-------|
  | shadow_alpha | float | 1.0 | [0, 1] |
  | shadow_color | string (hex) | #000000 | — |
  | shadow_diffuse | float | 15.0 | [0, 100] |
  | shadow_distance | float | 5.0 | [0, 100] |
  | shadow_angle | float | -45.0 | [-180, 180] |

- **Response:** `{draft_url, track_id, text_ids[], segment_ids[], segment_infos[]}`

---

### 10. Add Effects (visual effects)

- **Method:** `POST`
- **Path:** `/add_effects`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "effect_infos": "[{\"effect_title\":\"胶片闪切\",\"start\":0,\"end\":5000000}]"
  }
  ```
  | Field | Type | Description |
  |-------|------|-------------|
  | effect_title | string | Effect name (from get_effects) |
  | start / end | int (µs) | Effect duration range |
- **Response:** `{draft_url, track_id, effect_ids[], segment_ids[]}`

---

### 11. Add Filters

- **Method:** `POST`
- **Path:** `/add_filters`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "filter_infos": "[{\"filter_title\":\"哈苏蓝\",\"start\":0,\"end\":5000000,\"intensity\":70}]"
  }
  ```
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | filter_title | string | — | Filter name |
  | start / end | int (µs) | — | Filter range |
  | intensity | float | 100 | Filter strength [0, 100] |
- **Response:** `{draft_url, track_id, filter_ids[], segment_ids[]}`

---

### 12. Add Masks

- **Method:** `POST`
- **Path:** `/add_masks`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "segment_ids": ["segment_id_1", "segment_id_2"],
    "name": "线性",
    "X": 0,
    "Y": 0,
    "width": 512,
    "height": 512,
    "feather": 0,
    "rotation": 0,
    "invert": false,
    "roundCorner": 0
  }
  ```
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | segment_ids | string[] | — | Target segment IDs |
  | name | string | "线性" | Mask type: 线性/镜面/圆形/矩形/爱心/星形 |
  | X / Y | int (px) | 0 | Mask center position |
  | width / height | int (px) | 512 | Mask dimensions |
  | feather | int | 0 | Feather [0, 100] |
  | rotation | int (deg) | 0 | Rotation angle |
  | invert | bool | false | Invert mask |
  | roundCorner | int | 0 | Rounded corner [0, 100] |
- **Response:** `{draft_url, masks_added, affected_segments[], mask_ids[]}`

---

### 13. Add Mask Keyframes

- **Method:** `POST`
- **Path:** `/add_mask_keyframes`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "keyframes": [
      {
        "segment_id": "...",
        "offset": 0,
        "X": 0, "Y": 0,
        "width": 512, "height": 512,
        "feather": 0, "rotation": 0
      }
    ]
  }
  ```
  Each item requires at least one of: X, Y, width, height, feather, rotation.
  - `offset` is time in microseconds relative to segment start.
- **Response:** `{draft_url, keyframes_added, affected_segments[]}`

---

### 14. Add Beauty (retouch)

- **Method:** `POST`
- **Path:** `/add_beauty`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "segment_ids": ["..."],
    "beauty_infos": [{"name":"磨皮","intensity":50}],
    "匀肤": 0, "丰盈": 0, "磨皮": 0, "祛法令纹": 0,
    "亮眼": 0, "祛黑眼圈": 0, "美白": 0, "白牙": 0,
    "肤色": "", "肤色强度": 60
  }
  ```
  All beauty sliders range [0, 100]. Named params (匀肤, 磨皮, etc.) are convenience shortcuts.
- **Response:** `{draft_url, affected_segments[], figure_ids[]}`

---

### 15. Add Text Style (rich text helper)

- **Method:** `POST`
- **Path:** `/add_text_style`
- **Request body:**
  ```json
  {
    "text": "Hello World",
    "keyword": "Hello",
    "font_size": 12,
    "keyword_color": "#ff7100",
    "keyword_font_size": 15
  }
  ```
- **Response:** `{text_style: "<JSON string>"}` — Use this as `style_text` in add_captions.

---

### 16. Easy Create Material (quick multi-add)

- **Method:** `POST`
- **Path:** `/easy_create_material`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "audio_url": "https://....mp3",
    "text": "Hello",
    "img_url": "https://....jpg",
    "video_url": "https://....mp4",
    "text_color": "#ffffff",
    "font_size": 15,
    "text_transform_y": 0
  }
  ```
  Adds audio + optional text/image/video in one call.
- **Response:** `{draft_url}`

---

### 17. Get Text Animations

- **Method:** `POST`
- **Path:** `/get_text_animations`
- **Request body:**
  ```json
  { "mode": 0, "type": "in" }
  ```
  | Field | Type | Default | Description |
  |-------|------|---------|-------------|
  | mode | int | 0 | 0=all, 1=VIP, 2=free |
  | type | string | null | "in" / "out" / "loop" |
- **Response:**
  ```json
  {
    "effects": [{
      "resource_id": "...", "type": "...", "category_id": "...",
      "category_name": "...", "duration": 500000, "id": "...",
      "name": "渐显", "icon_url": "...", "material_type": "sticker"
    }]
  }
  ```

---

### 18. Get Image Animations

- **Method:** `POST`
- **Path:** `/get_image_animations`
- Same request/response structure as get_text_animations (for video/image clips).

---

### 19. Get Filters

- **Method:** `POST`
- **Path:** `/get_filters`
- **Request body:** `{ "mode": 0 }` — 0=all, 1=VIP, 2=free
- **Response:**
  ```json
  {
    "filters": [{
      "name": "哈苏蓝", "is_vip": false,
      "resource_id": "...", "effect_id": "...",
      "has_params": true
    }]
  }
  ```

---

### 20. Get Text Effects (花字)

- **Method:** `POST`
- **Path:** `/get_text_effects`
- **Request body:** `{ "mode": 0 }` — 0=all, 1=VIP, 2=free
- **Response:**
  ```json
  {
    "text_effects": [{
      "id": "7506878563723840783",
      "title": "黄字橙光花字",
      "is_vip": true
    }]
  }
  ```

---

### 21. Get Effects

- **Method:** `POST`
- **Path:** `/get_effects`
- **Request body:** `{ "mode": 0 }`
- **Response:**
  ```json
  {
    "effects": [{
      "name": "胶片闪切", "is_vip": false,
      "resource_id": "...", "effect_id": "...",
      "icon_url": "...", "has_params": true
    }]
  }
  ```

---

### 22. Generate Video (cloud render)

- **Method:** `POST`
- **Path:** `/gen_video`
- **Request body:**
  ```json
  {
    "draft_url": "...",
    "apiKey": "uuid-string"
  }
  ```
  - `apiKey` must be a valid UUID. Obtain from https://jcaigc.cn
- **Response:** `{message: "..."}`

---

### 23. Query Generation Status

- **Method:** `POST`
- **Path:** `/gen_video_status`
- **Request body:** `{ "draft_url": "..." }`
- **Response:**
  ```json
  {
    "draft_url": "...",
    "status": "pending|processing|completed|failed",
    "progress": 0,
    "video_url": "...",
    "error_message": "",
    "created_at": "...", "started_at": "...", "completed_at": "..."
  }
  ```

---

### 24. Active Render Count

- **Method:** `GET`
- **Path:** `/gen_video_active_count`
- **Response:** `{ "count": 3 }` — Number of pending+processing render jobs.

---

### 25. Get Audio Duration

- **Method:** `POST`
- **Path:** `/get_audio_duration`
- **Request body:** `{ "mp3_url": "https://....mp3" }`
- **Response:** `{ "duration": 2325333 }` (microseconds)

---

### 26. Timelines (split duration)

- **Method:** `POST`
- **Path:** `/timelines`
- **Request body:**
  ```json
  { "duration": 10000000, "num": 3, "start": 0, "type": 0 }
  ```
  | Field | Description |
  |-------|-------------|
  | duration | Total duration (µs) |
  | num | Number of segments |
  | start | Start time (µs) |
  | type | 0=even split, 1=random |
- **Response:** `{timelines: [{start,end}], all_timelines: [{start,end}]}`

---

### 27. Audio Timelines

- **Method:** `POST`
- **Path:** `/audio_timelines`
- **Request body:** `{ "links": ["url1", "url2"] }` — Audio URLs
- **Response:** Same structure as /timelines, computed from actual audio durations.

---

### 28. Audio Infos (build audio_infos JSON)

- **Method:** `POST`
- **Path:** `/audio_infos`
- **Request body:**
  ```json
  {
    "mp3_urls": ["url1", "url2"],
    "timelines": [{"start":0,"end":5000000}],
    "audio_effect": null,
    "volume": null
  }
  ```
- **Response:** `{infos: "<JSON string>"}` — Feed directly into add_audios.

---

### 29. Image Infos

- **Method:** `POST`
- **Path:** `/imgs_infos`
- **Request body:**
  ```json
  {
    "imgs": ["url1", "url2"],
    "timelines": [{"start":0,"end":3000000}],
    "height": 1920, "width": 1080,
    "in_animation": "渐显", "in_animation_duration": 500000,
    "loop_animation": null, "loop_animation_duration": null,
    "out_animation": null, "out_animation_duration": null,
    "transition": "叠化", "transition_duration": 500000
  }
  ```
  Animation names support multiple separated by `|`.
- **Response:** `{infos: "<JSON string>"}` — Feed into add_images.

---

### 30. Caption Infos

- **Method:** `POST`
- **Path:** `/caption_infos`
- **Request body:**
  ```json
  {
    "texts": ["Hello", "World"],
    "timelines": [{"start":0,"end":2000000}],
    "font_size": 15,
    "keyword_color": "#ff7100",
    "keywords": ["Hello"],
    "in_animation": null, "out_animation": null, "loop_animation": null,
    "transition": null, "transition_duration": null
  }
  ```
- **Response:** `{infos: "<JSON string>"}` — Feed into add_captions.

---

### 31. Effect Infos

- **Method:** `POST`
- **Path:** `/effect_infos`
- **Request body:**
  ```json
  {
    "effects": ["胶片闪切", "光晕"],
    "timelines": [{"start":0,"end":5000000}]
  }
  ```
- **Response:** `{infos: "<JSON string>"}` — Feed into add_effects.

---

### 32. Filter Infos

- **Method:** `POST`
- **Path:** `/filter_infos`
- **Request body:**
  ```json
  {
    "filters": ["哈苏蓝", "原生肤"],
    "timelines": [{"start":0,"end":5000000}],
    "intensities": [70, 100]
  }
  ```
- **Response:** `{infos: "<JSON string>"}` — Feed into add_filters.

---

### 33. Keyframes Infos

- **Method:** `POST`
- **Path:** `/keyframes_infos`
- **Request body:**
  ```json
  {
    "ctype": "KFTypePositionX",
    "offsets": "0|50|100",
    "values": "0.2|0.5|0.2",
    "segment_infos": [{"id":"...","start":0,"end":5000000}],
    "height": 1920, "width": 1080
  }
  ```
  - `ctype`: KFTypePositionX / KFTypePositionY / KFTypeRotation / UNIFORM_SCALE / KFTypeAlpha
  - `offsets`: pipe-separated percentages (0–100)
  - `values`: pipe-separated values matching offsets count
- **Response:** `{keyframes_infos: "<JSON string>"}`

---

### 34. Video Infos

- **Method:** `POST`
- **Path:** `/video_infos`
- **Request body:**
  ```json
  {
    "video_urls": ["url1", "url2"],
    "timelines": [{"start":0,"end":5000000}],
    "height": 1920, "width": 1080,
    "mask": "圆形",
    "transition": "叠化", "transition_duration": 500000,
    "volume": 1.0
  }
  ```
  - `mask`: 圆形/矩形/爱心/星形
- **Response:** `{infos: "<JSON string>"}` — Feed into add_videos.

---

### 35. Search Sticker

- **Method:** `POST`
- **Path:** `/search_sticker`
- **Request body:** `{ "keyword": "枫叶" }`
- **Response:**
  ```json
  {
    "data": [{
      "sticker_id": "7405878923323641129",
      "title": "秋日手绘-枫叶",
      "sticker": {
        "large_image": {"image_url": "..."},
        "preview_cover": "...",
        "track_thumbnail": "...",
        "sticker_package": {
          "width_per_frame": 512, "height_per_frame": 512, "size": 123456
        },
        "sticker_type": 0
      }
    }]
  }
  ```

---

### 36. Get URL (extract link from text)

- **Method:** `POST`
- **Path:** `/get_url`
- **Request body:** `{ "output": "Click here https://example.com/video.mp4" }`
- **Response:** `{ "output": "https://example.com/video.mp4" }`

---

### 37. String List → Object List

- **Method:** `POST`
- **Path:** `/str_list_to_objs`
- **Request body:** `{ "infos": ["https://a.com/x.mp4", "https://b.com/y.mp4"] }`
- **Response:** `{ "infos": [{"output":"https://a.com/x.mp4"}, ...] }`

---

### 38. Object List → String List

- **Method:** `POST`
- **Path:** `/objs_to_str_list`
- **Request body:** `{ "outputs": [{"output":"https://a.com/x.mp4"}] }`
- **Response:** `{ "infos": ["https://a.com/x.mp4", ...] }`

---

### 39. String → List

- **Method:** `POST`
- **Path:** `/str_to_list`
- **Request body:** `{ "obj": "https://a.com/x.mp4" }`
- **Response:** `{ "infos": ["https://a.com/x.mp4"] }`

---

## Desktop Automation Mapping

The capcut-mate project includes an Electron desktop client (`desktop-client/`) that:

1. **Detects draft paths** (`draftPathDetect.js`): Locates the JianYing draft folder on Windows/macOS.
2. **Downloads materials** (`download.js`, `resumableDownload.js`): Downloads video/audio/image from HTTP URLs to local disk.
3. **Context menu integration** (`editContextMenu.js`): Adds right-click menu items in the OS file explorer to send files to capcut-mate.
4. **Cloud rendering trigger** (`nodeapi/ipcHandlers.js`): Orchestrates the `gen_video` → `gen_video_status` polling cycle.

The API layer is stateless: it reads/writes `draft_content.json` directly in the JianYing drafts directory. The desktop client handles OS-level integration (path detection, file download, cloud render polling).

---

## Data Validation Rules

- All `video_infos`, `audio_infos`, `image_infos`, `captions`, `keyframes` fields are **JSON strings** (not nested JSON arrays) — they must be JSON-serialized before sending.
- All media URLs must start with `http://` or `https://`.
- All time values are in **microseconds** (1,000,000 µs = 1 second).
- `draft_url` is returned by `create_draft` and must be passed to every subsequent call.
- Concurrent writes to the same draft are serialized with a 30-second async lock.
