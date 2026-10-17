# 字体许可与来源

本目录随仓库附带 4 款开源字体，均来自 Google Fonts（`main` 分支），可自由随项目分发。

| 文件 | 字体 | 许可 | Google Fonts 路径（main 分支） |
|---|---|---|---|
| `ZCOOLQingKeHuangYou.ttf` | ZCOOL QingKe Huang You（中文粗海报） | SIL OFL 1.1 | `ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf` |
| `ZhiMangXing.ttf` | ZhiMangXing（中文毛笔） | SIL OFL 1.1 | `ofl/zhimangxing/ZhiMangXing-Regular.ttf` |
| `PermanentMarker.ttf` | Permanent Marker（英文马克笔） | Apache License 2.0 | `apache/permanentmarker/PermanentMarker-Regular.ttf` |
| `Anton.ttf` | Anton（英文窄粗海报） | SIL OFL 1.1 | `ofl/anton/Anton-Regular.ttf` |

## 两个坑（详见 docs/pitfalls.md）

1. **Permanent Marker 不在 `ofl/`**：`ofl/permanentmarker/...` 会 404，它实际在 `apache/permanentmarker/`。
2. **GitHub contents API 容易限流**：批量下载字体时直接拼 `raw.githubusercontent.com/google/fonts/main/<路径>`，不要走 contents API。

OFL 全文：https://openfontlicense.org/
Apache 2.0 全文：https://www.apache.org/licenses/LICENSE-2.0
