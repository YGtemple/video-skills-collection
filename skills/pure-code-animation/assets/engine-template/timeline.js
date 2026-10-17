// timeline.js —— 全片唯一的时间表。画面与音效都从这里取时间，别处不写死秒数。
(function (global) {
  const T = {
    fps: 30,
    duration: 30,

    // 0–1 开场黑屏故障
    introStart: 0.0,
    introGlitch: [0.12, 0.42, 0.78],   // 闪三下
    cardStamp: 1.0,                    // 验证卡盖章砸下
    cursorFall: 1.25,                  // 光标开始掉落
    cursorLand: 1.5,                   // 光标落地
    checkClick: 2.0,                   // 点勾选框
    loadStart: 2.05,
    loadEnd: 2.45,
    cardFling: 2.5,                    // 卡片甩走
    grid9Drop: 2.95,                   // 九宫格砸下

    g9Clicks: [3.5, 4.0, 4.5, 5.0],    // 逐格点红绿灯
    poleStart: 5.5,                    // 半根杆子笑点
    poleEnd: 6.4,
    poleHardClick: 6.5,
    verify9: 7.0,                      // 点验证 -> 请重试

    grid4In: 7.5,                      // 4x4 甩入
    g4Start: 7.75,
    g4End: 9.75,
    grid6In: 10.0,                     // 6x6 + 分身
    g6Start: 10.25,
    g6End: 11.5,

    grid16In: 12.0,                    // 粉碎变焦 + 16x16
    g16Start: 12.15,
    g16End: 13.7,
    mergeClick: 14.0,                  // 合体点验证
    verify16: 14.4,

    failStamp: 15.0,                   // 失败弹窗 + 定格静音
    freezeEnd: 15.6,
    shakeStart: 15.7,
    popupFall: 16.0,
    popupOut: 16.4,
    humanBanner: 16.5,                 // 那就装成人类

    shakyHand: 17.25,                  // 装手抖
    shakyHandEnd: 18.0,
    hesitate: 18.25,                   // 装犹豫
    hesitateEnd: 19.0,
    misclick: 19.25,                   // 装点错
    misclickEnd: 19.75,
    verifyHuman: 20.0,

    drillStart: 20.25,                 // 钻层，每 0.5 一层
    drillStep: 0.5,
    drillCount: 4,
    drillEnd: 21.75,

    meterStart: 22.0,                  // 人类可信度仪表
    meterVals: [0, 37, 64, 88, 99],
    meterHold: 23.0,
    passMoment: 23.5,                  // 100% + 验证通过

    jumpStart: 24.0,                   // 12 个跳切
    jumpStep: 0.25,
    jumpCount: 12,
    endText: 27.0,                     // 我不是机器人。
    crossOut: 27.6,                    // 划掉「不」
    signOff: 28.2,                     // 署名
    peek: 28.8,
    peekClick: 29.2,
    blackOut: 29.5
  };

  // ---------- 音效线索（cue.t 对 whoosh/riser 表示“命中/到顶”时刻，声音结束点对准它） ----------
  const C = [];
  const add = (t, s, opts) => C.push(Object.assign({ t, s }, opts || {}));

  add(0, 'room');                       // 房间底噪，铺到底
  add(0, 'hum', { dur: 1.0 });
  T.introGlitch.forEach(t => add(t, 'glitch'));

  add(T.cardStamp, 'whoosh', { dur: 0.55 });
  add(T.cardStamp, 'slam');
  add(T.cardStamp, 'burst');

  add(T.cursorLand, 'thud');
  add(T.checkClick, 'click');
  [2.12, 2.22, 2.32, 2.42].forEach(t => add(t, 'tick'));

  add(T.cardFling, 'whip');
  add(T.grid9Drop, 'slam');
  add(T.grid9Drop, 'low');

  T.g9Clicks.forEach(t => { add(t, 'click'); add(t + 0.05, 'pop'); });

  // 杆子段：滴答越来越密
  let pt = T.poleStart;
  let interval = 0.22;
  while (pt < T.poleEnd) { add(pt, 'tick'); pt += interval; interval *= 0.82; }
  add(T.poleHardClick, 'pa');
  add(T.verify9, 'buzz');
  add(T.verify9, 'slam');

  add(T.grid4In, 'whip', { dur: 0.35 });
  for (let t = T.g4Start; t <= T.g4End + 1e-6; t += 0.25) {
    add(t, 'click');
    if (Math.round((t - T.g4Start) / 0.25) % 3 === 2) add(t + 0.04, 'snap');
  }

  add(T.grid6In, 'spring');
  [10.4, 10.9, 11.4].forEach(t => add(t, 'click'));
  add(T.grid16In, 'burst');
  add(T.grid16In, 'slam');
  for (let t = T.g16Start; t < T.g16End; t += 0.06) add(t, 'type');
  add(T.g16End, 'slam');

  add(T.mergeClick, 'whoosh', { dur: 0.4 });
  add(T.mergeClick, 'click');
  add(T.verify16, 'click');
  add(T.failStamp, 'buzz');
  add(T.failStamp, 'slam');
  add(T.failStamp, 'low');
  // 15.0 之后完全静音到 freezeEnd

  add(T.shakeStart, 'spring');
  add(T.humanBanner, 'slam');
  add(T.humanBanner, 'burst');
  add(T.shakyHand, 'slam');
  add(T.shakyHand, 'hum', { dur: 0.7 });
  add(T.hesitate, 'tick');
  add(T.hesitate + 0.4, 'tick');
  add(T.misclick, 'dong');
  add(T.misclick + 0.35, 'pop');
  add(T.verifyHuman, 'click');

  for (let i = 0; i < T.drillCount; i++) {
    const t = T.drillStart + i * T.drillStep;
    add(t, 'whoosh', { dur: 0.3 });
    add(t, 'slam');
  }

  [22.0, 22.25, 22.5, 22.75].forEach((t, i) => { add(t, 'tick'); add(t + 0.08, 'pop'); });
  add(T.meterHold, 'riser', { dur: 0.5 });   // 结束点在 23.5
  add(T.passMoment, 'slam');
  add(T.passMoment, 'cymbal');
  add(T.passMoment, 'low');

  for (let i = 0; i < T.jumpCount; i++) {
    const t = T.jumpStart + i * T.jumpStep;
    add(t, i % 2 ? 'slam' : 'pa');
  }
  add(T.endText, 'pa', { pitch: 0.7 });
  add(T.crossOut, 'tear');
  add(T.crossOut, 'slam');
  add(T.signOff, 'ding');
  add(T.peekClick, 'click');

  const SFX_CUES = C.sort((a, b) => a.t - b.t);

  global.T = T;
  global.SFX_CUES = SFX_CUES;
  if (typeof module !== 'undefined' && module.exports) module.exports = { T, SFX_CUES };
})(typeof window !== 'undefined' ? window : globalThis);
