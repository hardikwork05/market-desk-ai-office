// Scripted walkthrough recorder with Hinglish captions.
// usage: node walk.js <fromFrame> <toFrame>     (omit both to print the script as subtitles)
const { chromium } = require('playwright');
const fs = require('fs');
const FPS = 24, OUT = __dirname + '/wframes', INTRO = 1.4;

// t = seconds on the video clock. go: cabin to open (null = whole office). scroll: [selector, offset].
const SCRIPT = [
  { t: 2.2, go: null, cap: 'Yeh hai aapka AI office. Har cabin mein ek AI staff member hai, jo aapki trading ka ek kaam sambhalta hai.' },
  { t: 9.2, go: 'chief', cap: 'Kavya chief of staff hai. Saare desks ki report jodkar subah-shaam ek hi page ki briefing banati hai.' },
  { t: 16.2, scroll: ['.brief', 90], cap: 'Aaj kya hua, kis desk ne kya dekha, aur kahan aapki OK chahiye, sab ek jagah mil jaata hai.' },
  { t: 23.2, go: 'brief', cap: 'Arjun raat bhar ka market, results calendar aur aapki watchlist ki news padhta hai.' },
  { t: 30.2, scroll: ['.rows', 124], cap: 'Subah 8:45 par ek minute ka brief aapke phone par aa jaata hai, aapke apne rules ke hisaab se.' },
  { t: 37.2, go: 'ideas', cap: 'Meera aapke trading group ke har idea ko note karti hai: kisne diya, kya tha aur kab aaya.' },
  { t: 44.7, scroll: ['.ideas', 124], cap: 'Har idea aapke rules se check hota hai. Hara matlab rules mein fit, laal matlab koi rule toot raha hai.' },
  { t: 52.2, scroll: ['.bars', 124], cap: 'Aur score bhi rakhti hai: pichhle 30 din mein kiske ideas sach mein chale, aur kiske nahi.' },
  { t: 59.7, go: 'journal', cap: 'Ira har trade broker se khud utha leti hai. Aapko journal mein kuch bhi type nahi karna.' },
  { t: 66.7, scroll: ['.bars', 124], cap: 'Phir dikhati hai ki paisa kis setup se bana aur kahan gaya, group ke ideas samet.' },
  { t: 73.7, go: 'risk', cap: 'Kabir din bhar aapki positions ko aapke hi banaye rules se milata rehta hai.' },
  { t: 80.7, scroll: ['.meters', 124], cap: 'Loss limit, position size, margin: rule tootne se pehle hi WhatsApp par warning aa jaati hai.' },
  { t: 87.7, scroll: ['#decide', 150], cap: 'Aapki OK ke bina kuch nahi badalta. Har trading decision aapka hi rehta hai.' },
  { t: 91, click: '[data-act=approve]' },
  { t: 94.7, go: null, cap: 'Aage chalkar Tax, Backtest aur Research desk bhi khul sakte hain.' },
  { t: 100.7, cap: 'Yeh office tips nahi deta aur order nahi lagata. Yeh aapko aur aapke group ko apne hi plan par disciplined rakhta hai.' },
  { t: 108.2, cap: null }
];
const TOTAL = 110;

const caps = SCRIPT.filter((e) => 'cap' in e);
caps.forEach((e, i) => { e.dur = (i + 1 < caps.length ? caps[i + 1].t : TOTAL) - e.t; });

if (!process.argv[2]) {
  const ts = (s) => { const ms = Math.round(s * 1000), p = (n, l) => String(n).padStart(l, '0'); return p(Math.floor(ms / 3600000), 2) + ':' + p(Math.floor(ms / 60000) % 60, 2) + ':' + p(Math.floor(ms / 1000) % 60, 2) + ',' + p(ms % 1000, 3); };
  let n = 0;
  console.log(caps.filter((e) => e.cap).map((e) => (++n) + '\n' + ts(e.t) + ' --> ' + ts(e.t + e.dur - 0.2) + '\n' + e.cap + '\n').join('\n'));
  process.exit(0);
}

const from = +process.argv[2], to = +process.argv[3];
const SAMPLE = process.env.SAMPLE ? process.env.SAMPLE.split(',').map(Number) : null;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, timezoneId: 'Asia/Kolkata' });
  const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.clock.setFixedTime(new Date('2026-10-05T10:42:00+05:30'));
  await p.addInitScript(() => {
    let cbs = [], now = 0;
    const ivs = [];
    Object.defineProperty(window, 'devicePixelRatio', { get: () => window.__dpr || 1, configurable: true });
    window.requestAnimationFrame = (cb) => { cbs.push(cb); return cbs.length; };
    window.setInterval = (cb, ms) => { ivs.push({ cb: cb, ms: ms, next: now + ms }); return ivs.length; };
    const q = (s) => document.querySelector(s);
    // App clock: one step of animation, panel scrolling and the caption progress bar.
    window.__tick = (dt) => {
      now += dt;
      ivs.forEach((iv) => { while (now >= iv.next) { iv.next += iv.ms; iv.cb(); } });
      const c = cbs; cbs = []; c.forEach((f) => f(now));
      const panel = q('#panel');
      if (window.__st != null) panel.scrollTop += (window.__st - panel.scrollTop) * (1 - Math.exp(-dt / 1000 * 3.5));
      if (window.__cd) q('#capFill').style.transform = 'scaleX(' + Math.min(1, (now - window.__c0) / (window.__cd * 1000)) + ')';
    };
    window.__loader = (o) => {
      const l = q('#loader');
      l.style.setProperty('transition', 'none', 'important');
      l.style.setProperty('opacity', String(o), 'important');
      l.style.setProperty('visibility', o > 0 ? 'visible' : 'hidden', 'important');
    };
    window.__ev = (e) => {
      const panel = q('#panel');
      if ('go' in e) {
        if (e.go) q('#plan g[data-go=' + e.go + ']').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        else q('#plan [data-act=close]').click();
        window.__st = 0;
      }
      if (e.scroll) { const el = panel.querySelector(e.scroll[0]); window.__st = el ? Math.max(0, el.offsetTop - e.scroll[1]) : 0; }
      if (e.click) { const el = panel.querySelector(e.click); if (el) el.click(); }
      if ('cap' in e) {
        q('#app').classList.add('touring');
        q('#caption').hidden = !e.cap;
        if (e.cap) { q('#capText').textContent = e.cap; window.__c0 = now; window.__cd = e.dur; }
      }
    };
  });
  if (from > 0 && !SAMPLE) await p.addInitScript(() => { window.__dpr = 0.2; });
  await p.addInitScript(() => { addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.caption{font-size:20px;width:min(760px,calc(100% - 32px))}.focus .caption{width:660px}.panel,.plan{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'; document.head.appendChild(st); }); });
  await p.goto('http://localhost:8767/');
  await p.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(p);
  const t0 = Date.now(), n = Math.round(TOTAL * FPS), introN = Math.round(INTRO * FPS);
  await p.evaluate(() => window.__loader(1));
  let next = 0;
  for (let i = 0; i < n && i <= to; i++) {
    const t = i / FPS;
    while (next < SCRIPT.length && SCRIPT[next].t <= t) { await p.evaluate((e) => window.__ev(e), SCRIPT[next]); next += 1; }
    if (i >= introN) {
      await p.evaluate((dt) => window.__tick(dt), 1000 / FPS);
      const fade = (t - INTRO) / 0.7;
      if (fade <= 1.05) await p.evaluate((o) => window.__loader(o), Math.max(0, 1 - fade));
    }
    if (SAMPLE ? !SAMPLE.includes(i) : i < from) continue;
    if (i === from && from > 0 && !SAMPLE) {
      // Back to full resolution: nudge the window size so the page resizes its canvas.
      const snap = () => cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 20 });
      await p.evaluate(() => { window.__dpr = 0; document.querySelector('#stage').style.bottom = '2px'; });
      await snap(); await p.waitForTimeout(120);
      await p.evaluate(() => { document.querySelector('#stage').style.bottom = ''; });
      await snap(); await p.waitForTimeout(120);
      await p.evaluate(() => window.__tick(0));
      await snap();
      console.log('canvas', await p.evaluate(() => document.querySelector('#scene').width));
    }
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } });
    fs.writeFileSync(OUT + '/f' + String(i).padStart(5, '0') + '.jpg', Buffer.from(r.data, 'base64'));
    if (i % 200 === 0) console.log('frame', i, 'of', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  console.log('done', from, to, 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
