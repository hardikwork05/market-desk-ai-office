// Frame-by-frame recorder: steps the page clock, grabs each frame, ffmpeg joins them.
// usage: node rec.js <seconds> <introSeconds> [url]
const { chromium } = require('playwright');
const fs = require('fs');
const FPS = 30, OUT = __dirname + '/frames';
const total = +process.argv[2] || 60, intro = +process.argv[3] || 0;
const url = process.argv[4] || 'http://localhost:8767/';
const from = +process.argv[5] || 0, to = +process.argv[6] || 1e9;
(async () => {
  if (!process.argv[5]) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, timezoneId: 'Asia/Kolkata' });
  const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.clock.setFixedTime(new Date('2026-10-05T10:42:00+05:30'));
  await p.addInitScript(() => {
    let cbs = [], now = 0;
    window.requestAnimationFrame = (cb) => { cbs.push(cb); return cbs.length; };
    window.__tick = (dt) => { now += dt; const c = cbs; cbs = []; c.forEach((f) => f(now)); };
  });
  await p.goto(url);
  await p.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(p);
  const t0 = Date.now();
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    if (i === Math.round(intro * FPS)) await p.click('#tourBtn');
    await p.evaluate((dt) => window.__tick(dt), 1000 / FPS);
    if (i < from || i > to) continue;
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1.5 } });
    fs.writeFileSync(OUT + '/f' + String(i).padStart(5, '0') + '.jpg', Buffer.from(r.data, 'base64'));
    if (i % 150 === 0) console.log('frame', i, 'of', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  console.log('done', n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
