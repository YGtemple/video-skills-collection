---
name: text-subtitles
description: Rules for adding text, subtitles, captions, and styled text (花字/Flower Text), including animations, fonts, borders, shadows, and bubbles.
metadata:
  tags: text, subtitles, captions, font, styled-text, flower-text, animation, border, shadow, bubble, srt
---

# Text & Subtitles

Use `add_text_simple()` for plain text, `add_styled_text()` for styled flower text (花字), or `import_srt()` for SRT subtitles.

## 1. Plain Text (普通文字)

```python
project.add_text_simple(
    text="Hello World",
    start_time="0s",
    duration="3s",
    clip_settings=draft.ClipSettings(transform_y=-0.8),  # Vertical position: -1.0 (bottom) to 1.0 (top)
    font_size=12.0,         # Scale factor (approximate)
    color_rgb=(1, 1, 1),    # RGB tuple (0-1)
    anim_in=None            # Optional animation identifier (e.g. "打字机_I")
)
```

### Constraints
- **Vertical Position (`clip_settings.transform_y`)**:
- `-0.8` is standard for subtitles.
- `0.0` is centered.
- `0.8` is for titles/headers.
- **Duration**: MUST be specified explicitly (e.g., `"3s"`).

## 2. Styled Text / Flower Text (花字)

When the user asks for **decorative text, styled text, flower text, or 花字**, use `add_styled_text()`.
This method applies a pre-cached visual effect style to the text, making it look like a professional title card with gradients, outlines, shadows, or animated appearances.

### Available Styles

Refer to `data/cloud_text_styles.csv` for the full list. Currently available local styles:

| style_id              | name_hint | Description                    |
| --------------------- | --------- | ------------------------------ |
| `7351316503771368713` | 红色花字1 | Red decorative style           |
| `7187739440347958589` | 红色花字2 | Red decorative style (variant) |
| `7127669365423508767` | 红色花字3 | Red decorative style (variant) |

### Usage

```python
project.add_styled_text(
    text="This is styled!",
    style_id="7351316503771368713",   # Pick from cloud_text_styles.csv
    start_time="5s",
    duration="3s",
    transform_y=-0.8                  # Position
)
```

### How It Works (Internal)
1. A plain `TextSegment` is created (same as `add_text_simple`).
2. On `project.save()`, the patching system injects the `effectStyle` (ID + local cache path) into the `draft_content.json`.
3. The local `artistEffect` resources are stored in `assets/artistEffect/<style_id>/`.
4. Jianying reads the effect prefab and renders the styled appearance.

### AI Decision Guide
- **User says "add subtitle / 字幕"** -> Use `add_text_simple()`.
- **User says "add flower text / 花字 / styled text / decorative title"** -> Use `add_styled_text()`.
- **User says "add text with effect"** -> Ask if they mean animation (use `anim_in` in `add_text_simple`) or visual style (use `add_styled_text`).

### Adding New Flower Text Styles
To add more styles:
1. In Jianying, add the desired 花字 to any draft project.
2. Run `python scripts/build_cloud_text_styles_library.py` to scan and index new style IDs.
3. Copy the `artistEffect/<style_id>` folder from Jianying cache to `assets/artistEffect/`.
4. Update `data/cloud_text_styles.csv` with the new ID and a descriptive name.

## 3. Auto-Layering (Anti-Collision)

If you add multiple text clips that overlap in time on the same logical track (e.g., all named "Subtitle"), the wrapper will **automatically** create new layers/tracks to prevent collision crashes.
You do not need to manually calculate tracks for overlapping text.

## 4. Importing SRT Subtitles

```python
project.import_srt(r"C:\path\to\subs.srt", track_name="Subtitles")
```

## Data Context
- `data/cloud_text_styles.csv`: Index of available flower text style IDs.
- `data/text_animations.csv`: Index of available text intro/outro animations.
- `assets/artistEffect/`: Local cache of flower text effect resources (prefab, shader, textures).

---

## 5. TextStyle Complete Parameter Reference (文字样式参数)

The `add_text_simple()` method accepts a `style` parameter of type `draft.TextStyle`. The full parameter set:

| Parameter | Type | Default | Range / Notes |
|-----------|------|---------|---------------|
| `size` | float | 5.0 (wrapper default) / 8.0 (library default) | Font size scale factor |
| `bold` | bool | `False` | Bold toggle |
| `italic` | bool | `False` | Italic toggle |
| `underline` | bool | `False` | Underline toggle |
| `color` | tuple[float,float,float] | `(1,1,1)` | RGB tuple, each channel 0.0–1.0 |
| `alpha` | float | 1.0 | Opacity [0, 1] |
| `align` | int | 0 | 0=left, 1=center, 2=right |
| `vertical` | bool | `False` | Vertical text (typesetting mode) |
| `letter_spacing` | int | 0 | Mapped to JSON: `value × 0.05` |
| `line_spacing` | int | 0 | Mapped to JSON: `0.02 + value × 0.05` |
| `auto_wrapping` | bool | `False` | Enables `"subtitle"` material type |
| `max_line_width` | float | 0.82 | Max line width as fraction of screen [0,1] |

### Usage example

```python
import pyJianYingDraft as draft

# Custom text style
my_style = draft.TextStyle(
    size=8.0,
    color=(1.0, 0.84, 0.0),     # Gold
    bold=True,
    align=1,                     # Center
    letter_spacing=5,            # → 0.25 in JSON
    line_spacing=2               # → 0.12 in JSON
)

project.add_text_simple(
    text="Gold Title",
    start_time="2s",
    duration="3s",
    style=my_style,
    clip_settings=draft.ClipSettings(transform_y=0.7)
)
```

## 6. TextBorder / TextShadow / TextBackground (描边 / 阴影 / 背景)

### TextBorder (描边)

Pass as the `border` parameter to `add_text_simple()`:

| Parameter | Type | Default | Range / Notes |
|-----------|------|---------|---------------|
| `alpha` | float | 1.0 | [0, 1] |
| `color` | tuple[float,float,float] | `(0,0,0)` | RGB [0,1] |
| `width` | float | 40.0 | [0,100], mapped to JSON: `width / 100 × 0.2` |

```python
border = draft.TextBorder(color=(0.0, 0.0, 0.0), alpha=1.0, width=40.0)
project.add_text_simple("Subtitle", start_time="0s", duration="3s", border=border)
```

### TextShadow (阴影)

| Parameter | Type | Default | Range / Notes |
|-----------|------|---------|---------------|
| `alpha` | float | 1.0 | [0, 1] |
| `color` | tuple[float,float,float] | `(0,0,0)` | RGB [0,1] |
| `diffuse` | float | 15.0 | [0,100], mapped to JSON: `diffuse / 100 / 6` |
| `distance` | float | 5.0 | [0,100] |
| `angle` | float | -45.0 | [-180, 180] degrees |

```python
shadow = draft.TextShadow(
    color=(0.0, 0.0, 0.0), alpha=1.0,
    diffuse=15.0, distance=5.0, angle=-45.0
)
project.add_text_simple("Title with shadow", start_time="0s", duration="3s", shadow=shadow)
```

### TextBackground (背景)

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `style` | int | 1 | 1 or 2 (two JianYing background box styles) |
| `color` | string (hex) | — | `#RRGGBB` |
| `alpha` | float | 1.0 | [0,1] |
| `round_radius` | float | 0.0 | Corner radius [0,1] |
| `height` | float | 0.14 | [0,1] |
| `width` | float | 0.14 | [0,1] |
| `horizontal_offset` | float | 0.5 | Mapped: `value × 2 - 1` |
| `vertical_offset` | float | 0.5 | Mapped: `value × 2 - 1` |

### check_flag Bitmask

The text material's `check_flag` field is a **bitmask** that toggles which styling features are active:

| Bit | Value | Meaning |
|-----|-------|---------|
| base | 7 | Always present (style active) |
| +8 | 15 | Border (描边) enabled |
| +16 | 31 | Background enabled |
| +32 | 63 | Shadow enabled |
| +64 | 127 | Glow (via `extra_material_refs`) |

The `JyProject` wrapper sets these automatically when you pass `border=`, `shadow=`, or `background=` parameters.

---

## 7. Text Animation System (文字动画)

Text animations use the `SegmentAnimations` wrapper with `type: "sticker_animation"`. Three types exist:
- **`in`** (入场/intro) — entrance animation, starts at segment start.
- **`out`** (出场/outro) — exit animation, auto-anchored to segment end.
- **`loop`** (循环/loop) — continuously loops for the entire segment duration.

Apply via `add_text_simple()` kwargs: `anim_in`, `anim_out`, `anim_loop`, plus optional `anim_in_duration`, `anim_out_duration`, `anim_loop_duration`.

```python
project.add_text_simple(
    text="Typewriter subtitle",
    start_time="1s",
    duration="5s",
    anim_in="打字机_I",           # or "Typewriter" (synonym)
    anim_in_duration="0.5s",
    anim_out="渐隐",
    anim_loop="摇摆"
)
```

The `_resolve_enum()` method supports synonyms and fuzzy matching (e.g., `"Typewriter"` → `"复古打字机"`, `"Fade In"` → `"渐显"`).

### 7.1 Text Intro Animations (入场) — `TextIntro`

Default duration: 0.5s unless noted. Free effects listed first.

| Name (Chinese) | resource_id | effect_id | Duration (s) |
|----------------|-------------|-----------|--------------|
| 冲屏位移 | 7078181271393800711 | 1643884 | 0.5 |
| 卡拉OK | 6771294855785091588 | 1558840 | 0.5 |
| 变色输入 | 7397306443147252233 | 77035159 | 0.8 |
| 右上弹入 | 7074854080388010532 | 1621978 | 0.5 |
| 右下擦开 | 7088576340361744903 | 1715294 | 0.5 |
| 向上擦除 | 6774625910067827212 | 1644272 | 0.5 |
| 向上滑动 | 6763470111253729803 | 1644267 | 0.5 |
| 向上翻转 | 7194703971498332727 | 8945307 | 0.5 |
| 向上重叠 | 7077500533040222756 | 1639676 | 0.5 |
| 向上露出 | 7163514358935327268 | 5925717 | 0.5 |
| 向下擦除 | 6774626192990409224 | 1644273 | 0.5 |
| 向下滑动 | 6724921985282871816 | 1644268 | 0.5 |
| 向下露出 | 7163514502128865823 | 5925716 | 0.5 |
| 向下飞入 | 7088942186561016356 | 1719670 | 0.5 |
| 向右擦除 | 6771288500240126478 | 1644271 | 0.5 |
| 向右滑动 | 6724920136056181256 | 1644266 | 0.5 |
| 向右缓入 | 7043778124760224292 | 1488722 | 0.5 |
| 向右集合 | 7081206983461704199 | 1661186 | 0.5 |
| 向右露出 | 7163514730525495839 | 5925714 | 0.5 |
| 向左擦除 | 6774626830038077960 | 1644270 | 0.5 |
| 向左滑动 | 6763470195894784525 | 1644277 | 0.5 |
| 向左露出 | 7163514612690719269 | 5925715 | 0.5 |
| 圆形扫描 | 6840689010034086407 | 1644280 | 0.5 |
| 复古打字机 | 7253888335163167291 | 17639720 | 0.8 |
| 居中打字 | 7265222187286532667 | 20303987 | 0.5 |
| 左上弹入 | 7078586233030447629 | 1646760 | 0.5 |
| 左移弹动 | 7313890082040058406 | 35176342 | 1.0 |
| 开幕 | 6835571502050447879 | 1644279 | 0.5 |
| 弹入 | 6887482184844710413 | 1644313 | 0.5 |
| 弹弓 | 6862897343176380942 | 1644305 | 0.5 |
| 弹性伸缩 | 6872642189260755463 | 1644311 | 0.5 |
| 弹簧 | 6884154692398486023 | 1644312 | 0.5 |
| 彩色映射 | 7039655272222036516 | 1476514 | 0.5 |
| 打字机 I | 6724920249654710791 | 1644275 | 0.5 |
| 打字机 II | 6724920636403094028 | 1644276 | 0.5 |
| 打字机 III | 6724920521462387207 | 1644335 | 0.5 |
| 打字机IV | 7237409385092223525 | 14235879 | 2.0 |
| 扭曲模糊 | 7089261793406620197 | 1722114 | 0.5 |
| 拖尾 | 7244102915239973432 | 15259479 | 0.5 |
| 收拢 | 6779879712261935619 | 1644261 | 0.5 |
| 放大 | 6724919499042066958 | 1644264 | 0.5 |
| 故障打字机 | 6870061463243854350 | 1644308 | 0.5 |
| 旋入 | 6763873859402732039 | 1644265 | 0.5 |
| 日出 | 6779084126457696776 | 1644269 | 0.5 |
| 晕开 | 7088531060341871141 | 1714696 | 0.5 |
| 模糊 | 6923094735116571150 | 1644338 | 0.5 |
| 水墨晕开 | 7278295995362841145 | 22734325 | 1.2 |
| 水平翻转 | 7051512227353858590 | 1644340 | 0.5 |
| 波浪弹入 | 6917178744775905806 | 1644316 | 0.5 |
| 渐显 | 6724916044072227332 | 1644304 | 0.5 |
| 溶解 | 6872642398095151629 | 1644310 | 0.5 |
| 滑动上升 | 7275687883011265083 | 22226771 | 1.5 |

*(~60+ total including VIP variants. Full list in `data/text_animations.csv`.)*

### 7.2 Text Outro Animations (出场) — `TextOutro`

Default duration: 0.5s.

| Name | resource_id | effect_id | Duration (s) |
|------|-------------|-----------|--------------|
| 右上弹出 | 7076006676951732767 | 1631524 | 0.5 |
| 右下擦除 | 7090146831836910110 | 1729286 | 0.5 |
| 向上擦除 | 6774625752794010115 | 1644609 | 0.5 |
| 向上溶解 | 7026619708627489293 | 1644655 | 0.5 |
| 向上滑动 | 6763873533115240968 | 1644605 | 0.5 |
| 向下擦除 | 6774626081791021576 | 1644610 | 0.5 |
| 向下滑动 | 6724919284893487619 | 1644606 | 0.5 |
| 向右擦除 | 6783908820176343566 | 1644615 | 0.5 |
| 向右滑动 | 6724920744431587853 | 1644614 | 0.5 |
| 向右缓出 | 7023684632591733284 | 1451688 | 0.5 |
| 向左擦除 | 6774626748177846791 | 1644608 | 0.5 |
| 向左滑动 | 6763873602476446221 | 1644613 | 0.5 |
| 向左解散 | 7083752251742753287 | 1674332 | 0.5 |
| 圆形扫描 | 6840698265277567496 | 1644617 | 0.5 |
| 弹出 | 6887482090351235592 | 1644648 | 0.5 |
| 弹弓 | 6862897350478664200 | 1644618 | 0.5 |
| 弹簧 | 6884154487246688776 | 1644647 | 0.5 |
| 放大 | 6724919767200698884 | 1644603 | 0.5 |
| 旋出 | 6763873732143354376 | 1644604 | 0.5 |
| 日落 | 6779084194392838670 | 1644607 | 0.5 |

### 7.3 Text Loop Animations (循环) — `TextLoopAnim`

| Name | resource_id | effect_id | Duration (s) |
|------|-------------|-----------|--------------|
| VHS | 7399879467457319463 | 77851352 | 2.0 |
| 上弧 | 7075224569421763079 | 1626238 | 0.5 |
| 刷屏 | 7308280358691148315 | 32284703 | 0.5 |
| 发光模糊多行 | 7397688001356108339 | 77132594 | 0.8 |
| 吹泡泡 | 7045155566003425823 | 1644539 | 0.5 |
| 呐喊 | 7119024816480326157 | 4002167 | 0.5 |
| 复古涂鸦 | 7400234025392017956 | 77997810 | 1.0 |
| 字体变换 | 7402185694732358170 | 78763194 | 0.8 |
| 弹幕滚动 | 6790247082155315719 | 1644518 | 0.5 |
| 彩虹 | 6908592625406710280 | 990096 | 0.5 |
| 彩虹-情人节 | 6916820108211917325 | 1012617 | 0.5 |
| 彩虹-新年 | 6916820045519655432 | 1012618 | 0.5 |
| 彩虹-马卡龙 | 6921528300573561358 | 1022790 | 0.5 |
| 扫光 | 7051843475892867598 | 1520868 | 0.5 |
| 折叠 | 7064823078542381581 | 1567212 | 0.5 |
| 拼贴纹理 | 7399983060806013479 | 77918388 | 0.8 |
| 描边粉笔 | 7399879712140431883 | 77851433 | 2.0 |
| 摇摆 | 6724920869363126795 | 1644515 | 0.5 |
| 摇荡 | 6840710593289130503 | 1644523 | 0.5 |
| 故障闪动 | 6857714281136263687 | 1644524 | 0.5 |
| 旋转 | 6763900973946507784 | 1644510 | 0.5 |
| 晃动 | 6790246693674684942 | 1644520 | 0.5 |
| 爆闪 | 7308279705252139530 | 32284413 | 0.5 |
| 环绕 | 6980916124976157220 | 1644542 | 0.5 |
| 翻转 | 6763897586328801805 | 1644511 | 0.5 |
| 色差故障 | 6835878163575214605 | 1644522 | 0.5 |
| 蓝黄滑动 | 7398492769628459539 | 77383265 | 2.0 |
| 超强晃动 | 7065208406633615909 | 1568854 | 0.5 |
| 超强波浪 | 6857036499389518349 | 872098 | 0.5 |

---

## 8. 花字 (Flower Text) Complete Structure

### Internal JSON structure

花字 effects are stored as materials of `type: "text_effect"`:

```json
{
  "id": "<uuid>",
  "type": "text_effect",
  "effect_id": "<resource_id>",
  "resource_id": "<resource_id>",
  "source_platform": 1,
  "apply_target_type": 0,
  "value": 1.0
}
```

> **Note**: For 花字, `effect_id` and `resource_id` are the **same value**.

The effect is applied to a text segment by:
1. Adding the effect material UUID to the segment's `extra_material_refs`.
2. Referencing the effect ID in the text content JSON's `styles[0].effectStyle.id`.

### The `content` field — double-serialized JSON trap

The text material's `content` field is itself a **JSON-encoded string** (double-serialized). It contains the actual rendered text and per-character styling:

```jsonc
// parse(material.content) →
{
  "styles": [
    {
      "range": [0, 11],                 // UTF-16 code-unit offsets (JS string indices)
      "size": 18,
      "bold": false, "italic": false, "underline": false,
      "fill": {
        "alpha": 1,
        "content": {
          "render_type": "solid",
          "solid": { "alpha": 1, "color": [1.0, 0.84, 0.0] }   // [r,g,b] 0..1 floats
        }
      },
      "strokes": [{
        "width": 0.08,
        "content": { "solid": { "alpha": 1.0, "color": [0.0, 0.0, 0.0] } }
      }],
      "shadows": [{
        "diffuse": 0.025, "alpha": 1.0,
        "distance": 5.0, "angle": -45.0,
        "content": { "solid": { "color": [0.0, 0.0, 0.0] } }
      }],
      "font": { "id": "<resource_id>", "path": "D:" },
      "effectStyle": { "id": "<effect_id>", "path": "C:" }   // ← 花字 reference
    }
  ],
  "text": "Hello world",
  "layer_weight": 1,
  "effect": []
}
```

### ⚠️ `range` is UTF-16 code units

The `range: [start, end]` in `styles[]` is in **UTF-16 code units**, not bytes and not Python characters:
- One BMP character (Latin, Chinese) = 1 unit.
- One emoji / astral character = 2 units (surrogate pair).

### Known 花字 style IDs (from capcut-mate `huazi.json`)

The `config/huazi.json` contains ~200+ 花字 definitions. Each entry has `id` (resource ID), `title` (Chinese display name), and `is_vip`. Notable entries:

| ID | Title | VIP |
|----|-------|-----|
| 7539407429763796249 | 红黄火焰综艺花字 | true |
| 7351316503771368713 | 综艺-黑暗斑驳红色 | true |
| 7403923146862087424 | 蓝白色立体综艺描边花字 | true |
| 7506878563723840783 | 黄字橙光花字 | true |
| 7404884940837473590 | 黑色描边花字 | true |
| 7272728092529986827 | 音乐节-超粗描边 | true |
| 7160594825933262087 | 潮酷橙底黄色渐变立体花字 | true |

The local skill cache (`data/cloud_text_styles.csv`) currently ships 3 free red styles. Run `scripts/build_cloud_text_styles_library.py` to scan and index more.

---

## 9. Text Bubbles / 文本气泡 (Text Shape)

Text bubbles (speech bubble backgrounds) are similar to 花字 but use `type: "text_shape"`:

```json
{
  "id": "<uuid>",
  "type": "text_shape",
  "effect_id": "<effect_id>",
  "resource_id": "<resource_id>",
  "apply_target_type": 0,
  "value": 1.0
}
```

The bubble effect ID is stamped onto the text material as `bubble_effect_id` / `bubble_resource_id`. The `text_shape` material is referenced from the segment's `extra_material_refs`.

---

## 10. Font Resource IDs

Fonts are referenced in the text content JSON's `styles[0].font.id` with the resource ID. The `FontType` enum in `pyJianYingDraft/metadata/font_meta.py` contains 100+ font definitions.

### Notable fonts

| Name | resource_id | effect_id |
|------|-------------|-----------|
| Anton | 6807743423336944142 | 643585 |
| 源云明体 Regular | 7265529744542667322 | 20356563 |
| 源云明体 Medium | 7265529620802310713 | 20356561 |
| Boxing | 7078972382651617805 | 1648729 |
| Cola | 7076270486740537863 | 1632682 |

> Unknown font IDs fall back to the system default font.

---

## 11. SRT Import Details

```python
project.import_srt(r"C:\path\to\subs.srt", track_name="Subtitles")
```

**How it works internally:**
1. Parses the SRT file line by line, extracting cue index, start/end timestamps, and text.
2. Creates one `TextSegment` per cue, all on a `type: "text"` track (default name `"Subtitles"`).
3. Each segment's `target_timerange` maps the SRT cue start/duration (converted from seconds to microseconds).
4. Text style defaults: `TextStyle(size=5.0)` + black border `TextBorder(color=(0,0,0), alpha=1.0, width=40.0)` + `ClipSettings(transform_y=-0.8)`.

**SRT timestamp format expected:** `HH:MM:SS,mmm` (comma milliseconds). The `format_srt_time()` utility handles conversion.

---

## Source

Knowledge extracted from:
- **pyJianYingDraft** source: `metadata/text_intro.py`, `metadata/text_outro.py`, `metadata/text_loop.py`, `metadata/font_meta.py` — the authoritative animation/font ID tables.
- **capcut-mate**: `config/huazi.json` (~200+ 花字 definitions), `src/service/get_text_effects.py`, `src/schemas/add_captions.py`.
- **capcut-cli** (`renezander030`): text content double-serialization, UTF-16 range offsets, bubble-text structure.
