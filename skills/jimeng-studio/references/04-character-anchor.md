# 角色形象锚定生图Prompt规范

## 一、为什么需要角色锚定

AI视频生成中角色面部一致性是核心难题。解决方案是：先用文生图生成每个角色的标准形象图（锚定图），后续视频生成时用图生视频模式，以锚定图作为首帧参考图，锁定五官/服装/造型。

**规则**：主角镜头必须用图生视频，以该角色对应形态已生成图作首帧参考图锁五官；大场面/环境空镜可用文生视频。凡画面有主角必填首帧参考图。

## 二、锚定图生成规范

### 每个角色需要的锚定图数量
- **主角**：至少2张——正面标准像 + 3/4侧面像；如有形态变化（如异化/战斗/虚弱），每种形态各1张
- **重要配角**：1张正面或3/4侧面标准像
- **群演/路人**：不需要单独锚定

### 锚定图画面要求
- **背景**：简洁中性背景（纯色/渐变/极简环境），避免复杂背景干扰角色特征
- **光线**：均匀柔和的影棚光或电影感侧光，清晰展示面部和服装细节
- **姿态**：自然站立/半身，面向镜头或3/4侧面，表情为角色常态
- **画幅**：建议1:1或2:3竖版，角色占画面主体
- **画质**：8K, photorealistic, ultra-detailed

## 三、英文生图Prompt结构

每个角色锚定Prompt按以下结构组织：

```
[主体描述] + [面部细节] + [发型] + [服装完整描述] + [异化特征] + [姿态与角度] + [光线背景] + [画质后缀]
```

### 1. 主体描述
- 年龄+性别+种族/风格+核心身份关键词
- 例：`a 28-year-old East Asian male soldier, rugged and battle-worn`

### 2. 面部细节
- 脸型、五官、肤色、面部标记、表情
- 例：`sharp jawline, deep-set eyes with dark circles, tanned skin covered in soot and sweat, a thin scar across the left eyebrow, exhausted but determined expression`

### 3. 发型
- 长度、颜色、样式、状态
- 例：`short black military haircut, slightly messy and damp with sweat`

### 4. 服装完整描述
- 从上到下，款式+颜色+材质+细节+配件
- 例：`wearing modern digital camouflage tactical uniform with a weighted tactical vest, magazine pouches attached, black combat gloves, a tactical helmet with night-vision mount and a distinctive dragon emblem on the side`

### 5. 异化/特殊特征（竖屏引擎必填）
- 非人类特征精确描述
- 例：`vertical slit pupils, iridescent shark scales along the jawline and neck, gill slits on the neck, sharp teeth slightly visible`
- 不同形态分别生成：如`half-shark form` / `weakened out-of-water form (pale skin, dull scales)`

### 6. 姿态与角度
- 身体朝向、镜头角度、构图
- 例：`standing facing camera, 3/4 body shot, looking slightly off-camera, neutral standing pose`

### 7. 光线与背景
- 光源、方向、色调、背景
- 例：`soft studio lighting from the front-left, subtle rim light on the right, plain dark gray gradient background, cinematic portrait lighting`

### 8. 画质后缀（固定追加）
- `8K resolution, ultra-detailed, photorealistic, realistic skin texture, sharp focus, professional portrait photography, no text, no watermark`

## 四、锚定Prompt输出模板

```
═══════════════════════════════════
【全剧素材锚定基准 / Character Anchor Prompts】
═══════════════════════════════════

【角色A：姓名】
形态：标准形态 / 正面
参考图命名：角色A_标准.png
英文Prompt：
[完整英文Prompt]

形态：标准形态 / 3/4侧面
参考图命名：角色A_侧面.png
英文Prompt：
[完整英文Prompt]

（如有异化/战斗形态）
形态：半鲨形态
参考图命名：角色A_半鲨.png
英文Prompt：
[完整英文Prompt]

【角色B：姓名】
...

═══════════════════════════════════
使用说明：
1. 将以上Prompt输入即梦/Midjourney/Stable Diffusion生成角色锚定图
2. 生成后确认五官/服装/异化特征符合资产卡设定
3. 后续视频生成时，主角镜头使用图生视频，对应锚定图作为首帧参考
4. 参考图命名规则：角色名_形态.png，在分镜提示词中引用
═══════════════════════════════════
```

## 五、锚定图质量检查

- [ ] 面部特征是否与资产卡一致（脸型/五官/标记/表情）？
- [ ] 服装是否完整展示且颜色材质正确？
- [ ] 标志性配件是否清晰可见？
- [ ] 异化特征是否精确（鳞片/触须/鱼尾/义眼）？
- [ ] 背景是否简洁不干扰？
- [ ] 光线是否均匀展示细节？
- [ ] 不同形态的差异是否明显？
- [ ] 图片分辨率是否足够（建议≥1024px）？

## 六、一致性维护技巧

1. **固定种子(Seed)**：如果工具支持，同一角色不同角度/形态使用相同seed，增强一致性
2. **图生图迭代**：第一张锚定图确认后，用图生图模式（低重绘幅度）生成其他角度/形态
3. **LoRA训练**：如工具支持，用确认后的锚定图训练角色LoRA，全剧一致性最佳
4. **参考图引用**：分镜提示词中每镜主角镜头必须标注`参考图：角色名_形态.png`，提醒使用图生视频
