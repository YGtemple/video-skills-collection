// render_frames.js —— 逐帧渲染 900 张 PNG；断点续渲，页面/浏览器崩溃均自动重建重试。
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const { T } = require('./timeline.js');
const TOTAL = T.duration * T.fps;
const WORKERS = Number(process.env.WORKERS || 2);
const DIR = __dirname;
const INDEX = 'file://' + path.join(DIR, 'index.html');
const FRAME_DIR = path.join(DIR, 'frames');

const frameName = i => `frame_${String(i).padStart(4, '0')}.png`;
const framePath = i => path.join(FRAME_DIR, frameName(i));

// Chromium 可执行文件路径：可用环境变量 CHROMIUM_PATH 覆盖（Windows/macOS/Linux 适配）
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/local/bin/chromium';

let browser = null, context = null;

async function launchBrowser() {
  try { if (browser) await browser.close(); } catch (_) {}
  browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--force-color-profile=srgb', '--hide-scrollbars', '--disable-gpu',
      '--js-flags=--max-old-space-size=1536', '--renderer-process-limit=4']
  });
  browser.on('disconnected', () => { browser = null; context = null; });
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
}

async function freshPage(needCues) {
  for (let tries = 0; tries < 3; tries++) {
    try {
      if (!browser || !context) await launchBrowser();
      const p = await context.newPage();
      await p.goto(INDEX, { timeout: 30000 });
      await p.evaluate(async () => {
        await Promise.all([
          document.fonts.load('100px ZCOOL'), document.fonts.load('100px ZhiMang'),
          document.fonts.load('100px MarkerF'), document.fonts.load('100px AntonF')
        ]);
        await document.fonts.ready;
      });
      if (needCues) {
        const cues = await p.evaluate(() => window.SFX_CUES);
        fs.writeFileSync(path.join(DIR, 'sfx_cues.json'), JSON.stringify(cues));
        console.log('SFX cues:', cues.length);
      }
      return p;
    } catch (e) {
      console.log('freshPage failed, relaunch browser:', String(e).split('\n')[0]);
      try { if (browser) await browser.close(); } catch (_) {}
      browser = null; context = null;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('could not create a page after retries');
}

(async () => {
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  let queue = [];
  for (let i = 0; i < TOTAL; i++) if (!fs.existsSync(framePath(i))) queue.push(i);
  console.log('workers', WORKERS, 'frames to render:', queue.length);
  let ptr = 0;

  async function shoot(p, i) {
    await p.evaluate(tt => window.render(tt), i / T.fps);
    await p.screenshot({ path: framePath(i), clip: { x: 0, y: 0, width: 1920, height: 1080 }, timeout: 30000 });
  }

  async function worker(wid) {
    let page = await freshPage(wid === 0 && !fs.existsSync(path.join(DIR, 'sfx_cues.json')));
    while (ptr < queue.length) {
      const i = queue[ptr++];
      let ok = false;
      for (let attempt = 0; attempt < 6 && !ok; attempt++) {
        try { await shoot(page, i); ok = true; }
        catch (e) {
          console.log(`w${wid} frame ${i} failed (a${attempt + 1}): ${String(e).split('\n')[0]}`);
          try { await page.close(); } catch (_) {}
          await new Promise(r => setTimeout(r, 700));
          page = await freshPage(false);
        }
      }
      if (!ok) { console.log('GIVE UP frame', i); process.exitCode = 3; }
      if (i % 50 === 0) console.log(`w${wid} frame ${i}`);
    }
    try { await page.close(); } catch (_) {}
  }

  await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)));
  try { await browser.close(); } catch (_) {}
  const have = fs.readdirSync(FRAME_DIR).filter(f => f.endsWith('.png')).length;
  console.log('DONE frames:', have);
  if (have !== TOTAL) process.exitCode = 3;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
