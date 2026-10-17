---
name: batch-export
description: Batch/headless export and automation — local Windows auto-export, remote Windows Export Agent, macOS remote workflow, batch processing patterns, draft validation, export parameters, error handling, SRT-only export.
metadata:
  tags: batch, export, headless, automation, windows-agent, srt, resolution, fps, validation
---

# 批量/无头导出与自动化 (Batch Export & Automation)

> 本文档覆盖所有导出路径：本地 Windows 自动导出、远程 Windows Export Agent、macOS 远程导出、批量处理模式、草稿校验、导出参数、错误处理。
>
> **Source attribution**: extracted from jianying-editor existing codebase, VectCutAPI, jianying-mcp, capcut-cli

---

## 0. 现实检查：无头导出的真相 (Reality Check)

**没有真正的无头 MP4 渲染存在。** 剪映/CapCut 没有提供 API 或命令行来直接编码 MP4。所有"自动导出"方案本质上都是：

1. **生成草稿文件**（JSON）→ ✅ 完全自动化
2. **自动打开剪映 + 点击导出按钮** → ⚠️ 依赖 Windows UI 自动化 (`uiautomation`)
3. **桌面热重载** → ❌ 只是重新打开项目，**不点击导出按钮**

| 能力 | 状态 | 说明 |
|---|---|---|
| 生成草稿文件 | ✅ 完全自动化 | 所有方案都支持 |
| 自动部署到剪映目录 | ✅ | 复制到 projects 目录 |
| 桌面热重载（重新打开项目） | ✅ (Windows) | ctypes/uiautomation 点击项目卡片 |
| **自动点击导出按钮** | ⚠️ 有限 | 依赖 uiautomation，仅 Windows + 剪映 v5.9- |
| 云端渲染到 MP4 | ❌ 闭源 | VectCutAPI 云渲染未开源 |
| 真正无头渲染（不打开 GUI） | ❌ 不存在 | 必须打开剪映桌面版 |

**结论**：自动化管线的终点是"生成草稿 + 触发导出"，最后的编码仍在剪映 GUI 中完成。

---

## 1. 本地 Windows 自动导出 (auto_exporter.py)

### 1.1 用法

```bash
# 基本用法
python <SKILL_ROOT>/scripts/auto_exporter.py "DraftName" "output.mp4" --res 1080 --fps 60

# JSON 输出（程序化集成用）
python <SKILL_ROOT>/scripts/auto_exporter.py "DraftName" "output.mp4" --res 1080 --fps 30 --json
```

或通过 `JyProject` 封装：

```python
project = JyProject("MyVideo")
# ... 编辑操作 ...
project.save()

# Windows 本地导出
project.export_video("output.mp4", resolution="1080", fps="30")
```

### 1.2 工作原理

`auto_exporter.py` 调用 `pyJianYingDraft.JianyingController().export_draft()`，底层使用 `uiautomation` 库：

1. 查找剪映窗口
2. 聚焦窗口
3. 导航到主页
4. 点击目标项目
5. 等待加载
6. 点击导出按钮
7. 等待导出完成

### 1.3 限制（关键！）

| 限制 | 说明 |
|---|---|
| **仅 Windows** | `uiautomation` 依赖 Windows UI Automation API |
| **剪映 v5.9 或更低** | 新版本 UI 布局变化，uiautomation 坐标可能失效 |
| **依赖 uiautomation** | `pip install uiautomation`；如果没装，导出会失败 |
| **剪映必须在前台** | GUI 自动化需要窗口聚焦 |
| **不能真正无头** | 剪映 GUI 会弹出并操作 |

### 1.4 分辨率与帧率参数

| 参数 | 可选值 |
|---|---|
| `--res` | `480` / `720` / `1080` / `2K` / `4K` / `8K` |
| `--fps` | `24` / `25` / `30` / `50` / `60` |

```python
# JyProject 中
project.export_video(
    output_path="final.mp4",
    resolution="1080",   # 或 "480", "720", "2K", "4K", "8K"
    fps="60"             # 或 "24", "25", "30", "50"
)
```

---

## 2. 远程 Windows Export Agent (windows_export_agent.py)

### 2.1 架构

当你在 macOS 上编辑但需要 Windows 导出时，使用远程 Agent 架构：

```
macOS 编辑机                          Windows 导出机
┌──────────────┐                    ┌──────────────────────┐
│ JyProject    │                    │ windows_export_agent │
│ (创建草稿)    │                    │ .py (FastAPI :8765)  │
│              │   HTTP POST        │                      │
│ save()       │ ─────────────────> │ /export              │
│              │                    │   ↓                  │
│              │  HTTP GET          │ JianyingController   │
│ poll status  │ <───────────────── │ .export_draft()      │
│ every 5s     │   /export/{id}/    │   (uiautomation)     │
│              │    status          │   ↓                  │
│              │                    │ 输出 MP4 到路径       │
└──────────────┘                    └──────────────────────┘
```

### 2.2 启动 Agent

在 **Windows 机器**上：

```bash
# 1. 安装依赖
pip install fastapi uvicorn pyJianYingDraft

# 2. 启动服务（默认监听 0.0.0.0:8765）
python <SKILL_ROOT>/scripts/core/windows_export_agent.py

# 自定义端口和草稿目录
python windows_export_agent.py --port 9000 --drafts-path "D:\JianYingDrafts"
```

或用批处理启动：
```bash
python <SKILL_ROOT>/scripts/start_export_agent.bat
```

### 2.3 HTTP API

| 端点 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 服务信息 |
| `/health` | GET | 健康检查（草稿目录 + 数量） |
| `/drafts` | GET | 列出可用草稿 |
| `/export` | POST | 启动导出任务（后台线程） |
| `/export/{task_id}/status` | GET | 查询导出状态 |

**POST /export 参数：**
```json
{
  "draft_name": "MyProject",
  "output_path": "C:\\exports\\output.mp4",
  "resolution": "1080P",
  "framerate": "30fps"
}
```

**响应：**
```json
{
  "message": "导出任务已启动",
  "task_id": "export_1700000000",
  "draft_name": "MyProject",
  "output_path": "C:\\exports\\output.mp4",
  "check_status_url": "/export/export_1700000000/status"
}
```

**GET /export/{task_id}/status 响应：**
```json
{
  "task_id": "export_1700000000",
  "status": "running",        // running / completed / failed
  "progress": 45,
  "draft_name": "MyProject",
  "output_path": "C:\\exports\\output.mp4",
  "elapsed_time": 12.5
}
```

### 2.4 macOS 端调用

```python
# 在 macOS 上
project = JyProject("MyVideo")
# ... 编辑操作 ...
project.save()

# 通过远程 Windows Agent 导出
result = project.export_video(
    output_path="/Users/me/exports/output.mp4",
    resolution="1080",
    fps="30",
    remote_host="http://192.168.1.100:8765"   # ← Windows Agent 地址
)
# JyProject 内部自动：
# 1. POST /export 启动任务
# 2. 每 5 秒 GET /export/{task_id}/status 轮询
# 3. 打印进度，完成或失败后返回
```

### 2.5 macOS 无远程 Agent 时的行为

如果 macOS 上没设置 `remote_host`，`export_video()` 会：
1. 打开 Finder 显示草稿位置
2. 打印手动导出指引
3. 返回 `{"status": "remote_required"}`

---

## 3. macOS 工作流 (macOS Workflow)

macOS 没有 `uiautomation`，不能本地自动导出。完整工作流：

```
1. 在 macOS 上创建草稿
   project = JyProject("Video", width=1080, height=1920)
   project.add_media_safe(...)
   project.add_text_simple(...)
   project.save()
   → 草稿写入 macOS 剪映目录

2. 将草稿同步到 Windows 导出机
   方式 A：共享网络盘 / 云盘同步草稿目录
   方式 B：scp/rsync 草稿文件夹

3. 触发远程导出
   project.export_video("out.mp4", remote_host="http://WIN-PC:8765")

4. 轮询完成
   → MP4 输出到 Windows 上的指定路径
   → 再传回 macOS
```

**或者**：手动在 macOS 剪映中打开草稿 → 手动点击导出。自动化程度取决于你是否有 Windows 导出机。

---

## 4. 批量处理模式 (Batch Processing Patterns)

### 4.1 循环创建多个草稿

```python
from jy_wrapper import JyProject

# 批量创建 10 个相似视频
customers = ["客户A", "客户B", "客户C", ...]
template_video = "assets/template_bg.mp4"
template_music = "assets/bgm.mp3"

for i, name in enumerate(customers):
    project = JyProject(f"Video_{name}", width=1080, height=1920, overwrite=True)
    project.add_media_safe(template_video, start_time="0s", duration="10s")
    project.add_media_safe(template_music, start_time="0s", duration="10s", track_name="BGM")
    project.add_text_simple(f"{name} 专属视频", start_time="1s", duration="3s")
    project.save()
    print(f"✅ [{i+1}/{len(customers)}] {name} done")
```

### 4.2 克隆模板 + 替换素材

```python
# 安全克隆：永不直接修改模板草稿
project = JyProject.from_template("Master_Template", "客户A_副本")
# ↑ 复制模板为新草稿，原模板不受影响

# 然后替换素材槽位
# 当前 API 尚未完全自动化，请：
# 1. 克隆后手动 add_media_safe 替换素材
# 2. 或直接编辑 draft_content.json 中的 materials.videos[].path
```

### 4.3 批量导出

```python
import requests, time

AGENT = "http://192.168.1.100:8765"
drafts_to_export = ["Video_客户A", "Video_客户B", "Video_客户C"]

for draft_name in drafts_to_export:
    # 启动导出
    resp = requests.post(f"{AGENT}/export", json={
        "draft_name": draft_name,
        "output_path": f"C:\\exports\\{draft_name}.mp4",
        "resolution": "1080P",
        "framerate": "30fps"
    }, timeout=30)
    task_id = resp.json()["task_id"]

    # 轮询直到完成
    while True:
        time.sleep(5)
        status = requests.get(f"{AGENT}/export/{task_id}/status", timeout=10).json()
        if status["status"] == "completed":
            print(f"✅ {draft_name} done")
            break
        elif status["status"] == "failed":
            print(f"❌ {draft_name} failed: {status.get('error')}")
            break
```

### 4.4 批量更新已有草稿

```python
import json, os, shutil

drafts_root = r"C:\Users\me\AppData\Local\JianyingPro\User Data\Projects\com.lveditor.draft"
projects = ["Project_A", "Project_B", "Project_C"]

for proj in projects:
    content_path = os.path.join(drafts_root, proj, "draft_content.json")
    with open(content_path, "r", encoding="utf-8") as f:
        draft = json.load(f)

    # 修改：例如把所有视频速度改为 1.2x
    for speed_mat in draft["materials"]["speeds"]:
        speed_mat["speed"] = 1.2

    # 写回（备份 .bak）
    shutil.copy2(content_path, content_path + ".bak")
    with open(content_path, "w", encoding="utf-8") as f:
        json.dump(draft, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated {proj}")
```

---

## 5. 草稿校验清单 (Draft Validation Checklist)

导出前检查以下项目：

### 5.1 保存时自动校验（JyProject / VectCutAPI 模式）

| 检查项 | 说明 |
|---|---|
| 媒体文件存在 | 所有 `materials.videos[].path` 指向的文件存在 |
| ffprobe 验证 | 提取真实 duration / width / height |
| Timerange 钳制 | 如果 `source_timerange.end` 超过素材实际时长，自动收缩 |
| 冲突检测 | 同一 track 内 segment 重叠 → 保留先添加的，删除后添加的 |
| 总时长重算 | 取所有 segment end 时间的最大值 |

### 5.2 导出前手动校验清单

```python
def validate_draft(project):
    """导出前校验草稿"""
    issues = []

    # 1. 至少有一个 video segment
    video_tracks = [t for t in project.script.track_list if t.type == "video"]
    if not video_tracks or not video_tracks[0].segment_list:
        issues.append("⚠️ 视频轨道为空")

    # 2. 检查素材文件存在
    import os
    for mat in project.script.materials.videos:
        if not os.path.exists(mat.path) and mat.path != "placeholder":
            issues.append(f"⚠️ 素材缺失: {mat.path}")

    # 3. 检查 segment 时间不重叠（同一 track）
    for track in project.script.track_list:
        segs = sorted(track.segment_list, key=lambda s: s.target_timerange.start)
        for i in range(len(segs)-1):
            end_i = segs[i].target_timerange.start + segs[i].target_timerange.duration
            start_next = segs[i+1].target_timerange.start
            if start_next < end_i:
                issues.append(f"⚠️ 轨道 {track.name} segment 重叠")

    # 4. 检查总时长 > 0
    if project.script.duration <= 0:
        issues.append("⚠️ 草稿总时长为 0")

    return issues
```

### 5.3 jianying-mcp 验证器

| 验证器 | 检查内容 |
|---|---|
| `material_validator.py` | 素材文件存在性 + 格式 |
| `overlap_validator.py` | 同一轨道内 segment 重叠 |
| 参数范围验证 | 滤镜强度 0-100，蒙版羽化 0-100，等 |
| ID 链验证 | track_id → segment_id 引用存在 |
| Zod schema 验证 | 数值边界（width 360-4096, fps 24-120, 等） |

---

## 6. 导出参数详解 (Export Parameters)

### 6.1 分辨率

| 字符串 | 枚举值 | 像素 | 用途 |
|---|---|---|---|
| `480` | `ExportResolution.RES_480P` | 854×480 | 预览/快速导出 |
| `720` | `ExportResolution.RES_720P` | 1280×720 | 标清 |
| `1080` | `ExportResolution.RES_1080P` | 1920×1080 | **推荐**，社交媒体标准 |
| `2K` | `ExportResolution.RES_2K` | 2560×1440 | 高清 |
| `4K` | `ExportResolution.RES_4K` | 3840×2160 | 超清 |
| `8K` | `ExportResolution.RES_8K` | 7680×4320 | 超高（极慢） |

### 6.2 帧率

| 字符串 | 枚举值 | 用途 |
|---|---|---|
| `24` | `ExportFramerate.FR_24` | 电影感 |
| `25` | `ExportFramerate.FR_25` | PAL 制式 |
| `30` | `ExportFramerate.FR_30` | **默认**，通用 |
| `50` | `ExportFramerate.FR_50` | 高帧率 |
| `60` | `ExportFramerate.FR_60` | 高帧率视频/游戏 |

### 6.3 码率

码率由剪映根据分辨率和帧率自动决定。程序化导出中没有直接设置码率的 API。如果需要精确控制码率：
1. 先用剪映导出标准 MP4
2. 再用 FFmpeg 二次编码：`ffmpeg -i input.mp4 -c:v libx264 -crf 18 -c:a aac -b:a 320k output.mp4`

---

## 7. SRT 字幕导出工作流 (SRT-Only Export)

如果只需要字幕文件（不需要视频）：

```bash
# 通过 JyProject wrapper 导出 SRT
python <SKILL_ROOT>/scripts/jy_wrapper.py export-srt --name "DraftName"
```

这会从草稿的 text track 中提取所有字幕 segment，生成标准 SRT 格式文件。

**SRT 格式：**
```
1
00:00:01,000 --> 00:00:03,500
Hello world

2
00:00:04,000 --> 00:00:06,000
This is the next subtitle
```

---

## 8. 错误处理 (Error Handling)

### 8.1 项目锁定 (Project Locks)

剪映运行时会在草稿目录创建 `.locked` 文件。自动部署新草稿时需要先删除旧 lock：

```python
import os

draft_path = r"C:\...\com.lveditor.draft\MyProject"
lock_file = os.path.join(draft_path, ".locked")
if os.path.exists(lock_file):
    os.remove(lock_file)
    print("✅ Removed stale .locked file")
```

### 8.2 草稿损坏恢复 (Corruption Recovery)

如果剪映报告草稿损坏：

1. **检查 `.recycle_bin/`**：剪映把"无效"项目移到草稿目录下的 `.recycle_bin/`。如果草稿消失，先看这里。
2. **从 `.bak` 恢复**：每次写入前写 `.bak` 备份。`shutil.copy2(draft + ".bak", draft)` 回滚。
3. **从模板重建**：如果 JSON 结构损坏到无法修复，从空白模板重新生成。

### 8.3 重试逻辑

```python
import time

def export_with_retry(project_name, output_path, max_retries=3):
    """带重试的导出"""
    for attempt in range(max_retries):
        try:
            result = project.export_video(output_path, resolution="1080", fps="30")
            if result.get("status") == "success":
                return result
            elif result.get("status") == "remote_required":
                print("⚠️ 需要远程 Windows Agent")
                return result
        except Exception as e:
            print(f"⚠️ 导出失败 (尝试 {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # 指数退避：1s, 2s, 4s
                print(f"   等待 {wait}s 后重试...")
                time.sleep(wait)
    return {"status": "failed", "error": "Max retries exceeded"}
```

### 8.4 常见错误与排查

| 错误 | 原因 | 解决 |
|---|---|---|
| "JianYingController export failed" | 剪映未运行或不在主页 | 重启剪映，停留在 Home/Edit 页面后重试 |
| "file inaccessible" | 素材路径未在侧车注册 | 检查 `draft_meta_info.json` 的 `draft_materials[]` |
| 草稿不出现在列表 | 未注册到 `root_meta_info.json` | 用剪映重新打开一次，或手动添加索引 |
| UI 坐标偏移 | 剪映版本升级 | 确认剪映 v5.9-；新版本需更新 uiautomation 坐标 |
| 远程 Agent 连接超时 | Windows 防火墙/网络 | 检查端口 8765 可达；关闭防火墙或加规则 |

---

## 9. JianYing Pro 10.2 草稿目录镜像

**关键发现**：剪映 Pro 10 期望相同内容写入草稿目录中的多个文件。批量更新草稿时，必须同时写入所有镜像位置：

```
<project_name>/
├── draft_content.json          # 主文件
├── draft_content.json.bak      # 镜像副本
├── template-2.tmp             # 镜像副本
└── Timelines/
    └── <UUID>/                 # 匹配草稿 id 字段
        ├── draft_content.json  # 镜像副本
        ├── draft_content.json.bak
        ├── template.tmp
        └── template-2.tmp
```

**写入镜像的辅助函数：**

```python
import os, shutil

def write_draft_content(draft_dir: str, content: dict):
    """写入 draft_content.json 到所有镜像位置"""
    import json

    # 1. 主位置
    main_path = os.path.join(draft_dir, "draft_content.json")
    os.makedirs(os.path.dirname(main_path), exist_ok=True)
    with open(main_path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)

    # 2. .bak 镜像
    shutil.copy2(main_path, main_path + ".bak")

    # 3. Timelines/<UUID>/ 镜像
    timeline_dir = os.path.join(draft_dir, "Timelines")
    if os.path.isdir(timeline_dir):
        for uuid_dir in os.listdir(timeline_dir):
            uuid_path = os.path.join(timeline_dir, uuid_dir)
            if os.path.isdir(uuid_path):
                for fname in ["draft_content.json", "draft_content.json.bak",
                              "template.tmp", "template-2.tmp"]:
                    shutil.copy2(main_path, os.path.join(uuid_path, fname))
```

---

## 10. 推荐的全自动管线 (Recommended Pipeline)

基于所有开源项目的分析，最完整的自动化管线：

```
1. 创建草稿          → JyProject(name, width, height, fps)
2. 添加视频/音频/文本 → project.add_media_safe() / add_text_simple()
3. 应用效果           → project 方法（滤镜/转场/蒙版/关键帧）
4. 保存草稿           → project.save()（触发元数据解析）
5. 校验草稿           → validate_draft() 检查重叠/缺失
6. 导出：
   ├─ Windows 本地：auto_exporter.py 或 project.export_video()
   ├─ macOS 远程：  project.export_video(remote_host="http://WIN:8765")
   └─ 纯 FFmpeg：   绕过剪映，用 render_master.py 模式（concat + drawtext + amix）
7. 轮询完成           → 远程 Agent 模式下每 5s 轮询状态
```

### 纯 FFmpeg 渲染（完全绕过剪映）

如果不需要剪映的特效合成，可以用 FFmpeg 直接渲染：

```python
# 参考 VectCutAPI examples/render_master.py 模式
import subprocess

cmd = [
    "ffmpeg", "-y",
    "-i", "clip1.mp4", "-i", "clip2.mp4",
    "-i", "bgm.mp3",
    "-filter_complex",
    "[0:v][1:v]concat=n=2:v=1:a=0[v];"
    "[2:a]volume=0.3[a]",
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-crf", "17",
    "-c:a", "aac", "-b:a", "320k",
    "output.mp4"
]
subprocess.run(cmd, check=True)
```

这是**唯一完全无头、无 GUI 的渲染方式**，但不支持剪映的多轨合成/特效/动画。

---

## 11. JyProject 导出 API 速查

```python
from jy_wrapper import JyProject

# 创建并编辑
project = JyProject("MyVideo", width=1080, height=1920)
project.add_media_safe("video.mp4", "0s", "10s")
project.add_text_simple("Hello", "1s", "3s")
project.save()

# === 导出选项 ===

# 选项 1：Windows 本地导出（uiautomation）
project.export_video("output.mp4", resolution="1080", fps="30")

# 选项 2：远程 Windows Agent 导出（macOS 用）
project.export_video("output.mp4", resolution="1080", fps="30",
                     remote_host="http://192.168.1.100:8765")

# 选项 3：CLI 导出
# python scripts/auto_exporter.py "MyVideo" "output.mp4" --res 1080 --fps 60

# 选项 4：SRT 字幕导出
# python scripts/jy_wrapper.py export-srt --name "MyVideo"
```

---

> **选择建议**：
> - **Windows 单机**：用 `auto_exporter.py` 或 `project.export_video()`（本地）
> - **macOS 编辑 + Windows 导出**：部署 `windows_export_agent.py`，用 `remote_host` 调用
> - **批量生产**：循环创建草稿 → 批量 POST 到远程 Agent → 轮询
> - **只需字幕**：`export-srt` 模式
> - **不需要剪映特效**：纯 FFmpeg 管线（最快、最可靠）
