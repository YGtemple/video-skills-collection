# Community Tools Reference — 9 Open-Source JianYing/CapCut Projects

> Consolidated comparison of the open-source ecosystem around JianYing (剪映) / CapCut draft automation.
> This skill's `JyProject` desktop-automation layer builds on top of the same draft JSON schema that these projects manipulate. Use this reference to decide when to lean on an external project vs. the built-in `JyProject` approach.

---

## Quick Comparison Table

| # | Project | Author | Language | Protocol | Stars (≈) | License | Draft approach | Cloud render | Desktop hot-reload |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **capcut-mate** | Hommy-master | Python (FastAPI) | HTTP REST (39 endpoints) | ~1k | MIT | Direct file write via FastAPI service | Optional (JianYing cloud API trigger) | No (deploy + reload via API) |
| 2 | **pyJianYingDraft** | GuanYixuan | Python | Library (pip) | ~2k | Apache 2.0 | Class-based OO wrapper over bundled template | No | No (you open manually) |
| 3 | **pyCapCut** | GuanYixuan | Python | Library (pip) | ~300 | Apache 2.0 | Class-based OO wrapper (international CapCut) | No | No |
| 4 | **VectCutAPI** | sun-guannan | Python (Flask) | REST + MCP (Py) + MCP (TS) | 800+ | Apache 2.0 | Direct file write via embedded pyJianYingDraft | Partial (OSS upload; render module closed) | Yes (Windows `ctypes`) |
| 5 | **jianying-mcp** | hey-jian-wei | Python (FastMCP) | MCP only (stdio) | ~200 | Apache 2.0 | Two-phase JSON state → pyJianYingDraft export | No | No |
| 6 | **capcut-mcp-server** | Atx-Guy | TypeScript/Node | MCP only (stdio/HTTP) | ~100 | MIT | None — thin proxy to VectCutAPI | No (delegated) | Yes (delegated) |
| 7 | **capcut-mcp** | fancyboi999 | Python (FastAPI) | HTTP/MCP server | ~150 | MIT | Fork of pyJianYingDraft + remote_url download + FFmpeg | No | No |
| 8 | **capcut-ai-editor** (SmartCut) | mrbuslov | Python 3.10+ | MCP (stdio, 8 tools) | ~300 | MIT | Direct read/edit of `draft_info.json` in place | No | No (you reopen CapCut) |
| 9 | **capcut-cli** | renezander030 | Node/TS | CLI (60+ commands, zero deps) | ~400 | MIT | Direct JSON read/write; hand-rolled factory | No (ffmpeg proxy preview only) | No |

---

## 1. capcut-mate (Hommy-master)

- **GitHub**: https://github.com/Hommy-master/capcut-mate
- **Stars**: ~1k
- **License**: MIT
- **Language**: Python 3.11+ (FastAPI + Pydantic)
- **What it is**: A self-hosted FastAPI service that exposes 39 REST endpoints for programmatic JianYing draft creation. Writes `draft_content.json` directly to disk and can optionally trigger cloud rendering via the JianYing API.

### Key capabilities
- 39 REST endpoints under `http://localhost:30000/openapi/capcut-mate/v1/`
- Endpoints: `create_draft`, `save_draft`, `get_draft`, `add_videos`, `add_audios`, `add_texts`, `add_effects`, `add_transitions`, `add_filters`, `add_keyframes`, `add_stickers`, etc.
- Async lock per `draft_url` (30s timeout) to prevent concurrent corruption
- All times in **microseconds**
- Returns a `draft_url` on `create_draft` that you pass to every subsequent call
- Detailed OpenAPI schema with request/response models

### How it manipulates drafts
Direct file write — the service builds the `draft_content.json` in memory and flushes it to disk on `save_draft`. No desktop automation; you open the draft in JianYing manually (or trigger cloud render).

### When to use it vs. JyProject desktop automation
- **Use capcut-mate** when you want a **stateless HTTP API** (e.g., a web service, CI/CD pipeline, or cross-language client) that builds drafts without installing the desktop app.
- **Use JyProject** when you want the **Python OO wrapper** with auto-deploy to the JianYing projects directory, UI hot-reload, screen recording, web VFX capture, and TTS — i.e., the full desktop production loop.

> Full endpoint reference: [references/capcut-mate-api.md](capcut-mate-api.md)

---

## 2. pyJianYingDraft (GuanYixuan)

- **GitHub**: https://github.com/GuanYixuan/pyJianYingDraft
- **Stars**: ~2k (the most popular JianYing draft library)
- **License**: Apache 2.0
- **Language**: Python
- **What it is**: The foundational Python library that most other projects (VectCutAPI, jianying-mcp, this skill's `JyProject`) build on. It is a class-based OO wrapper around the JianYing `draft_content.json` schema.

### Key capabilities
- `Script_file`, `Video_material`, `Audio_material`, `Text_material`, `Video_segment`, `Audio_segment`, `Text_segment`, `Track` classes
- Bundles a real CapCut/JianYing `draft_content.json` template and mutates it
- Python `Enum` classes for `Transitions`, `Masks`, `Animations`, `Effects`, `Fonts` with hard-coded resource IDs per build
- `KeyframeProperty` enum (used by `rules/keyframes.md`)
- `Opener` writes `draft_meta_info.json` so the draft appears in the app
- `script.dump()` overwrites `draft_content.json`

### How it manipulates drafts
**In-memory object model → serialized to a bundled template.** You instantiate `Script_file`, add tracks/segments/materials, then call `dump()` to write the JSON. No automatic backups, no desktop automation.

### When to use it vs. JyProject desktop automation
- **Use pyJianYingDraft directly** when you need **low-level schema control**, want to embed draft generation in another Python library, or need access to enums (Transitions, Masks, Animations) that JyProject wraps but does not always expose.
- **Use JyProject** when you want the **batteries-included wrapper**: `add_media_safe` (auto type detection + WEBM normalization), `add_tts_intelligent`, `add_cloud_media`, `apply-zoom`, screen recording, web VFX capture, auto-export CLI, and the bootstrap path resolution.

> This skill's `JyProject` is a thin, opinionated wrapper over pyJianYingDraft. Read [references/draft-json-schema.md](draft-json-schema.md) for the underlying schema.

---

## 3. pyCapCut (GuanYixuan)

- **GitHub**: https://github.com/GuanYixuan/pyCapCut
- **Stars**: ~300
- **License**: Apache 2.0
- **Language**: Python
- **What it is**: The international (CapCut) counterpart to pyJianYingDraft. Same class design, same template approach, but targets CapCut's schema (`app_source: "cc"`).

### Key capabilities
- Identical class hierarchy: `Script_file`, `Video_segment`, `Text_segment`, etc.
- Bundles a real CapCut `draft_content.json` template (plus `draft_meta_info.json`, `video.json`, `audio.json`, `text.json`, `effect.json`, `transition.json`, `mask.json`, `canvas.json`)
- Stores **absolute media paths verbatim** (no copy into the draft's `assets/` folder)
- Targets CapCut desktop on macOS/Windows

### How it manipulates drafts
Same as pyJianYingDraft: in-memory OO model → mutate bundled template → dump JSON.

### When to use it vs. JyProject desktop automation
- **Use pyCapCut** when you specifically target **CapCut international** (not JianYing China) and need direct class control.
- **Use JyProject** when you target **JianYing Pro (China)** and want the desktop automation layer (recording, TTS, cloud assets, auto-export).

---

## 4. VectCutAPI (sun-guannan)

- **GitHub**: https://github.com/sun-guannan/VectCutAPI
- **Stars**: 800+
- **License**: Apache 2.0
- **Language**: Python 3.10+ (Flask + MCP)
- **What it is**: The most feature-complete open-source draft-automation server. Three layered interfaces (Python MCP, Flask REST, TypeScript MCP proxy) all on top of an embedded pyJianYingDraft core.

### Key capabilities
- **Dual protocol**: The only project exposing both HTTP REST (Flask, port 9001) and MCP (Python stdio + TypeScript stdio/HTTP)
- **11 Python MCP tools** / **~20 REST routes** / **14 TypeScript MCP tools**
- **Cloud OSS upload**: Zips the draft folder and uploads to Alibaba Cloud OSS with 24-hour signed URLs
- **Web preview player**: SSE-based live broadcast for real-time web preview
- **Desktop hot-reload**: Windows-only GUI automation via `ctypes` — clicks "Back to Homepage" then clicks the latest project card
- **Auto-deploy**: Copies draft to CapCut/JianYing projects directory and clears `.locked` files
- **Media metadata auto-resolution**: `ffprobe` auto-fills duration/width/height; auto-clamps segment timeranges to fit actual media
- **Conflict resolution**: Auto-detects and deletes overlapping segments within a track
- **Pending keyframe processing**: Keyframes can be added before segments exist; processed at save time
- **Multi-profile**: 3 draft format profiles (`capcut_legacy`, `jianying_legacy`, `jianying_pro_10`)
- **11 GET metadata endpoints** to enumerate animations, transitions, masks, effects, fonts

### How it manipulates drafts
**Direct file write via embedded pyJianYingDraft.** Copies a template directory, downloads media assets (16-worker thread pool, exponential backoff), writes `draft_content.json` / `draft_info.json`, then optionally zips + uploads to OSS.

### When to use it vs. JyProject desktop automation
- **Use VectCutAPI** when you need a **server/headless architecture**: cloud OSS upload, web preview, REST API for non-Python clients, or multi-profile draft support.
- **Use JyProject** when you want a **local Python script** that directly drives the desktop app (recording, TTS, web VFX, smart zoom) without standing up a Flask server.

---

## 5. jianying-mcp (hey-jian-wei)

- **GitHub**: https://github.com/hey-jian-wei/jianying-mcp
- **Stars**: ~200
- **License**: Apache 2.0
- **Language**: Python 3.13+ (FastMCP, stdio)
- **What it is**: An MCP server with a two-phase state-machine architecture. Accumulates operations as JSON, then exports to a JianYing draft in one final step.

### Key capabilities
- **20 MCP tools** across draft/track/video/audio/text/utility groups
- **`rules` tool**: Returns a detailed workflow prompt that instructs the AI agent how to correctly sequence tool calls (create_draft → create_track → add_segment → apply_effects → export)
- **Two-phase export**: Phase 1 accumulates JSON operation records under `SAVE_PATH/<draft_id>/`; Phase 2 (`export_draft`) builds pyJianYingDraft objects and saves
- **Effect resource discovery**: `find_effects_by_type` searches JianYing's built-in effect metadata (15 resource types) with VIP filtering and keyword search
- **Exact-match validation**: Verifies effect/animation names exist in the resource database; suggests alternatives if not found
- **Validators**: `material_validator.py` and `overlap_validator.py`
- **Explicit time format**: Uses human-readable strings like `"1s-4.2s"` and `"500ms"` rather than raw seconds

### How it manipulates drafts
**Two-phase JSON state machine → pyJianYingDraft export.** All operations are recorded as JSON entries per `segment_id`; at export time they are grouped and applied.

### When to use it vs. JyProject desktop automation
- **Use jianying-mcp** when you want an **MCP-native AI agent workflow** with explicit operation sequencing rules, effect discovery, and design-time validation before export.
- **Use JyProject** when you want a **direct Python script** with immediate effect (no two-phase accumulation), plus recording/TTS/web-VFX that jianying-mcp does not provide.

---

## 6. capcut-mcp-server (Atx-Guy)

- **GitHub**: https://github.com/Atx-Guy/capcut-mcp-server
- **Stars**: ~100
- **License**: MIT
- **Language**: TypeScript/Node.js
- **What it is**: A thin TypeScript MCP proxy layer that wraps VectCutAPI's Flask REST backend. It manipulates no drafts itself.

### Key capabilities
- **14 MCP tools** (Zod-validated): `capcut_create_draft`, `capcut_add_video`, `capcut_add_audio`, `capcut_add_text`, `capcut_add_image`, `capcut_add_subtitle`, `capcut_add_keyframe`, `capcut_add_effect`, `capcut_add_sticker`, `capcut_save_draft`, `capcut_get_duration`, `capcut_list_projects`, `capcut_read_project`, `capcut_reload_desktop`
- **TypeScript-native**: Full type safety with Zod schemas
- **Dual transport**: stdio (local) or HTTP (remote, `TRANSPORT=http PORT=3000`)
- **Dual output format**: Each tool supports `response_format: "markdown"` or `"json"`
- **MCP annotations**: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` for better client integration
- **Rich error handling**: HTTP status code mapping (404/400/500/429)

### How it manipulates drafts
**None directly.** Every tool call makes an HTTP POST to VectCutAPI's Flask server on `http://localhost:9001`. Requires VectCutAPI running.

### When to use it vs. JyProject desktop automation
- **Use capcut-mcp-server** when your MCP client is **TypeScript/Node-based** and you want type-safe access to VectCutAPI's capabilities.
- **Use JyProject** when you want a **Python, local, single-script** workflow without running a Flask server.

---

## 7. capcut-mcp (fancyboi999)

- **GitHub**: https://github.com/fancyboi999/capcut-mcp
- **Stars**: ~150
- **License**: MIT
- **Language**: Python (FastAPI/uvicorn)
- **What it is**: A FastAPI/HTTP MCP server that wraps a fork of pyJianYingDraft. Adds `remote_url` media download and FFmpeg metadata probing on top of the class model.

### Key capabilities
- Function-per-tool layer: `create_draft`, `add_video_track`, `add_audio_track`, `add_text_track`, etc.
- Downloads `remote_url` media to local disk
- Probes media metadata (duration, width, height) via FFmpeg at save time
- Sits between the raw pyJianYingDraft library and a web/HTTP client

### How it manipulates drafts
**Function-per-tool over a pyJianYingDraft fork.** Similar to VectCutAPI but lighter: no OSS upload, no web preview, no desktop hot-reload.

### When to use it vs. JyProject desktop automation
- **Use capcut-mcp** when you want a **lightweight HTTP server** that accepts remote URLs and probes metadata, without VectCutAPI's heavier cloud/OSS features.
- **Use JyProject** when you want the **local desktop loop** (recording, TTS, cloud assets, smart zoom, web VFX) rather than an HTTP service.

---

## 8. capcut-ai-editor / SmartCut (mrbuslov)

- **GitHub**: https://github.com/mrbuslov/capcut-ai-editor
- **Stars**: ~300
- **License**: MIT
- **Language**: Python 3.10+ (MCP stdio, 8 tools)
- **What it is**: A talking-head smart-cut tool. Reads CapCut's auto-generated subtitle tracks, finds long pauses and repeated takes, then deletes those time ranges directly from the draft JSON.

### Key capabilities
- **8 MCP tools**: list projects, load project, get subtitles, find gaps, find duplicate takes, merge time ranges, remove time ranges, save
- **Silence detection via subtitle gaps**: If two subtitle blocks are separated by >1.0 s, the gap is cut (no dB/RMS analysis — relies on CapCut's built-in ASR)
- **Duplicate-take detection**: Finds repeated "takes" where the speaker restarted a sentence; optional OpenAI GPT pass for better grouping (default similarity threshold 0.6)
- **In-place editing**: Splits surviving segments, re-maps `source_timerange`, shifts `target_timerange` left by cumulative cut duration, drops orphaned text materials, recomputes project duration
- **Piggybacks on CapCut ASR**: User records video → imports into CapCut → runs Text → Auto Captions → closes CapCut → this tool reads the resulting subtitle JSON

### How it manipulates drafts
**Direct read/edit of `draft_info.json` + `draft_meta_info.json` in place** (no backup — README warns about this). Modifies segment `timerange`/`target_timerange`/`source_timerange` across all tracks.

### When to use it vs. JyProject desktop automation
- **Use capcut-ai-editor (SmartCut)** when you need **talking-head automation**: remove silences and repeated takes from an interview/lecture video automatically.
- **Use JyProject** for the **broader editing loop** (adding clips, TTS, subtitles, effects, recording) — SmartCut is a single-purpose post-pass.

> This skill's `rules/talking-head.md` (planned) wraps this capability.

---

## 9. capcut-cli (renezander030)

- **GitHub**: https://github.com/renezander030/capcut-cli
- **Stars**: ~400
- **License**: MIT
- **Language**: Node/TypeScript (zero runtime dependencies)
- **What it is**: A 60+ command zero-dependency CLI that directly reads/writes `draft_content.json`. Ships as a single compiled `dist/index.js`.

### Key capabilities
- **Zero deps**: Uses only Node stdlib (`node:fs`, `node:crypto`, `node:path`, `node:child_process`)
- **Atomic writes**: temp file + rename, leaves a `.bak`; `restore` undoes N writes; `--dry-run` previews
- **Write safety**: Refuses to write while the editor is running (unless `--force-write`); guards against changed-on-disk and version-boundary issues
- **Read-only inspection**: `info`, `version`, `lint`, `tracks`, `segments`, `texts`, `materials`, `timeline`, `projects`, `diff`, `diagnose`, `doctor`
- **Create**: `init`, `quickstart`, `compile` (declarative JSON spec → whole draft; `--data` JSONL for batch)
- **Add**: `add-video`, `add-audio`, `add-text`, `tts`, `add-sticker`, `add-effect`, `add-filter`, `add-cover`, `add-sfx`
- **Edit**: `set-text`, `shift`/`shift-all`, `speed`/`volume`/`opacity`, `trim`, `crop`, `duplicate`, `remove`, `cut`, `prune`, `replace-media`, `relink`, `concat`, `batch`, `restore`
- **Animation**: `keyframe` (11 properties, 4 easing modes), `transition`, `mask`, `bg-blur`, `text-style`, `text-ranges`, `text-anim`, `image-anim`, `bubble-text`, `audio-fade`, `mix-mode`, `chroma`, `matting`
- **Subtitles**: `import-srt`, `import-ass`, `export-srt`, `export-ass`, `caption` (Whisper auto-caption with karaoke word ranges + keyword highlight)
- **Discovery**: `enums` (14 categories), `catalogue`, `harvest-enums` (learn resource IDs from app-authored drafts)
- **Analysis**: `render` (ffmpeg proxy preview), `detect-scenes`, `detect-silence`, `detect-retakes`
- **`describe` emits the full command surface as JSON** — designed for agent pipelines

### How it manipulates drafts
**Direct JSON read/write with a hand-rolled `factory.ts`.** Uses a minimal 491-byte JSON skeleton template and builds materials/segments by hand. Copies source files into `<draft>/assets/{video,audio}/` with SHA1 collision-safe dedup.

### When to use it vs. JyProject desktop automation
- **Use capcut-cli** when you want a **fast, dependency-free CLI** for scripted/batch draft manipulation, linting, declarative `compile`, or Whisper auto-captioning — especially in a Node.js/CI environment.
- **Use JyProject** when you want the **Python desktop loop**: screen recording, TTS voiceover, cloud asset search, web VFX capture, smart zoom, and JianYing Pro-specific APIs.

> Full command reference: see the extracted `capcut-cli-reference.md` knowledge.

---

## Choosing the Right Tool

| Need | Best choice |
|---|---|
| Quick Python script on desktop, recording + TTS + cloud assets | **JyProject** (this skill) |
| Low-level schema access, custom enum discovery | **pyJianYingDraft** |
| Stateless HTTP API for a web service | **capcut-mate** or **VectCutAPI** |
| MCP-native AI agent workflow with two-phase export | **jianying-mcp** |
| TypeScript MCP client | **capcut-mcp-server** (needs VectCutAPI backend) |
| Talking-head silence / repeated-take removal | **capcut-ai-editor (SmartCut)** |
| Zero-dep CLI, batch linting, declarative compile, Whisper captions | **capcut-cli** |
| Cloud OSS upload + web preview + desktop hot-reload | **VectCutAPI** |
| International CapCut (not JianYing China) | **pyCapCut** |

> **Note**: This integrated skill combines the desktop-automation strengths of JyProject with the draft-JSON knowledge extracted from all 9 projects. When a community project exposes a capability JyProject lacks (e.g., capcut-cli's `lint --fix`, or SmartCut's gap detection), the corresponding rule file (`rules/batch-export.md`, `rules/talking-head.md`) documents how to call it.
