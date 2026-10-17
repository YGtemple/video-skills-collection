---
name: song-pastoral-mj-seedance
description: 以用户认可的两条英文原文为唯一风格基准，为宋式田园水乡生活生成默认10组16:9、50–80词的MJV8图片提示词；新场景只替换动作、地点、人数与道具，保留日常人物、衣着、光色和构图句式；收到成图后逐张写约4秒Seedance 2.5中文视频提示词。用于先图后视频、田园生活画风统一、提示词漂移排查，以及“图片生成好了”“让这些图动起来”。
---

# 宋式田园美学 · 图片到视频

> 🏷️ **画风归属**：🟡 风格化（写实唯美艺术片，非二次元漫剧）——MJ `--v 8.2 --raw` 清透写实。本模块产三件套之 ②③（风格化类）。提示词不写字幕/屏幕文字、不要求 BGM、不要求 TTS。\n> 🎛️ **三维控制**：清透写实唯美=风格化中（--stylize 200–400）、怪异度低（--weird 0）、多样性低（--chaos 0–5）+ 固定 seed 锁女子形象；每条提示词旁附三维取值+理由。

把用户已认可的两条提示词当作可复制的文字模板。图片阶段用纯文字先生成生活瞬间，成图阶段再根据实际画面写动作。默认只交付提示词，用户另有明确授权时才执行生成。

## 阶段与默认值

- 图片阶段：默认10张独立英文提示词，每条50–80个英文词，词数包含参数；默认 `--ar 16:9 --v 8.2 --raw`。
- 视频阶段：用户上传成图后，一图一条中文Seedance 2.5提示词，约4秒、单个连续镜头，继承图片画幅。
- 图片阶段不要求参考图，不添加图片URL、`--sref`、风格码或个人化配置。用户提供图片给我分析时，只把可见特征翻译成文字，不把图片变成生图前置条件。
- 未指定人物时，使用清秀亲切的年轻成年中国女子，黑色长发半束或简单扎起，素净日常衣裙。保持好看与生活感同时存在。
- 用户最新指定的人数、性别、服装、主题、数量、画幅和时长优先；只改某条时只改该条。

| 用户输入 | 执行 |
| --- | --- |
| 一句话、主题、先出10组图片提示词 | 图片阶段；无主题时使用古风水乡日常。 |
| 改某条的人数、动作、道具或构图 | 只替换对应字段，继续使用适用的模板。 |
| 参考图倒推、反馈“画风不对” | 先看实际图，指出两三项具体差异，再改对应提示词或Skill。 |
| 图片生成好了、让图片动起来 | 视频阶段；按上传顺序逐张看图。 |
| 只问看得到吗、什么意思 | 先直接回答，不自动生成10条。 |

附件打不开时先尝试可用的本地副本；仍无法打开就说明具体哪张没有看到，继续处理能读的内容，不凭文件名猜画面。

## 两条认可原文：不可改写的基准

用户已反馈这两条直接使用后的感觉可以。相同场景且未修改设定时，原样返回；不要换同义词，不要加新风格词。

### A｜溪边浣衣

```text
Beside a clear village stream, one young adult Chinese woman kneels on a flat stone, both hands twisting wet linen above a wooden basin, watching falling droplets with a gentle smile. Black hair tied back, pale blue cotton Song-style wrap blouse, closed collar, rolled sleeves, ivory skirt. Medium-wide composition includes face, hands, basin and supporting knees. Clear daylight, warm highlights, green water reflections, photoreal pastoral film still. --ar 16:9 --v 8.2 --raw
```

### B｜墙头摘果

```text
Leaning over a village courtyard wall, a young adult Chinese woman picks a low yellow fruit, left palm braced on the tiles, right fingers holding its stem. She watches the fruit with a small, playful smile. Long black hair half-tied, plain peach cotton wrap blouse, neatly crossed collar, ivory skirt. Medium shot includes both hands and the wall. Gentle dappled daylight, natural skin tones, softly receding green foliage. Photoreal pastoral film still. --ar 16:9 --v 8.2 --raw
```

这两条共同传达的是：人物正在做一件小事，手与物清楚相连；长发简单处理；衣服素净、合拢、方便活动；脸部自然好看但没有模特展示姿势；日光清楚，环境保留深浅；画面能同时读出人物、动作和生活空间。

## 图片阶段：严格按槽位迁移

每条先选一个基准，再只替换方括号内的槽位。生成时不要输出方括号。

**A模板（水边、舟中、洗涤、采莲等）：**

```text
[地点], one young adult Chinese woman [正在做的单一动作], [身体支撑或手部接触], [必要道具]. Black hair tied back, pale blue cotton Song-style wrap blouse, closed collar, rolled sleeves, ivory skirt. Medium-wide composition includes face, hands, [道具或工具] and supporting [身体支撑]. Clear daylight, warm highlights, green water reflections, photoreal pastoral film still. --ar 16:9 --v 8.2 --raw
```

**B模板（院落、树下、陆地活动等）：**

```text
[地点], a young adult Chinese woman [正在做的单一动作], [身体支撑或手部接触], [必要道具]. She watches [动作对象] with a small, playful smile. Long black hair half-tied, plain peach cotton wrap blouse, neatly crossed collar, ivory skirt. Medium shot includes both hands and [生活空间]. Gentle dappled daylight, natural skin tones, softly receding green foliage. Photoreal pastoral film still. --ar 16:9 --v 8.2 --raw
```

槽位规则：

1. **先写事情，再写人。** 动作必须能看见接触关系，例如“both hands twisting wet linen”“right fingers holding its stem”“left hand steadying a basin”。眼睛看布、果子、桨、风筝或同伴，不默认看镜头。
2. **保持人物称呼。** 用 `young adult Chinese woman`；多人只把 `one` 改成明确人数和复数形式。不要改成 `beautiful woman`、`village woman`、模特、贵族、仙女等标签。
3. **保持发型衣着。** A使用 `Black hair tied back` 与浅蓝棉质交领上衣；B使用 `Long black hair half-tied` 与素色桃粉棉质交领上衣。允许因活动加 `rolled sleeves`，不增加低领、透明纱、夸张泡袖、华丽刺绣、珠宝或厚重袍服。
4. **保持中景可读。** 默认 `Medium shot` 或 `Medium-wide composition`，画面要看见脸、双手、工具和支撑点。只有用户明确要求时才用近景、低机位或斜俯视；不因“电影感”自行裁掉手和工具，不用远景把人物缩成景观里的小点。
5. **保持一件事。** 一条图片提示词只定格一个动作，例如刚拧湿布、刚握住果梗、桨叶刚入水。不要写连续剧情、转场或“先做A再做B”。
6. **保持光色原句。** 水边和舟中优先完整保留A的 `Clear daylight, warm highlights, green water reflections, photoreal pastoral film still.`；树下和院落优先完整保留B的 `Gentle dappled daylight, natural skin tones, softly receding green foliage. Photoreal pastoral film still.`。不要为了每条不同而改写。
7. **限制环境修饰。** 使用真实水面、木石、柳树、竹篮、木盆、果树和白墙灰瓦等生活元素。前景花叶只能轻轻点缀，不能遮住脸、手和工具；不要堆叠bokeh、胶片、镜头品牌、8K或抽象色卡。
8. **词数优先保留这些字段。** 超过80词时，删除重复地点和空泛形容词，保留人数、动作、视线对象、身体支撑、衣着锚点、模板光色句和参数。少于50词时，补一个可见道具或空间关系，不补外貌赞美。

默认禁止自由扩写以下方向：`cinematic`、`moody`、`golden hour`、`sunset`、`dramatic lighting`、`fashion editorial`、`portrait`、`close-up`、`low angle`、`beautiful woman`、`village woman`、`luminous skin`、`glowing sleeves`、`flowing sleeves`、`airy gauze`、`rustic documentary`、`coarse linen`、`letterbox`。这些词会把生活动作推向写真、广告或戏剧化造型；只有用户明确要求对应风格时才可使用，并在校验时切换为 `basic`。

## 图片交付与反馈

输出“编号＋中文短标题＋一个英文 `text` 代码块”。代码块只放完整英文提示词和参数，不放翻译、解释或多个候选版。默认输出10条，不把10条拼成一张图。

用户说画面“不像”时，先看成图再比较：

- 人物像写真：删掉外貌与姿势词，补手部接触、视线对象和身体支撑。
- 衣服像礼服或大泡袖：回到模板中的棉质交领、合拢领口、简单挽袖和素色裙子。
- 人物太小或手被裁掉：改回中景或中广景，明确包括脸、双手、工具和支撑。
- 画面过分橙黄、过暗或泛白：只调整局部受光和环境颜色，保留模板的清楚日光及自然深浅。
- 出现黑边、文字或作者标识：检查最终提交文本和界面设置，提示词里不加入 `letterbox`、字幕、水印等内容。

只有看到实际英文提示词，才能断言某个词造成偏差；只有看到成图，才能描述已经发生的视觉差异。不要把“可能”说成模型测试结论。

有执行环境时运行：

```bash
python3 <skill目录>/scripts/check_mj_prompts.py <草稿.md>
```

默认检查10条、50–80词、16:9、V8.2、Raw、A/B完整光色句及禁止词。用户明确改变画幅、模型、Raw或风格时，使用 `--aspect`、`--version`、`--raw-mode optional`、`--style-profile basic` 等覆盖选项。脚本只检查文本约束，不代表模型已生成或审美一定通过。

## 视频阶段：以成图为准

先逐张看成图，记录实际人物数量、发型衣着、脸朝向、手与道具接触、身体支撑、动物位置、光向、画幅和可运动空间。成图优先于旧设计：图中三人就写三人，布已在手里就从轻拧开始，没有风筝就不补风筝。

每条约4秒只安排一个主要动作：

- 起始直接承接首帧姿态，不重新摆姿势。
- 中段推进一次轻拧、划桨、伸手触碰、递布或自然转头，并写出滴水、涟漪、布料受力等反馈。
- 末段动作自然收势，袖边、发梢、水纹和柳条继续轻动。

沿用成图机位和主体大小，只选择固定机位或一种小幅推近、横移、跟随。群像保持人数和相对位置，让一人主动作带动同伴错开回应，不让全员同步抬手或大笑。保持脸、衣服、光向、明暗和空间连续，不添加新人物、道具、字幕、水印或滤镜。

交付格式为“图片01｜主题｜约4秒”，随后一个中文 `text` 代码块，通常150–250字。一图一镜，不切镜、不转场、不黑场收尾；视频代码块不带MJ参数或虚构时长参数。

## 交付前检查

- 图片阶段是否严格使用A或B模板，或在相同场景时原样返回认可原文？
- 是否写清人物正在做的事、视线对象、双手接触和身体支撑？
- 是否保留简单长发、素净交领衣着、中景可读和完整光色句？
- 是否每条50–80词、16:9、V8.2、Raw，且没有额外风格词或参数？
- 视频阶段是否逐张依据实际成图、约4秒、一个主要动作和至多一种小幅运镜？
