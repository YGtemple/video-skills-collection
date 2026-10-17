# 横屏电影质感单镜提示词输出规范

## 一、输出原则

- 逐镜输出，使用结构化纯文本块格式，**严禁使用表格**
- 每镜的即梦Prompt必须可直接粘贴使用，无需二次修改
- 画面描述与即梦Prompt分离：画面描述给人看（完整叙事），即梦Prompt给AI用（精炼关键词）
- 每镜必须带负面提示词、音效、转场

## 二、单镜输出结构

```
━━━━━━━━━━━━━━━━━━━━━━━━
镜头XX | 时长: X秒 | 时间码: XX-XXs
景别: XXX | 视点: XXX | 运镜: XXX（速度: X倍速）
━━━━━━━━━━━━━━━━━━━━━━━━

【画面描述】
（主体动作 + 环境细节 + 光影色调 + 镜头运动 + 情绪氛围，一段连贯的叙事性描述，2-4句话）

【即梦Prompt（中文）】
（可直接粘贴进即梦的中文提示词，关键词式：主体, 动作, 环境, 光线, 镜头, 风格, 画质）

【即梦Prompt（English）】
（英文版本，关键词式，逗号分隔）

【负面提示词】
blurry, low quality, distorted face, extra limbs, text, watermark, ...

【音效设计】
（本镜音效/环境音/台词，标注声音类型）

【转场】
硬切 / 淡入淡出 / 匹配剪辑 / 闪白 / 声音先导
```

## 三、即梦Prompt写法规范

### 中文Prompt结构
```
[主体+特征], [核心动作], [环境场景], [光线色调], [镜头语言], [风格质感], [画质参数]
```

### 英文Prompt结构
```
[subject with features], [action], [environment], [lighting & color], [camera movement & shot], [style], [quality tags]
```

### 各部分写法要点

**主体+特征**：
- 角色名+资产卡中的关键外观特征（不要重复全部，只写本镜可见的）
- 例：`满脸硝烟汗水的年轻士兵，身穿数位迷彩战术服，头戴功夫龙头盔`
- 英文：`a young soldier with soot and sweat on his face, wearing digital camouflage tactical uniform and dragon-patterned helmet`

**核心动作**：
- 一个动词短语+情绪/力度
- 例：`猫着腰在弹孔街道上疯狂冲刺，子弹擦过身侧`
- 英文：`crouching and sprinting frantically through a bullet-riddled street, bullets whizzing past`

**环境场景**：
- 资产卡中的场景关键词+本镜可见的环境细节
- 例：`布满弹孔龟裂的水泥墙，地面散落瓦砾弹壳，半毁楼房`
- 英文：`bullet-riddled cracked concrete walls, rubble and shell casings scattered on the ground, half-destroyed building`

**光线色调**：
- 光源+方向+色调+特殊光效
- 例：`惨淡冷调残阳从破窗射入，丁达尔光束，空气中悬浮灰尘`
- 英文：`pale cold sunset light streaming through broken windows, Tyndall light beams, dust particles floating in air`

**镜头语言**：
- 景别+运镜+速度+视点
- 例：`第一人称POV手持剧烈晃动，高速跟拍`
- 英文：`first-person POV, intense handheld camera shake, high-speed tracking shot`

**风格质感**：
- 电影感关键词
- 例：`cinematic, war film aesthetic, gritty realistic texture`
- 固定追加：`cinematic, ARRI 65 look, film grain, color graded`

**画质参数**：
- 固定追加：`8K resolution, ultra-detailed, sharp focus, high dynamic range`

## 四、负面提示词库

### 通用负面词（每镜必带）
```
blurry, low quality, low resolution, distorted, deformed, disfigured, extra limbs, missing limbs, floating limbs, mutated hands, bad anatomy, wrong anatomy, text, watermark, signature, logo, caption, subtitles, jpeg artifacts, noise, grainy, overexposed, underexposed, flat lighting, cartoon, anime, illustration, 3d render, cgi, plastic skin, wax figure, uncanny valley
```

### 人物特写追加
```
distorted face, asymmetric eyes, crossed eyes, weird eyes, malformed face, double face, extra fingers, missing fingers, fused fingers, too many fingers
```

### 水下场景追加
```
air bubbles on face, water distortion on face, blurry underwater, murky water obscuring face
```

### 战斗/动作场景追加
```
motion blur excessive, frozen action, unnatural pose, stiff movement, physics violation
```

## 五、音效设计规范

每镜标注：
- **环境音**：持续的背景声音（风声/雨声/机器嗡鸣/水流/人群嘈杂）
- **动作音效**：本镜动作产生的声音（脚步声/子弹破空/碰撞/呼吸/衣物摩擦）
- **台词**：本镜人物台词（角色名："内容"）
- **音效情绪**：声音如何服务情绪（尖锐/沉闷/渐强/骤停）

## 六、转场规范

- **硬切(Cut)**：默认，最常用，节奏快
- **淡入淡出(Fade)**：时间流逝、场景转换、情绪缓冲
- **匹配剪辑(Match Cut)**：前后镜有视觉相似元素（形状/动作/颜色），高级转场
- **闪白(Flash White)**：爆炸/强光/冲击/记忆闪回
- **声音先导(Sound Lead)**：下一镜声音先出现，画面后切，增强衔接
- **叠化(Dissolve)**：回忆/梦境/时间流逝（短剧少用，节奏慢）

## 七、完整示例

```
━━━━━━━━━━━━━━━━━━━━━━━━
镜头03 | 时长: 4秒 | 时间码: 10-14s
景别: 第一人称POV | 视点: 主观 | 运镜: 手持高速跟拍（速度: 0.8倍速）
━━━━━━━━━━━━━━━━━━━━━━━━

【画面描述】
第一人称视角，画面剧烈晃动。我猫着腰在布满弹孔的残破街道上疯狂冲刺，子弹"咻咻"擦过耳边击打在身侧水泥墙上，碎石飞溅到脸上。画面边缘是我摆动的手臂和手中紧握的T91步枪枪托。猛地冲进一栋半毁楼房，背靠残破墙壁滑坐下来，剧烈喘息。

【即梦Prompt（中文）】
第一人称POV手持剧烈晃动，猫腰在弹孔街道疯狂冲刺，子弹擦过墙壁碎石飞溅，画面边缘可见握步枪的手臂，冲进半毁楼房滑坐喘息，布满弹孔龟裂的水泥墙瓦砾地面，惨淡冷光硝烟弥漫，高速跟拍，战争电影质感，8K超清，cinematic

【即梦Prompt（English）】
first-person POV intense handheld shake, crouching sprinting through bullet-riddled street, bullets hitting walls debris flying, arms gripping rifle visible at frame edge, sliding down against ruined wall gasping, cracked concrete walls rubble ground, pale cold light smoke filled, high-speed tracking, war film aesthetic, 8K, cinematic, ARRI 65

【负面提示词】
blurry, low quality, distorted face, extra limbs, text, watermark, cartoon, anime, 3d render, plastic skin, motion blur excessive, still frame

【音效设计】
子弹破空声（尖锐高频）、碎石飞溅声、奔跑脚步声（急促沉重）、撕心裂肺的喘息（近景呼吸声）、远处爆炸声（低频沉闷）

【转场】
硬切
```

## 八、输出检查清单

- [ ] 每镜是否使用纯文本块格式（无表格）？
- [ ] 即梦Prompt是否可直接粘贴（关键词式，无多余解释）？
- [ ] 是否同时提供中英文Prompt？
- [ ] 负面提示词是否每镜都有且针对本镜场景？
- [ ] 音效设计是否包含环境音+动作音+台词？
- [ ] 转场是否每镜标注？
- [ ] 角色外观特征是否与资产卡一致？
- [ ] 运镜速度是否匹配情绪档位？
- [ ] 时间码是否连续？
