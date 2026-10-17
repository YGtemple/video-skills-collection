---
name: core
description: Core JyProject operations including saving, exporting, draft structure, and low-level JSON manipulation.
metadata:
  tags: core, save, export, save_project, draft-structure, json, lock, audit
---

# Core Operations

All operations are performed through the `JyProject` instance.

## 创建项目 (Project Creation)

在初始化 `JyProject` 时，请务必根据主视频素材的比例设置分辨率。**默认值为横屏 (1920x1080)**。

```python
# 默认：横屏 (16:9)
project = JyProject("Horizontal_Project") 

# 竖屏 (9:16)：必须在初始时指定，否则会有黑边
project = JyProject("Portrait_Project", width=1080, height=1920)
```


## Saving

You **MUST** call `project.save()` at the end of your script. 
This operation not only saves the JSON changes but also triggers a refresh in the Jianying UI (if applicable) or ensures the filesystem is synced.

```python
# Save changes and refresh draft state
project.save()
```

## Template-Based Production (Mass Creation)

For heavy-duty automation scenarios (e.g., creating 100 personalized ads from 1 template), follow the **Clone-First** strategy:

### 1. Secure Cloning
**CRITICAL**: Never modify the shared "Template Draft" directly. Always create a volatile copy.

```python
# Create a new draft copy based on an existing template
project = JyProject.from_template("Master_Template", "Target_Customer_A")
```

### 2. Semantic Slot Replacement (Planned)
> **注意**：以下方法尚未实现，计划中。目前请手动编辑 `draft_content.json` 或使用 `JyProject.from_template()` 后重新添加素材。

```python
# [TODO] 这些 API 尚在开发中
# project.replace_material_by_name("Intro_Slot", "C:/user/video.mp4")
# project.reconnect_all_assets("D:/local_media_root")
```

## Automated Exporting

You can trigger a headless export (using `uiautomation`) without manual clicking:

```bash
# Using the CLI tool
python <SKILL_ROOT>/scripts/auto_exporter.py "ProjectName" "custom_output.mp4" --res 1080 --fps 60
```

## Constraints

- **Draft Recognition**: The wrapper automatically handles `DraftFolder` structure. Do not manually manipulate `draft_content.json` unless you know exactly what you are doing.
- **Exporting Requirements**: Auto-exporting only works on **Windows** with **Jianying v5.9 or lower**. It relies on `uiautomation` to interact with the UI.
- **UI Refresh**: After the script runs, if Jianying is open, the user may need to exit and re-enter the draft to see changes.

## Quick Edit Execution Template (Standard)

For generic requests like "来个剪辑", execute in this order:

1. Minimal environment checks (python + drafts root)
2. Resolve required assets (local first, cloud second)
3. Generate one deterministic edit script
4. Run script once and collect output
5. Perform acceptance checks and report concrete results

## Acceptance Checks (Standard)

After execution, verify:

- Draft directory exists
- Save completed (`project.save()` success)
- At least one segment exists on a video track
- BGM (if used) is on audio track
- Narration/subtitle pairing exists when TTS was requested

---

## 草稿目录结构 (Draft Directory Structure)

A JianYing/CapCut project is a **directory**, not a single file. The `JyProject` wrapper hides this, but understanding the on-disk layout is essential for debugging, migration, and advanced manipulation.

```
<draft-id>/
├── draft_content.json      ← Primary timeline JSON (Windows JianYing/CapCut)
├── draft_info.json         ← macOS JianYing / newer builds (wrapper around the same timeline)
├── draft_meta_info.json    ← name, cover, created/modified times, draft_materials[] (sidecar registration)
├── draft_agency_config.json
├── draft_biz_config.json
├── draft_settings/
├── performance_opt_info.json
├── common_attachment/
├── attachment_editing.json
├── attachment_pc_common.json
└── assets/                 ← local copies of every imported clip
    ├── video/
    ├── audio/
    └── image/
```

### Key files explained

| File | Purpose |
|------|---------|
| `draft_content.json` | The main timeline document. Contains `tracks[]`, `materials{}`, `duration`, `fps`, `canvas_config`. On JianYing 6.0+ this may be **encrypted** (opaque payload, not plain JSON). |
| `draft_info.json` | macOS JianYing primary file. Newer builds wrap the timeline under a `draft_info` envelope key — the actual timeline JSON may be nested one or two levels deep. |
| `draft_meta_info.json` | Sidecar metadata. Crucially contains `draft_materials[]` which registers every imported local asset. **If a material's path is not registered here, clips show "file inaccessible" / 媒体不可访问.** |
| `root_meta_info.json` | Lives at the drafts root level (not inside a draft). Lists every draft so the app shows them in its project list. **A draft not listed here will not appear in JianYing.** |

### Platform-specific draft roots

| OS | JianYing (剪映) | CapCut |
|----|-----------------|--------|
| **Windows** | `%LOCALAPPDATA%\JianyingPro\User Data\Projects\com.lveditor.draft\` | `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\` |
| **macOS** | `~/Movies/JianyingPro/User Data/Projects/com.lveditor.draft/` | `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/` |

The `JyProject` constructor auto-detects the platform and uses the correct root. On macOS, `get_jianying_drafts_root_macos()` is called automatically.

### Platform marker inside the JSON

```jsonc
"platform": { "app_source": "lv", "app_version": "6.5.0", "os": "win" }
```

- `app_source`: `"lv"` = JianYing, `"cc"` = CapCut.
- Decorative resource IDs (effects, transitions, filters, masks) **differ between CapCut and JianYing builds**. A CapCut `effect_id` written into a JianYing draft loads but renders as a no-op.

### ⚠️ JianYing 6.0+ encryption

JianYing 6.0+ may write `draft_content.json` as an **encrypted payload** rather than plain JSON. On such stores, direct JSON manipulation is impossible — you must use the `JyProject` wrapper which reads through the app's own format.

---

## Loading Existing Drafts vs Creating New Ones

### Creating a new draft

```python
# Creates a fresh, empty draft. If one with the same name exists, overwrite=True replaces it.
project = JyProject("My_New_Project", width=1920, height=1080)

# If overwrite=False and the draft already exists, it LOADS the existing draft instead.
project = JyProject("Existing_Project", overwrite=False)
```

### Loading an existing draft

When `overwrite=False` and the draft already exists on disk:

1. `JyProjectBase.__init__()` checks `DraftFolder.has_draft(name)`.
2. If `draft_content.json` or `draft_meta_info.json` is missing → corrupted draft detected. With `overwrite=True` the corrupted folder is auto-removed; with `overwrite=False` it prints a warning and falls back to recreate.
3. Otherwise it calls `self.df.load_template(self.name)` to deserialize the existing timeline.
4. You can then add segments, edit text, etc., and call `project.save()` to write back.

```python
# Load an existing draft for editing
project = JyProject("My_Existing_Video", overwrite=False)
# ... add clips, text, effects ...
project.save()  # writes back to the same draft directory
```

### Template clone workflow (mass production)

For templated batch production (e.g., 100 variants from one master template):

1. **Build the master template** in JianYing manually, with placeholder slots (named segments, placeholder text).
2. **Clone the template** via `JyProject.from_template("Master_Template", "Variant_001")`.
3. **Modify the clone** — swap text, replace media, adjust timing.
4. **Save** the clone. The master template is never touched.
5. Repeat for each variant.

```python
# Clone-First strategy: never edit the master directly
master = "Holiday_Template"
for customer_id in ["CUST_A", "CUST_B", "CUST_C"]:
    proj = JyProject.from_template(master, f"Holiday_{customer_id}")
    # Edit the clone: replace placeholder text, swap background video
    # ...
    proj.save()
```

---

## Project Lock Handling (项目锁处理)

JianYing locks a project when it is open in the editor. Attempting to write to a locked draft raises `PermissionError`.

### Automatic lock release

`JyProjectBase` has built-in lock handling with up to **3 retries**:

```python
# This happens automatically inside JyProject.__init__() when PermissionError occurs
max_retries = 3
for attempt in range(max_retries):
    try:
        self.script = self.df.create_draft(self.name, width, height, allow_replace=overwrite)
        break
    except PermissionError:
        if attempt < max_retries - 1:
            released = self._try_release_project_lock()
            if released:
                print("Detected project lock. Switched JianYing to home page, retrying...")
            else:
                print("[!] 剪映正在占用该项目，自动释放失败。请手动切回主界面后重试。")
            time.sleep(2)
        else:
            raise
```

### How `_try_release_project_lock()` works

1. Imports `JianyingController` from `pyJianYingDraft.jianying_controller`.
2. Checks `app_status`:
   - `"home"` → already on home page, just release topmost.
   - `"pre_export"` → sends `{Esc}` key to exit export dialog, re-checks.
   - `"edit"` → calls `ctl.switch_to_home()` to exit the current draft.
3. Returns `True` if the app reached the home page (lock released), `False` otherwise.

### Manual intervention

If auto-release fails, the user must:
1. Open JianYing.
2. Navigate back to the project list / home screen (exit the currently open draft).
3. Re-run the script.

**Best practice**: Always close the draft in JianYing before running an automated script that writes to it.

---

## Timeline Audit and Quality Checks

### Built-in audit

`JyProject.audit_timeline(track_details)` detects potential issues:

```python
# Called internally during save, or can be called manually:
project.audit_timeline(track_details)
```

**What it checks:**
- **High repetition detection**: If the same source file at the same source offset is used more than 5 times on the timeline, it prints a warning. This catches accidental duplicate clip pasting.

### Standard acceptance checklist

After every edit script runs, verify:

| Check | How |
|-------|-----|
| Draft directory exists | `os.path.exists(os.path.join(project.root, project.name))` |
| `project.save()` returned success | Check the return dict `{"status": "SUCCESS", ...}` |
| At least one video segment exists | Iterate `script.tracks`, find `type=="video"` tracks with non-empty `segments` |
| BGM on audio track | Find `type=="audio"` track, check `segments` |
| TTS/subtitle pairing | If narration was requested, check both audio track and text track have matching time ranges |
| No overlapping segments on same track | The wrapper's `_track_accepts_segment()` already prevents this, but verify post-save |

### Timeline inspection tools

Use the diagnostic scripts to inspect existing drafts:

```bash
# List all drafts on the system
python <SKILL_ROOT>/scripts/diag_drafts.py

# Inspect a specific draft's structure
python <SKILL_ROOT>/scripts/draft_inspector.py "DraftName"
```

---

## Direct `draft_content.json` Manipulation (Bypassing the Wrapper)

### When to bypass JyProject

The `JyProject` wrapper covers 95% of use cases. However, **direct JSON editing** is required when:

1. **The wrapper lacks a needed feature** (e.g., chroma key, mix modes, custom masks, advanced color grading).
2. **Bulk batch operations** on hundreds of drafts where instantiating the Python overhead is undesirable.
3. **Migration / repair** of corrupted drafts, or converting between CapCut ↔ JianYing formats.
4. **Reading** draft metadata (duration, track count, material list) without loading the full object model.

### When NOT to bypass

- **Never** bypass for simple text/media/effect insertion — the wrapper handles all the companion material registration, sidecar updates, and path management correctly.
- The wrapper automatically patches cloud material IDs and activates adjustments on `save()`. Bypassing this means those patches are lost.

### How to directly edit

```python
import json, os

draft_dir = os.path.join(project.root, project.name)
content_path = os.path.join(draft_dir, "draft_content.json")

with open(content_path, "r", encoding="utf-8") as f:
    draft = json.load(f)

# Read top-level fields
print("Duration (µs):", draft["duration"])
print("FPS:", draft["fps"])
print("Tracks:", len(draft["tracks"]))
print("Videos:", len(draft["materials"]["videos"]))

# Modify a field
draft["duration"] = 6000000  # 6 seconds

with open(content_path, "w", encoding="utf-8") as f:
    json.dump(draft, f, ensure_ascii=False)
```

### Critical rules for direct JSON editing

1. **Time is always microseconds** (1 second = 1,000,000 µs) everywhere: `duration`, `target_timerange`, `source_timerange`, keyframe `time_offset`, transition `duration`.
2. **Encoding: UTF-8, no BOM.** A BOM will break JianYing's parser.
3. **`tracks` and `materials` are flat and decoupled.** A segment references its material by `material_id` — never inline the material. To find what a segment is, go `segment.material_id` → `materials.<type>`.
4. **Preserve unknown fields.** The format is overspecified; many fields exist that JianYing sets to defaults and ignores. **Do not delete unknown fields** — preserve the structure or JianYing may misbehave.
5. **Paths are absolute** in `materials.*.path`. Relative paths break JianYing.
6. **Sidecar registration**: If you add a new media file directly to `materials.videos[]`, you must also register it in `draft_meta_info.json → draft_materials[]`, otherwise every clip shows "file inaccessible".
7. **App-version markers**: Modern JianYing builds may refuse a draft lacking `version` (number), `new_version` (string), and `last_modified_platform` markers. The wrapper handles these automatically; if hand-editing, preserve whatever was already there.

### The four segment fields that matter

Every segment, regardless of track type:

| Field | Purpose |
|-------|---------|
| `material_id` | Links to the material in `materials.videos/audios/texts/...` |
| `target_timerange` | `{start, duration}` — where/how long the segment plays **on the timeline** (µs) |
| `source_timerange` | `{start, duration}` — which in/out point of the **source material** (µs). For text this is usually `{start:0, duration: target_duration}`. |
| `extra_material_refs` | Array of companion material UUIDs (speed, animation, effect, mask, transition, chroma, mix_mode, canvas) |

### Top-level timeline structure

```jsonc
{
  "id": "uuid",
  "name": "My Project",
  "duration": 6000000,          // microseconds — total timeline length
  "fps": 30,
  "canvas_config": { "width": 1920, "height": 1080, "ratio": "16:9" },
  "platform": { "app_source": "lv", "app_version": "6.5.0", "os": "win" },
  "tracks": [ /* ordered list; array order = z-order: first = bottom, last = top */ ],
  "materials": { /* flat dictionary of categorized arrays: videos, audios, texts, video_effects, transitions, masks, chromas, speeds, audio_fades, ... */ },
  "keyframes": [],
  "animations": []
}
```

### Envelope unwrapping (macOS gotcha)

Newer macOS JianYing builds may wrap the timeline. If `draft_info.json` doesn't have top-level `tracks` and `materials`, recursively look for an object that has both — it may be nested under `draft_content`, `draft_info`, `timeline`, `content`, or `data` keys, or even double-JSON-stringified.

---

## Source

Knowledge extracted from open-source projects:
- **pyJianYingDraft** (`FreedomIntelligence`-derived) — the underlying library powering `JyProject`.
- **pyCapCut** (`Hadas7/pyCapCut`) — class-based OO wrapper that bundles a real CapCut `draft_content.json` template.
- **capcut-mcp** (`fancyboi999`) — FastAPI/HTTP MCP server wrapping a fork of `pyJianYingDraft`.
- **capcut-cli** (`renezander030`) — Zero-dependency Node/TS CLI that reads/writes the JSON directly.

These three projects agree on the on-disk schema; they differ only in ergonomics.
