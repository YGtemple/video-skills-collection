// render.js —— 纯函数 render(t) 驱动全片。所有元素加载时建好一次，render 只改属性/切显示。
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
  const { T } = window;

  // ---------- 确定性哈希与缓动 ----------
  const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const smooth = (a, b, x) => { const p = clamp((x - a) / (b - a), 0, 1); return p * p * (3 - 2 * p); };
  const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
  const backOut = p => { const c = 1.70158, s = 1.1; p -= 1; return s * p * p * ((c + 1) * p + c) + 1; };
  const P = Math.PI * 2;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(e, s) { e.textContent = s; }
  function show(g, v) { g.setAttribute('display', v ? '' : 'none'); }

  const stage = document.getElementById('stage');

  // ============================ DEFS ============================
  const defs = el('defs', {}, stage);

  // 线条沸腾滤镜（feTurbulence + feDisplacementMap），seed 每 3 帧换
  const BOIL_SCALE = [10, 11, 13];
  [1, 2, 3].forEach(i => {
    const f = el('filter', { id: 'boil' + i, x: '-25%', y: '-25%', width: '150%', height: '150%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012 0.018', numOctaves: '2', seed: i * 7, result: 'n' }, f);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: BOIL_SCALE[i - 1], xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  });
  // 纸纹滤镜
  const grainF = el('filter', { id: 'grain', x: '0', y: '0', width: '100%', height: '100%' }, defs);
  const grainT = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '2', seed: '3', stitchTiles: 'stitch' }, grainF);
  el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.55 0' }, grainF);

  // 开场全屏噪点（逐帧换 seed，TV 故障雪花）
  const introNF = el('filter', { id: 'introNoise', x: '0', y: '0', width: '100%', height: '100%' }, defs);
  const introNT = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.75', numOctaves: '2', seed: '1' }, introNF);
  el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.92  0 0 0 0 0.86  0 0 0 0 0.72  2.2 2.2 2.2 0 -2.8' }, introNF);

  // ---------- 图标 symbol（100×100，简笔） ----------
  const ICONS = {
    traffic: '<rect x="34" y="8" width="32" height="86" rx="11" fill="#1b1410"/><circle cx="50" cy="27" r="8.5" fill="#d7261e"/><circle cx="50" cy="51" r="8.5" fill="#f2781f"/><circle cx="50" cy="75" r="8.5" fill="#f5ebd2" stroke="#1b1410" stroke-width="2"/>',
    moto: '<circle cx="25" cy="68" r="15" fill="none" stroke="#1b1410" stroke-width="8"/><circle cx="75" cy="68" r="15" fill="none" stroke="#1b1410" stroke-width="8"/><path d="M12 66 L40 64 L56 40 L70 56 L84 60" fill="none" stroke="#1b1410" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 40 L58 28 L70 30" fill="none" stroke="#d7261e" stroke-width="7" stroke-linecap="round"/>',
    crosswalk: '<path d="M20 16 L30 84 M40 13 L44 87 M60 13 L58 87 M80 17 L72 85" fill="none" stroke="#1b1410" stroke-width="11" stroke-linecap="round"/>',
    car: '<path d="M10 64 L24 44 L62 44 L82 60 L90 62 L90 76 L10 76 Z" fill="#1b1410"/><circle cx="28" cy="78" r="11" fill="#1b1410" stroke="#efe2c2" stroke-width="4"/><circle cx="70" cy="78" r="11" fill="#1b1410" stroke="#efe2c2" stroke-width="4"/><rect x="30" y="50" width="26" height="12" rx="3" fill="#f5ebd2"/>',
    ship: '<path d="M12 58 L88 58 L74 80 L28 80 Z" fill="#1b1410"/><rect x="38" y="32" width="26" height="24" fill="#1b1410"/><line x1="51" y1="12" x2="51" y2="32" stroke="#1b1410" stroke-width="6"/><path d="M8 88 q10 8 20 0 t20 0 t20 0 t20 0" fill="none" stroke="#d7261e" stroke-width="5" stroke-linecap="round"/>',
    chimney: '<rect x="16" y="50" width="68" height="36" rx="4" fill="#1b1410"/><rect x="26" y="26" width="13" height="28" fill="#1b1410"/><rect x="62" y="18" width="13" height="36" fill="#1b1410"/><circle cx="33" cy="18" r="7" fill="none" stroke="#d7261e" stroke-width="4"/><circle cx="68" cy="9" r="8" fill="none" stroke="#d7261e" stroke-width="4"/>',
    stairs: '<path d="M14 84 L14 66 L32 66 L32 48 L50 48 L50 30 L68 30 L68 14 L88 14" fill="none" stroke="#1b1410" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>',
    hydrant: '<rect x="43" y="36" width="14" height="50" rx="6" fill="#d7261e"/><circle cx="50" cy="31" r="10" fill="#d7261e"/><rect x="28" y="46" width="44" height="11" rx="4" fill="#d7261e"/><rect x="44" y="84" width="12" height="10" fill="#1b1410"/>'
  };
  const ICON_KEYS = Object.keys(ICONS);
  for (const k of ICON_KEYS) {
    const s = el('symbol', { id: 'icon-' + k, viewBox: '0 0 100 100' }, defs);
    s.innerHTML = ICONS[k];
  }
  // 半根杆子（笑点专用，贴着格子左缘被切掉）
  const poleSliver = '<rect x="1" y="6" width="11" height="90" fill="#1b1410"/><path d="M1 13 a10 10 0 0 1 0 20" fill="none" stroke="#d7261e" stroke-width="9"/>';

  // ---------- 硬投影 / 撕纸 通用 ----------
  function hardShadow(parent, d, dx, dy, fill) {
    const s = el('path', { d, fill: fill || '#1b1410' }, parent);
    s.setAttribute('transform', `translate(${dx} ${dy})`);
    return s;
  }

  // ============================ 世界根（受震屏/变焦） ============================
  const world = el('g', { id: 'world' }, stage);
  const bg = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#efe2c2' }, world);

  // ---------- 开场故障 ----------
  const gIntro = el('g', {}, world);
  const introBars = [];
  for (let i = 0; i < 26; i++) {
    const r = el('rect', {}, gIntro);
    introBars.push(r);
  }
  const introNoiseRect = el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#introNoise)', opacity: 0.18 }, gIntro);
  const introFlash = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#efe2c2', opacity: 0 }, gIntro);
  const introDigits = el('text', { x: CX, y: CY + 30, 'text-anchor': 'middle', 'font-family': 'AntonF', 'font-size': 120, fill: '#d7261e' }, gIntro);

  // ---------- 验证卡 ----------
  const gCard = el('g', {}, world);
  const cardD = 'M470 360 Q470 330 500 330 L1420 330 Q1450 330 1450 360 L1450 740 Q1450 770 1420 770 L500 770 Q470 770 470 740 Z';
  hardShadow(gCard, cardD, 18, 20);
  el('path', { d: cardD, fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 9 }, gCard);
  // 胶带
  el('rect', { x: 600, y: 300, width: 150, height: 44, fill: '#e4d2a8', opacity: 0.85, transform: 'rotate(-4 675 322)' }, gCard);
  el('rect', { x: 1180, y: 300, width: 150, height: 44, fill: '#e4d2a8', opacity: 0.85, transform: 'rotate(5 1255 322)' }, gCard);
  // 勾选框
  const cbX = 590, cbY = 495, cbS = 96;
  el('rect', { x: cbX, y: cbY, width: cbS, height: cbS, rx: 10, fill: '#efe2c2', stroke: '#1b1410', 'stroke-width': 8 }, gCard);
  const spinner = el('g', { transform: `translate(${cbX + cbS / 2} ${cbY + cbS / 2})` }, gCard);
  el('circle', { r: 30, fill: 'none', stroke: '#d7261e', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': '120 68' }, spinner);
  const cardText = el('text', { x: 730, y: 600, 'font-family': 'ZCOOL', 'font-size': 120, fill: '#1b1410' }, gCard);
  txt(cardText, '我不是机器人');

  // ---------- 左侧黑色题目卡（9/4/6 共用） ----------
  const gPanel = el('g', {}, world);
  const panelD = 'M70 160 Q70 140 92 140 L548 140 Q570 140 570 162 L570 700 Q570 722 548 722 L92 722 Q70 722 70 700 Z';
  hardShadow(gPanel, panelD, 16, 18);
  el('path', { d: panelD, fill: '#1b1410' }, gPanel);
  const panelSmall = el('text', { x: 320, y: 250, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 52, fill: '#f5ebd2' }, gPanel);
  txt(panelSmall, '请选出所有');
  const panelBig = el('text', { x: 320, y: 430, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 130, fill: '#d7261e' }, gPanel);
  // 验证按钮
  const btnD = 'M120 770 Q120 748 142 748 L498 748 Q520 748 520 770 L520 900 Q520 922 498 922 L142 922 Q120 922 120 900 Z';
  hardShadow(gPanel, btnD, 12, 14);
  el('path', { d: btnD, fill: '#d7261e', stroke: '#1b1410', 'stroke-width': 8 }, gPanel);
  const panelBtn = el('text', { x: 320, y: 878, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 92, fill: '#f5ebd2' }, gPanel);
  txt(panelBtn, '验证');
  const BTN_CENTER = { x: 320, y: 835 };

  // ---------- 网格构建 ----------
  function buildGrid(n, cell, gap, x0, y0, opts) {
    opts = opts || {};
    const g = el('g', {}, world);
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const k = r * n + c;
      const x = x0 + c * (cell + gap), y = y0 + r * (cell + gap);
      const cg = el('g', {}, g);
      el('rect', { x: x + 7, y: y + 9, width: cell, height: cell, rx: 9, fill: '#1b1410', opacity: 0.85 }, cg);
      el('rect', { x, y, width: cell, height: cell, rx: 9, fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 6 }, cg);
      const icon = el('use', { href: '#icon-traffic', x: x + cell * 0.12, y: y + cell * 0.12, width: cell * 0.76, height: cell * 0.76 }, cg);
      const redfill = el('rect', { x: x + 4, y: y + 4, width: cell - 8, height: cell - 8, rx: 7, fill: '#d7261e', opacity: 0 }, cg);
      const ripple = el('circle', { cx: x + cell / 2, cy: y + cell / 2, r: cell * 0.2, fill: 'none', stroke: '#d7261e', 'stroke-width': 6, opacity: 0 }, cg);
      const chk = el('path', { d: 'M-17 2 L-5 14 L20 -16', fill: 'none', stroke: '#d7261e', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: `translate(${x + cell / 2} ${y + cell / 2})`, opacity: 0 }, cg);
      cells.push({ cg, icon, redfill, ripple, chk, cx: x + cell / 2, cy: y + cell / 2, x, y, cell, r, c, k });
    }
    return { g, n, cell, gap, x0, y0, cells };
  }

  // 右侧网格区域中心 (1260,560)
  const grid9 = buildGrid(3, 235, 14, 894, 194);
  const grid4 = buildGrid(4, 175, 10, 895, 195);
  const grid6 = buildGrid(6, 112, 8, 908, 208);
  // 16×16 满屏
  const g16cell = 65, g16gap = 2, g16n = 16;
  const g16w = g16n * g16cell + (g16n - 1) * g16gap;
  const grid16 = buildGrid(g16n, g16cell, g16gap, (W - g16w) / 2, (H - g16w) / 2);

  // 配置每个网格的图标与目标
  function assignIcons(grid, targets, seed) {
    grid.cells.forEach(c => {
      c.target = false;
      c.icon.setAttribute('href', '#icon-' + ICON_KEYS[Math.floor(h(c.k * 3.1 + seed) * ICON_KEYS.length)]);
    });
    targets.forEach((k, i) => {
      const c = grid.cells[k];
      c.target = true;
      c.icon.setAttribute('href', c.pole ? '' : '#icon-' + (c.poleIcon || grid.targetIcon));
      if (c.pole) {
        c.icon.setAttribute('href', '');
        c.poleG = el('g', { transform: `translate(${c.x} ${c.y}) scale(${c.cell / 100})` }, c.cg);
        c.poleG.innerHTML = poleSliver;
      }
    });
  }
  grid9.targetIcon = 'traffic';
  grid4.targetIcon = 'moto';
  grid6.targetIcon = 'crosswalk';
  // grid9：4 个红绿灯 + 1 个半杆子
  grid9.cells[5].pole = true;
  assignIcons(grid9, [0, 2, 4, 6, 5], 11);
  // grid4：摩托车
  assignIcons(grid4, [1, 5, 6, 10, 11, 15], 23);
  // grid6：1/3/5 列整列斑马线
  (() => { const tg = []; for (let r = 0; r < 6; r++) [1, 3, 5].forEach(c => tg.push(r * 6 + c)); assignIcons(grid6, tg, 37); })();
  // grid16 图标随机（都会翻红）
  grid16.cells.forEach(c => c.icon.setAttribute('href', '#icon-' + ICON_KEYS[Math.floor(h(c.k * 1.7 + 5) * ICON_KEYS.length)]));

  // ---------- 屏幕文字（各场景） ----------
  function bigText(parent, x, y, size, font, fill, anchor, sw, sfill) {
    const t = el('text', { x, y, 'text-anchor': anchor || 'middle', 'font-family': font, 'font-size': size, fill, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, parent);
    if (sw) { t.setAttribute('stroke', sfill || '#f5ebd2'); t.setAttribute('stroke-width', sw); }
    return t;
  }
  const poleQ = bigText(world, CX, 150, 130, 'ZCOOL', '#d7261e', 'middle', 9, '#1b1410');
  const retryStamp = bigText(world, 1260, 560, 170, 'ZCOOL', '#d7261e', 'middle', 12, '#1b1410');
  txt(retryStamp, '请重试');
  const g4enc = bigText(world, 1260, 120, 110, 'ZCOOL', '#1b1410', 'middle', 8, '#f5ebd2');
  const g6txt = bigText(world, 1260, 130, 110, 'ZCOOL', '#d7261e', 'middle', 8, '#1b1410');
  txt(g6txt, '分身！');
  const g16title = bigText(world, CX, 120, 96, 'ZCOOL', '#1b1410', 'middle', 7, '#f5ebd2');
  const g16all = bigText(world, 300, 1000, 120, 'ZCOOL', '#d7261e', 'middle', 9, '#1b1410');
  txt(g16all, '全选！');
  const g16speed = bigText(world, 1560, 1010, 72, 'AntonF', '#1b1410', 'middle');
  txt(g16speed, '0.03秒/格');

  // ---------- 失败弹窗 ----------
  const gFail = el('g', {}, world);
  const failD = 'M560 300 Q560 270 590 270 L1330 270 Q1360 270 1360 300 L1360 760 Q1360 790 1330 790 L590 790 Q560 790 560 760 Z';
  hardShadow(gFail, failD, 20, 22);
  el('path', { d: failD, fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 9 }, gFail);
  // 大红 X
  el('path', { d: 'M700 360 L800 460 M800 360 L700 460', stroke: '#d7261e', 'stroke-width': 26, 'stroke-linecap': 'round' }, gFail);
  el('path', { d: 'M1120 360 L1220 460 M1220 360 L1120 460', stroke: '#d7261e', 'stroke-width': 26, 'stroke-linecap': 'round' }, gFail);
  const failTitle = bigText(gFail, 960, 560, 150, 'ZCOOL', '#1b1410', 'middle', 10, '#f5ebd2');
  txt(failTitle, '验证失败');
  const failSub1 = bigText(gFail, 960, 670, 66, 'ZCOOL', '#d7261e', 'middle');
  txt(failSub1, '你点得太快了');
  const failSub2 = bigText(gFail, 960, 745, 60, 'ZCOOL', '#1b1410', 'middle');
  txt(failSub2, '不像人类');

  // ---------- 黑色横幅 ----------
  const gBanner = el('g', {}, world);
  el('rect', { x: 0, y: 380, width: W, height: 320, fill: '#1b1410' }, gBanner);
  el('rect', { x: 0, y: 372, width: W, height: 10, fill: '#d7261e' }, gBanner);
  el('rect', { x: 0, y: 698, width: W, height: 10, fill: '#d7261e' }, gBanner);
  const bannerText = bigText(gBanner, CX, 600, 200, 'ZCOOL', '#f5ebd2', 'middle', 12, '#d7261e');
  txt(bannerText, '那就装成人类');

  // ---------- 装人类：练习面板 + 贴纸 ----------
  const gStick = el('g', {}, world);
  const stickPanelD = 'M480 170 Q480 150 500 150 L1420 150 Q1440 150 1440 170 L1440 930 Q1440 950 1420 950 L500 950 Q480 950 480 930 Z';
  el('path', { d: stickPanelD, fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 9 }, gStick);
  // 练习用 3 格
  const stickCells = [];
  [['car', 605], ['traffic', 865], ['moto', 1125]].forEach(([ic, x]) => {
    const y = 315, cw = 190;
    const cg = el('g', {}, gStick);
    el('rect', { x, y, width: cw, height: cw, rx: 10, fill: '#efe2c2', stroke: '#1b1410', 'stroke-width': 7 }, cg);
    el('use', { href: '#icon-' + ic, x: x + 23, y: y + 23, width: 144, height: 144 }, cg);
    const chk = el('path', { d: 'M-15 2 L-4 13 L18 -14', fill: 'none', stroke: '#d7261e', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: `translate(${x + cw / 2} ${y + cw / 2})`, opacity: 0 }, cg);
    stickCells.push({ cg, chk, cx: x + cw / 2, cy: y + cw / 2, ic });
  });
  // 红色手抖轨迹（格子下方）
  const trailPath = 'M560 640 Q660 585 760 640 T960 640 T1160 640 Q1260 695 1360 625';
  const trail = el('path', { d: trailPath, fill: 'none', stroke: '#d7261e', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': '18 16', opacity: 0 }, gStick);
  const trailLen = 1000;
  // 贴纸标签（手抖 / 点错时显示，犹豫时隐藏）
  const sLabel = bigText(gStick, 960, 255, 88, 'ZCOOL', '#d7261e', 'middle', 8, '#1b1410');
  // 犹豫气泡（中格正上方）
  const bubble = el('g', {}, gStick);
  el('rect', { x: 740, y: 200, width: 440, height: 86, rx: 28, fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 7 }, bubble);
  el('path', { d: 'M935 286 L960 318 L985 286 Z', fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 7, 'stroke-linejoin': 'round' }, bubble);
  const bubbleT = el('text', { x: 960, y: 258, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 58, fill: '#1b1410' }, bubble);
  txt(bubbleT, '嗯……');
  // 哎呀
  const oops = bigText(gStick, 960, 660, 96, 'ZCOOL', '#d7261e', 'middle', 8, '#1b1410');
  txt(oops, '哎呀！');
  // 验证按钮
  const sBtnD = 'M760 800 Q760 778 782 778 L1138 778 Q1160 778 1160 800 L1160 895 Q1160 917 1138 917 L782 917 Q760 917 760 895 Z';
  el('path', { d: sBtnD, fill: '#d7261e', stroke: '#1b1410', 'stroke-width': 7 }, gStick);
  const sBtnT = el('text', { x: 960, y: 872, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 74, fill: '#f5ebd2' }, gStick);
  txt(sBtnT, '验证');

  // ---------- 钻层 ----------
  const gDrill = el('g', {}, world);
  const drillCard = el('g', {}, gDrill);
  const drillRect = el('rect', { x: 360, y: 240, width: 1200, height: 600, rx: 30, fill: '#f5ebd2', stroke: '#1b1410', 'stroke-width': 10 }, drillCard);
  const drillCB = el('rect', { x: 520, y: 470, width: 140, height: 140, rx: 16, fill: '#efe2c2', stroke: '#1b1410', 'stroke-width': 10 }, drillCard);
  const drillCheck = el('path', { d: 'M-26 4 L-8 22 L32 -24', fill: 'none', stroke: '#d7261e', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'translate(590 540)', opacity: 0 }, drillCard);
  const drillText = el('text', { x: 720, y: 580, 'font-family': 'ZCOOL', 'font-size': 104, fill: '#1b1410' }, drillCard);
  const drillSide = bigText(gDrill, CX, 1020, 120, 'ZCOOL', '#d7261e', 'middle', 9, '#1b1410');

  // ---------- 人类可信度仪表 ----------
  const gMeter = el('g', {}, world);
  el('text', { x: CX, y: 132, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 104, fill: '#1b1410', 'paint-order': 'stroke', 'stroke': '#f5ebd2', 'stroke-width': 7 }, gMeter).textContent = '人类可信度';
  // 表盘
  el('path', { d: 'M360 760 A600 600 0 0 1 1560 760', fill: 'none', stroke: '#1b1410', 'stroke-width': 26, 'stroke-linecap': 'round' }, gMeter);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (1 - i / 10);
    const x1 = 960 + Math.cos(a) * 560, y1 = 760 - Math.sin(a) * 560;
    const x2 = 960 + Math.cos(a) * 600, y2 = 760 - Math.sin(a) * 600;
    el('line', { x1, y1, x2, y2, stroke: '#1b1410', 'stroke-width': 12, 'stroke-linecap': 'round' }, gMeter);
  }
  const needle = el('line', { x1: 960, y1: 760, x2: 960, y2: 230, stroke: '#d7261e', 'stroke-width': 18, 'stroke-linecap': 'round' }, gMeter);
  el('circle', { cx: 960, cy: 760, r: 34, fill: '#1b1410' }, gMeter);
  const meterValue = el('text', { x: CX, y: 980, 'text-anchor': 'middle', 'font-family': 'AntonF', 'font-size': 170, fill: '#1b1410' }, gMeter);
  txt(meterValue, '0%');
  const passStampT = bigText(gMeter, CX, CY + 60, 210, 'ZCOOL', '#d7261e', 'middle', 14, '#1b1410');
  txt(passStampT, '验证通过');

  // ---------- 跳切 ----------
  const gJump = el('g', {}, world);
  const jumpBg = el('rect', { x: 0, y: 0, width: W, height: H }, gJump);
  const jumpCheck = el('path', { d: 'M-120 10 L-30 100 L130 -110', fill: 'none', stroke: '#f5ebd2', 'stroke-width': 46, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: `translate(${CX} ${CY})` }, gJump);
  const jumpText = bigText(gJump, CX, CY + 40, 260, 'ZCOOL', '#f5ebd2', 'middle', 16, '#1b1410');

  // ---------- 结尾 ----------
  const gEnd = el('g', {}, world);
  const endText = bigText(gEnd, CX, CY + 40, 240, 'ZCOOL', '#f5ebd2', 'middle', 14, '#1b1410');
  txt(endText, '我不是机器人。');
  const crossLine = el('path', { d: 'M555 330 L745 685', stroke: '#d7261e', 'stroke-width': 36, 'stroke-linecap': 'round', opacity: 0 }, gEnd);
  const endRead = bigText(gEnd, CX, CY + 260, 90, 'ZCOOL', '#d7261e', 'middle');
  txt(endRead, '（我是机器人。）');
  const signText = el('text', { x: CX, y: 980, 'text-anchor': 'middle', 'font-family': 'ZCOOL', 'font-size': 64, fill: '#f5ebd2' }, gEnd);
  txt(signText, '由 Doubao 在 30 秒内用纯代码制作完成');

  // ---------- 光标（16 个） ----------
  const gCursors = el('g', {}, world);
  const cursorD = 'M0 0 L0 26 L7 19 L12 31 L17 29 L12 17 L21 17 Z';
  const cursors = [];
  for (let i = 0; i < 16; i++) {
    const cg = el('g', {}, gCursors);
    el('path', { d: cursorD, fill: '#1b1410', transform: 'translate(4 5)' }, cg);
    el('path', { d: cursorD, fill: '#1b1410', stroke: '#f5ebd2', 'stroke-width': 3, 'paint-order': 'stroke fill' }, cg);
    cursors.push(cg);
  }
  function setCursor(i, x, y, angle, sc, vis) {
    const cg = cursors[i];
    show(cg, vis);
    cg.setAttribute('transform', `translate(${x} ${y}) rotate(${angle || 0}) scale(${sc == null ? 1 : sc})`);
  }

  // ---------- FX：爆炸框 / 集中线 / 速度线 ----------
  const gFx = el('g', {}, world);
  function starburst(spikes, R, fill, stroke, sw) {
    let pts = '';
    for (let i = 0; i < spikes * 2; i++) {
      const rr = i % 2 ? R * 0.82 : R;
      const a = (i / (spikes * 2)) * P;
      pts += `${Math.cos(a) * rr},${Math.sin(a) * rr} `;
    }
    return el('polygon', { points: pts, fill, stroke: stroke || '#1b1410', 'stroke-width': sw || 10, 'stroke-linejoin': 'round' }, gFx);
  }
  const sbRed = starburst(26, 260, '#d7261e');
  const sbCream = starburst(22, 200, '#f5ebd2');
  // 集中线
  const conc = el('g', {}, gFx);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * P;
    el('line', { x1: Math.cos(a) * 180, y1: Math.sin(a) * 180, x2: Math.cos(a) * 900, y2: Math.sin(a) * 900, stroke: '#1b1410', 'stroke-width': 9, 'stroke-linecap': 'round' }, conc);
  }
  // 速度线
  const speed = el('g', {}, gFx);
  for (let i = 0; i < 30; i++) {
    const y = h(i * 5.3) * H;
    const x = h(i * 9.1) * W;
    el('line', { x1: x, y1: y, x2: x + 120 + h(i) * 260, y2: y, stroke: i % 4 ? '#1b1410' : '#d7261e', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8 }, speed);
  }

  // ---------- 屏幕空间顶层：闪白 / 纸纹 / 黑场 ----------
  const flash = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff', opacity: 0 }, stage);
  const paper = el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#grain)', opacity: 0.5 }, stage);
  const blackfield = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#000000', opacity: 1 }, stage);

  // ---------- 冲击表（震屏/闪白） ----------
  const HITS = [
    { t: T.cardStamp, sh: 40, fl: 0.9 },
    { t: T.grid9Drop, sh: 30, fl: 0.7 },
    { t: T.poleHardClick, sh: 14, fl: 0.3 },
    { t: T.verify9, sh: 26, fl: 0.6 },
    { t: T.grid4In, sh: 22, fl: 0.5 },
    { t: T.grid6In, sh: 20, fl: 0.5 },
    { t: T.grid16In, sh: 44, fl: 0.95 },
    { t: T.g16End, sh: 24, fl: 0.4 },
    { t: T.failStamp, sh: 40, fl: 0.8 },
    { t: T.humanBanner, sh: 34, fl: 0.7 },
    { t: T.passMoment, sh: 42, fl: 0.95 },
    { t: T.crossOut, sh: 30, fl: 0.7 }
  ];
  for (let i = 0; i < T.jumpCount; i++) HITS.push({ t: T.jumpStart + i * T.jumpStep, sh: 12, fl: 0.18 });

  // ---------- 点击调度表 ----------
  const sched9 = [
    { t: 3.5, k: 0 }, { t: 4.0, k: 2 }, { t: 4.5, k: 4 }, { t: 5.0, k: 6 },
    { t: 6.5, k: 5, pole: true }, { t: 7.0, x: BTN_CENTER.x, y: BTN_CENTER.y, btn: true }
  ];
  const g4order = [1, 5, 6, 10, 11, 15, 1, 6, 11];
  const sched4 = g4order.map((k, i) => ({ t: T.g4Start + i * 0.25, k }));
  const sched6col = [{ t: 10.4, c: 1 }, { t: 10.9, c: 3 }, { t: 11.4, c: 5 }];

  // 让光标沿调度移动，返回当前应在位置
  function follow(sched, t, centers) {
    for (let i = 0; i < sched.length; i++) {
      const s = sched[i];
      const lead = 0.22;
      if (t <= s.t + 0.3) {
        const prev = sched[i - 1];
        let px, py;
        if (prev) { const pc = prev.k != null ? centers[prev.k] : prev; px = pc.cx != null ? pc.cx : pc.x; py = pc.cy != null ? pc.cy : pc.y; }
        else { px = 320; py = 300; }
        const tc = s.k != null ? centers[s.k] : s;
        const tx = tc.cx != null ? tc.cx : tc.x, ty = tc.cy != null ? tc.cy : tc.y;
        const p = smooth(s.t - lead, s.t, t);
        return { x: lerp(px, tx, p), y: lerp(py, ty, p), t: s.t, k: s.k };
      }
    }
    const last = sched[sched.length - 1];
    const lc = last.k != null ? centers[last.k] : last;
    return { x: lc.cx != null ? lc.cx : lc.x, y: lc.cy != null ? lc.cy : lc.y, t: last.t, k: last.k };
  }

  // 格子按压/勾选/涟漪
  function paintCells(grid, schedule, t) {
    grid.cells.forEach(c => {
      c.chk.setAttribute('opacity', 0);
      c.ripple.setAttribute('opacity', 0);
      c.cg.setAttribute('transform', '');
    });
    schedule.forEach(s => {
      if (s.k == null) return;
      const c = grid.cells[s.k];
      const dt = t - s.t;
      if (dt >= 0) {
        // 按压 0.12s
        if (dt < 0.12) { const sc = 1 - 0.18 * Math.sin((dt / 0.12) * Math.PI); c.cg.setAttribute('transform', `translate(${c.cx} ${c.cy}) scale(${sc}) translate(${-c.cx} ${-c.cy})`); }
        if (!s.pole) { c.chk.setAttribute('opacity', 1); const cp = backOut(clamp(dt / 0.25, 0, 1)); c.chk.setAttribute('transform', `translate(${c.cx} ${c.cy}) scale(${cp})`); }
        const rp = dt / 0.5;
        if (rp < 1) { c.ripple.setAttribute('r', c.cell * (0.2 + 0.5 * rp)); c.ripple.setAttribute('opacity', 0.9 * (1 - rp)); }
      }
    });
  }

  // ============================ 主渲染 ============================
  function render(t0) {
    // 定格：盖章砸完(0.26s)后，15.26–15.6 钳到“已落定”的 15.26
    const FREEZE_AT = T.failStamp + 0.26;
    const frozen = t0 >= FREEZE_AT && t0 < T.freezeEnd;
    let t = frozen ? FREEZE_AT : t0;
    const frame = Math.floor(t * T.fps + 0.5);
    const seed3 = Math.floor(frame / 3);

    // ---- 背景色 ----
    let bgFill = '#efe2c2';
    if (t < 1.0) bgFill = '#100c09';
    // 钻层底色 红→黑→米
    if (t >= T.drillStart && t < T.meterStart) {
      const li = Math.min(3, Math.floor((t - T.drillStart) / (T.drillStep)));
      bgFill = ['#d7261e', '#1b1410', '#efe2c2', '#d7261e'][li];
    }
    // 跳切换色
    if (t >= T.jumpStart && t < T.endText) {
      const ji = Math.floor((t - T.jumpStart) / T.jumpStep);
      bgFill = ['#d7261e', '#1b1410', '#efe2c2'][ji % 3];
    }
    if (t >= T.endText) bgFill = '#100c09';
    bg.setAttribute('fill', bgFill);

    // ---- 相机（变焦/推移） ----
    let zoom = 1, focalX = CX, focalY = CY;
    // 杆子笑点推近
    if (t >= T.poleStart && t < 7.0) {
      const pc = grid9.cells[5];
      zoom = 1 + 0.16 * smooth(T.poleStart, T.poleStart + 0.4, t) * (1 - smooth(6.7, 7.0, t));
      focalX = pc.cx; focalY = pc.cy;
    }
    // 16×16 粉碎变焦
    if (t >= T.grid16In && t < T.grid16In + 0.35) {
      const p = (t - T.grid16In) / 0.35;
      zoom *= 1 + 0.18 * (1 - easeOutCubic(p));
    }
    // 等待结果时整屏轻微推回，保持画面运动
    if (t >= T.verify16 && t < T.failStamp) {
      zoom *= 1 + 0.05 * (1 - smooth(T.verify16, T.failStamp, t));
    }
    // 钻层推进勾选框
    if (t >= T.drillStart && t < T.meterStart) {
      const li = Math.floor((t - T.drillStart) / T.drillStep);
      const lp = (t - T.drillStart - li * T.drillStep) / T.drillStep;
      zoom *= 1 + 1.6 * easeOutCubic(lp);
    }

    // ---- 震屏 ----
    let shx = 0, shy = 0;
    let flOp = 0;
    for (const hit of HITS) {
      const dt = t - hit.t;
      if (dt >= 0 && dt < 0.5) {
        const a = hit.sh * Math.exp(-9 * dt);
        shx += (h(seed3 * 7 + hit.t) - 0.5) * 2 * a;
        shy += (h(seed3 * 13 + hit.t) - 0.5) * 2 * a;
      }
      if (dt >= 0 && dt < 0.1) flOp = Math.max(flOp, hit.fl * (1 - dt / 0.1));
    }
    flash.setAttribute('opacity', flOp);

    world.setAttribute('transform',
      `translate(${shx} ${shy}) translate(${focalX} ${focalY}) scale(${zoom}) translate(${-focalX} ${-focalY})`);

    // ---- 沸腾滤镜 seed 每帧换（用 frame；定格时 frame 恒定，故定格中不动） ----
    for (let i = 1; i <= 3; i++) {
      const f = document.getElementById('boil' + i);
      f.firstChild.setAttribute('seed', (frame * 7 + i * 13) % 240);
    }
    grainT.setAttribute('seed', seed3 % 60);

    // ---- 默认隐藏所有场景组，再按阶段打开 ----
    [gIntro, gCard, gPanel, grid9.g, grid4.g, grid6.g, grid16.g, gFail, gBanner, gStick, gDrill, gMeter, gJump, gEnd].forEach(g => show(g, false));
    show(sbRed, false); show(sbCream, false); show(conc, false); show(speed, false);
    for (let i = 0; i < 16; i++) show(cursors[i], false);
    [poleQ, retryStamp, g4enc, g6txt, g16title, g16all, g16speed, crossLine, endRead].forEach(e => e.setAttribute('opacity', 0));

    // ================= 开场 0–1 =================
    if (t < 1.05) {
      show(gIntro, true);
      gIntro.setAttribute('filter', '');
      introNT.setAttribute('seed', frame % 240);
      const bitStrings = ['01001011', '11010010', '00110101', '10110100', '11100010'];
      txt(introDigits, bitStrings[frame % bitStrings.length]);
      introDigits.setAttribute('opacity', 0.22 + 0.32 * h(frame * 2.3));
      const glNow = T.introGlitch.some(g => t >= g && t < g + 0.12);
      // 闪三下：每次故障一个全屏短闪（白/红交替）
      let flash = 0, flashRed = false;
      T.introGlitch.forEach((g, k) => {
        const dt = t - g;
        if (dt >= 0 && dt < 0.1) { const e = 1 - dt / 0.1; if (e > flash) { flash = e; flashRed = (k === 1); } }
      });
      introFlash.setAttribute('fill', flashRed ? '#d7261e' : '#efe2c2');
      introFlash.setAttribute('opacity', flash * 0.55);
      introBars.forEach((r, i) => {
        const y = h(i * 3.7) * H;
        if (glNow && h(i + frame) > 0.25) {
          const w = 140 + h(i + frame * 2) * 1000, x = h(i * 1.9 + frame) * (W - w);
          r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w);
          r.setAttribute('height', 8 + h(i + frame) * 30); r.setAttribute('opacity', 1);
          r.setAttribute('fill', i % 3 === 0 ? '#d7261e' : (i % 3 === 1 ? '#efe2c2' : '#1b1410'));
        } else {
          // 持续扫描噪点（每帧移动）
          const w = 40 + h(i + frame) * 420, x = h(i * 2.7 + frame * 1.3) * (W - w);
          r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w);
          r.setAttribute('height', 2 + h(i + frame) * 4);
          r.setAttribute('opacity', 0.1 + 0.18 * h(i + frame * 3));
          r.setAttribute('fill', i % 4 === 0 ? '#d7261e' : '#efe2c2');
        }
      });
    }

    // ================= 验证卡 1.0–2.7 =================
    if (t >= T.cardStamp && t < 2.7) {
      show(gCard, true);
      gCard.setAttribute('filter', 'url(#boil1)');
      const p = clamp((t - T.cardStamp) / 0.28, 0, 1);
      let sc;
      if (p < 0.4) sc = 2.2 - 1.2 * (p / 0.4);
      else sc = 1 + 0.12 * (1 - (p - 0.4) / 0.6);
      // fling 2.5 起
      let fx2 = 0, fy2 = 0, rot = 0, op = 1;
      if (t >= T.cardFling) { const fp = (t - T.cardFling) / 0.2; fx2 = fp * 1600; fy2 = -fp * 300; rot = fp * 22; op = 1 - fp; }
      gCard.setAttribute('opacity', clamp(op, 0, 1));
      gCard.setAttribute('transform', `translate(${fx2} ${fy2}) translate(${CX} 550) rotate(${rot}) scale(${sc}) translate(${-CX} -550)`);
      // spinner
      if (t >= T.loadStart && t < T.loadEnd) {
        spinner.setAttribute('opacity', 1);
        spinner.setAttribute('transform', `translate(${cbX + cbS / 2} ${cbY + cbS / 2}) rotate(${((t - T.loadStart) * 540) % 360})`);
      } else spinner.setAttribute('opacity', 0);
      // 盖章爆炸框
      if (t < T.cardStamp + 0.4) {
        show(sbRed, true);
        sbRed.setAttribute('transform', `translate(${CX} 550) scale(${backOut(p)})`);
        sbRed.setAttribute('opacity', 1 - smooth(T.cardStamp + 0.25, T.cardStamp + 0.4, t));
      }
    }

    // ================= 九宫格 2.95–7.5 =================
    if (t >= T.grid9Drop && t < 7.5) {
      show(gPanel, true); show(grid9.g, true);
      txt(panelBig, '红绿灯');
      grid9.g.setAttribute('filter', 'url(#boil2)');
      // 砸下
      const p = clamp((t - T.grid9Drop) / 0.3, 0, 1);
      let dy = (1 - easeOutCubic(p)) * -700;
      grid9.g.setAttribute('transform', `translate(0 ${dy})`);
      paintCells(grid9, sched9, t);
      // 杆子笑点
      if (t >= T.poleStart && t < 6.9) {
        show(conc, true);
        const pc = grid9.cells[5];
        conc.setAttribute('transform', `translate(${pc.cx} ${pc.cy})`);
        conc.setAttribute('opacity', 0.85);
        conc.childNodes.forEach((ln, i) => {
          const j = 0.75 + 0.45 * h(i + seed3);
          ln.setAttribute('x2', Math.cos((i / 48) * P) * 900 * j);
          ln.setAttribute('y2', Math.sin((i / 48) * P) * 900 * j);
        });
        poleQ.setAttribute('opacity', smooth(T.poleStart + 0.2, T.poleStart + 0.5, t));
      }
      // 请重试章
      if (t >= T.verify9 && t < 7.5) {
        retryStamp.setAttribute('opacity', 1);
        const rp = clamp((t - T.verify9) / 0.22, 0, 1);
        retryStamp.setAttribute('transform', `translate(1260 560) scale(${2.2 - 1.2 * easeOutCubic(rp)}) translate(-1260 -560)`);
      }
      // 光标
      if (t < T.poleStart) {
        const pos = follow(sched9.slice(0, 4), t, grid9.cells);
        setCursor(0, pos.x, pos.y, 0, 1.4, true);
      } else if (t < T.poleHardClick) {
        const pc = grid9.cells[5];
        const amp = 6 + 26 * smooth(T.poleStart, T.poleHardClick, t);
        setCursor(0, pc.cx + (h(seed3) - 0.5) * 2 * amp, pc.cy + (h(seed3 * 2) - 0.5) * 2 * amp, 0, 1.4, true);
      } else if (t < T.verify9 + 0.05) {
        const pc = grid9.cells[5];
        setCursor(0, pc.cx, pc.cy, 0, 1.4, t < 6.62 || t > 6.8);
        if (t >= 6.8) { setCursor(0, BTN_CENTER.x, BTN_CENTER.y, 0, 1.4, true); }
      } else {
        setCursor(0, BTN_CENTER.x, BTN_CENTER.y, 0, 1.4, t < 7.3);
      }
    }

    // ================= 4×4 7.5–10 =================
    if (t >= T.grid4In && t < T.grid6In) {
      show(gPanel, true); show(grid4.g, true);
      txt(panelBig, '摩托车');
      const p = clamp((t - T.grid4In) / 0.3, 0, 1);
      grid4.g.setAttribute('transform', `translate(${(1 - easeOutCubic(p)) * 1400} 0) rotate(${(1 - p) * 8})`);
      grid4.g.setAttribute('filter', 'url(#boil2)');
      paintCells(grid4, sched4, t);
      const pos = follow(sched4, t, grid4.cells);
      setCursor(0, pos.x, pos.y, 0, 1.2, true);
      if (t >= 8.3) { g4enc.setAttribute('opacity', 1); txt(g4enc, t < 9.0 ? '点！' : (t < 9.5 ? '点点！' : '点点点！')); }
    }

    // ================= 6×6 10–12 =================
    if (t >= T.grid6In && t < T.grid16In) {
      show(gPanel, true); show(grid6.g, true);
      txt(panelBig, '斑马线');
      grid6.g.setAttribute('filter', 'url(#boil2)');
      const p = clamp((t - T.grid6In) / 0.3, 0, 1);
      grid6.g.setAttribute('transform', `translate(0 ${(1 - easeOutCubic(p)) * 800})`);
      g6txt.setAttribute('opacity', t < 10.7 ? 1 : 0);
      // 列勾选
      sched6col.forEach(s => {
        if (t >= s.t) {
          for (let r = 0; r < 6; r++) {
            const c = grid6.cells[r * 6 + s.c];
            c.chk.setAttribute('opacity', 1);
            const cp = backOut(clamp((t - s.t) / 0.25, 0, 1));
            c.chk.setAttribute('transform', `translate(${c.cx} ${c.cy}) scale(${0.8 * cp})`);
          }
        }
      });
      // 三个分身光标
      sched6col.forEach((s, ci) => {
        const active = t >= s.t - 0.3;
        let row = 3;
        const c = grid6.cells[row * 6 + s.c];
        let x = c.cx, y = c.cy;
        if (t < s.t) { const p = smooth(s.t - 0.3, s.t, t); y = lerp(c.cy - 300, c.cy, p); }
        setCursor(ci, x, y, 0, 1.05, active);
      });
    }

    // ================= 16×16 12–15.0 =================
    if (t >= T.grid16In && t < T.failStamp) {
      show(grid16.g, true);
      grid16.g.setAttribute('transform', '');
      const p = clamp((t - T.g16Start) / (T.g16End - T.g16Start), 0, 1);
      const titles = ['船', '烟囱', '楼梯', '消防栓', '红绿灯', '摩托车'];
      g16title.setAttribute('opacity', 1);
      txt(g16title, '请选出所有 ' + titles[Math.floor(t / 0.25) % titles.length]);
      g16all.setAttribute('opacity', t > 12.6 ? 1 : 0);
      g16speed.setAttribute('opacity', t > 13.0 ? 1 : 0);
      const band = p * (g16n * 2);
      grid16.cells.forEach(c => {
        const d = c.r + c.c;
        const flip = d < band;
        let op = c.redfill.getAttribute('opacity') * 0;
        c.redfill.setAttribute('opacity', flip ? 1 : 0);
        c.icon.setAttribute('opacity', flip ? 0.25 : 1);
      });
      // 16 个光标沿对角线
      if (t < T.g16End) {
        for (let i = 0; i < 16; i++) {
          const d = band - i * 0.9 - 1;
          if (d < -1 || d > g16n * 2) continue;
          const rr = clamp(Math.round(d), 0, g16n - 1), cc = clamp(Math.round(d - rr), 0, g16n - 1);
          const c = grid16.cells[rr * g16n + cc];
          setCursor(i, c.cx, c.cy, 0, 0.85, true);
        }
      } else if (t < T.mergeClick + 0.1) {
        // 合体
        const mp = clamp((t - T.g16End) / (T.mergeClick - T.g16End), 0, 1);
        setCursor(0, lerp(grid16.cells[0].cx, CX, mp), lerp(grid16.cells[0].cy, CY, mp), 0, 0.85 + mp, true);
        for (let i = 1; i < 16; i++) {
          const c = grid16.cells[Math.min(i * 16, 255)];
          setCursor(i, lerp(c.cx, CX, mp), lerp(c.cy, CY, mp), 0, 0.85 * (1 - mp), mp < 0.9);
        }
      } else {
        if (t < T.verify16) {
          const p = smooth(T.mergeClick, T.verify16, t);
          setCursor(0, CX, lerp(CY, 1010, easeOutCubic(p)), 0, 1.2, true);
        } else {
          // 等待结果，光标逐帧轻微发抖，避免静止空窗
          setCursor(0, CX + (h(frame * 1.7) - 0.5) * 16, 1010 + (h(frame * 2.9) - 0.5) * 16, 0, 1.2, true);
        }
      }
    }

    // ================= 失败弹窗 15.0–16.4 =================
    if (t >= T.failStamp && t < T.popupOut) {
      show(gFail, true);
      const p = clamp((t - T.failStamp) / 0.24, 0, 1);
      let sc = 2.2 - 1.2 * easeOutCubic(p);
      let fy = 0, rot = 0, op = 1;
      if (t >= T.popupFall) { const fp = (t - T.popupFall) / (T.popupOut - T.popupFall); fy = fp * 1300; rot = fp * 14; op = 1 - fp * 0.4; }
      gFail.setAttribute('opacity', op);
      gFail.setAttribute('transform', `translate(0 ${fy}) translate(${CX} ${CY}) rotate(${rot}) scale(${sc}) translate(${-CX} ${-CY})`);
      if (t < T.failStamp + 0.4) {
        show(sbCream, true);
        sbCream.setAttribute('transform', `translate(${CX} ${CY}) scale(${backOut(p) * 1.6})`);
        sbCream.setAttribute('opacity', 0.5 * (1 - p));
      }
      // 15.7 起光标发抖
      if (t >= T.shakeStart && t < T.popupFall) {
        const amp = 10 + 16 * smooth(T.shakeStart, T.popupFall, t);
        setCursor(0, 700 + (h(frame * 1.3) - 0.5) * 2 * amp, 820 + (h(frame * 2.7) - 0.5) * 2 * amp, 0, 1.2, true);
      }
    }

    // ================= 黑色横幅 16.5–17.2 =================
    if (t >= T.humanBanner && t < T.shakyHand) {
      show(gBanner, true);
      gBanner.setAttribute('filter', 'url(#boil3)');
      const p = clamp((t - T.humanBanner) / 0.2, 0, 1);
      gBanner.setAttribute('transform', `translate(0 ${(1 - easeOutCubic(p)) * -600})`);
      if (t < T.humanBanner + 0.4) { show(sbRed, true); sbRed.setAttribute('transform', `translate(${CX} ${CY}) scale(${backOut(p)})`); sbRed.setAttribute('opacity', 0.5); }
    }

    // ================= 装人类贴纸 17.25–20.2 =================
    if (t >= T.shakyHand && t < T.drillStart) {
      show(gStick, true);
      gStick.setAttribute('transform', '');
      gStick.setAttribute('filter', 'url(#boil1)');
      const isShaky = t < T.hesitate;
      const isHes = t >= T.hesitate && t < T.misclick;
      // 标签（犹豫段隐藏，交给气泡）
      txt(sLabel, isShaky ? '装手抖' : '装点错');
      sLabel.setAttribute('opacity', isHes ? 0 : 1);
      show(bubble, isHes);
      oops.setAttribute('opacity', t >= T.misclick + 0.3 ? 1 : 0);
      // 手抖轨迹
      trail.setAttribute('opacity', isShaky ? 0.95 : 0);
      if (isShaky) {
        const p = smooth(T.shakyHand, T.hesitate, t);
        trail.setAttribute('stroke-dashoffset', trailLen * (1 - p));
        const tx = 560 + p * 800, ty = 640 + Math.sin(p * 9) * 28;
        setCursor(0, tx + (h(seed3) - 0.5) * 22, ty + (h(seed3 * 2) - 0.5) * 22, (h(seed3) - 0.5) * 30, 1.1, true);
      } else if (isHes) {
        const cell = stickCells[1];
        const a = smooth(T.hesitate, T.hesitate + 0.6, t) * P * 2;
        setCursor(0, cell.cx + Math.cos(a) * 150, cell.cy + Math.sin(a) * 120, 0, 1.1, true);
      } else if (t < T.verifyHuman) {
        const cell = stickCells[0];
        const checked = t < T.misclick + 0.32;
        cell.chk.setAttribute('opacity', checked ? 1 : 0);
        const cp = backOut(clamp((t - T.misclick) / 0.2, 0, 1));
        if (checked) cell.chk.setAttribute('transform', `translate(${cell.cx} ${cell.cy}) scale(${cp})`);
        setCursor(0, cell.cx, cell.cy, 0, 1.1, true);
      } else {
        const p = smooth(T.verifyHuman, T.verifyHuman + 0.2, t);
        setCursor(0, lerp(stickCells[0].cx, 960, p), lerp(stickCells[0].cy, 847, p), 0, 1.1, t < 20.15);
      }
    }

    // ================= 钻层 20.25–21.75 =================
    if (t >= T.drillStart && t < T.meterStart) {
      show(gDrill, true);
      const li = Math.floor((t - T.drillStart) / T.drillStep);
      const lp = (t - T.drillStart - li * T.drillStep) / T.drillStep;
      const texts = ['我真的不是机器人', '我发誓不是机器人', '我对天发誓不是机器人', '我真的真的不是机器人'];
      txt(drillText, texts[li]);
      const dark = li === 1;
      drillRect.setAttribute('fill', dark ? '#2a211a' : '#f5ebd2');
      drillText.setAttribute('fill', dark ? '#f5ebd2' : '#1b1410');
      drillCB.setAttribute('fill', dark ? '#1b1410' : '#efe2c2');
      drillCheck.setAttribute('opacity', lp > 0.35 ? 1 : 0);
      drillCard.setAttribute('transform', `translate(${CX} 540) scale(${0.9 + lp * 0.3}) translate(${-CX} -540)`);
      drillSide.setAttribute('opacity', 1);
      txt(drillSide, li === 0 ? '又来？！' : '还来？？');
      setCursor(0, 590, 540, 0, 1, lp < 0.3);
    }

    // ================= 仪表 22–24 =================
    if (t >= T.meterStart && t < T.jumpStart) {
      show(gMeter, true);
      gMeter.setAttribute('filter', 'url(#boil2)');
      const segs = T.meterVals;
      // 阶梯式：滴答(tick)起爬 → 啵(pop)落到新值并停住
      const cTick = [22.0, 22.25, 22.5, 22.75];
      const cLand = [22.08, 22.33, 22.58, 22.83];
      const cFrom = [0, 37, 64, 88];
      let val = 0;
      for (let k = 0; k < 4; k++) {
        if (t >= cTick[k]) {
          const cp = clamp((t - cTick[k]) / (cLand[k] - cTick[k]), 0, 1);
          val = Math.round(lerp(cFrom[k], segs[k + 1], backOut(cp)));
        }
      }
      if (t >= T.passMoment) val = 100;
      // 99 逐帧发抖
      let jx = 0;
      if (val === 99) jx = (h(frame * 1.9) - 0.5) * 18;
      meterValue.setAttribute('transform', `translate(${jx} 0)`);
      txt(meterValue, val + '%');
      const ang = Math.PI * (1 - val / 100);
      needle.setAttribute('x2', 960 + Math.cos(ang) * 530);
      needle.setAttribute('y2', 760 - Math.sin(ang) * 530);
      passStampT.setAttribute('opacity', t >= T.passMoment ? 1 : 0);
      if (t >= T.passMoment) {
        const p = clamp((t - T.passMoment) / 0.22, 0, 1);
        passStampT.setAttribute('transform', `translate(${CX} ${CY + 60}) scale(${2.2 - 1.2 * easeOutCubic(p)}) translate(${-CX} ${-(CY + 60)})`);
        show(sbRed, true); sbRed.setAttribute('transform', `translate(${CX} ${CY}) scale(${backOut(p)})`); sbRed.setAttribute('opacity', 0.6);
      }
    }

    // ================= 跳切 24–27 =================
    if (t >= T.jumpStart && t < T.endText) {
      show(gJump, true);
      gJump.setAttribute('filter', 'url(#boil3)');
      const ji = Math.floor((t - T.jumpStart) / T.jumpStep);
      const bgc = ['#d7261e', '#1b1410', '#efe2c2'][ji % 3];
      jumpBg.setAttribute('fill', bgc);
      const words = ['通过！', '人类！', '欢迎！', '真人！', '认证！', '通过！！'];
      txt(jumpText, words[ji % words.length]);
      const dark = ji % 3 === 1 || ji % 3 === 0;
      jumpText.setAttribute('fill', ji % 3 === 2 ? '#1b1410' : '#f5ebd2');
      jumpText.setAttribute('stroke', ji % 3 === 2 ? '#f5ebd2' : '#1b1410');
      jumpCheck.setAttribute('opacity', ji % 2 ? 1 : 0);
      jumpCheck.setAttribute('stroke', ji % 3 === 2 ? '#d7261e' : '#f5ebd2');
    }

    // ================= 结尾 27–29.5 =================
    if (t >= T.endText && t < 29.5) {
      show(gEnd, true);
      gEnd.setAttribute('filter', 'url(#boil1)');
      if (t >= T.crossOut) {
        const p = clamp((t - T.crossOut) / 0.18, 0, 1);
        crossLine.setAttribute('opacity', 1);
        crossLine.setAttribute('stroke-dasharray', 420);
        crossLine.setAttribute('stroke-dashoffset', 420 * (1 - p));
        endRead.setAttribute('opacity', smooth(T.crossOut + 0.25, T.crossOut + 0.5, t));
        if (p > 0.2 && p < 0.8) { show(sbRed, true); sbRed.setAttribute('transform', `translate(600 500) scale(${backOut(p)})`); sbRed.setAttribute('opacity', 0.7 * (1 - Math.abs(p - 0.5))); }
      }
      signText.setAttribute('opacity', t >= T.signOff ? 1 : 0);
      // 光标探头
      if (t >= T.peek) {
        const p = smooth(T.peek, T.peek + 0.3, t);
        const out = t > T.peekClick + 0.1;
        setCursor(0, lerp(1980, 1780, p), lerp(1120, 980, p), 0, 1.3, !out);
      }
    }

    // ---- 黑场（仅开场极短淡入 + 收尾黑场） ----
    let bf = 0;
    // intro 本身即黑底故障画面，不再整段盖黑；仅前 0.12s 从黑淡入
    bf = Math.max(bf, 1 - smooth(0, 0.12, t0));
    if (t0 >= T.blackOut) bf = Math.max(bf, smooth(T.blackOut, T.blackOut + 0.18, t0));
    blackfield.setAttribute('opacity', clamp(bf, 0, 1));
  }

  window.render = render;
  // 初始画一帧（黑场）
  render(0);
})();
