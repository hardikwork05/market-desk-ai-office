import { BOTS, FEED, LIVE, TOUR, NAME } from './data.js';
import { createGL, camera, mul, trs } from './gl.js';
import { buildOffice } from './scene.js';

const $ = (s) => document.querySelector(s);
const app = $('#app'), stage = $('#stage'), canvas = $('#scene'), panel = $('#panel');
const labels = $('#labels'), tourBtn = $('#tourBtn');
const byId = {};
BOTS.forEach((k) => { byId[k.id] = k; });
const staff = BOTS.filter((k) => k.live && k.id !== 'chief');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = () => window.innerWidth > 860;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const state = { sel: null, tour: null, ok: {}, feed: FEED.map((f) => ({ bot: f[0], min: f[1], what: f[2], more: f[3] })), next: 0 };
const pending = () => staff.filter((k) => !state.ok[k.id]);

document.title = NAME + ' AI Office';
$('#brandName').textContent = NAME;
$('#loadName').textContent = NAME;
document.querySelectorAll('.mark').forEach((el) => { el.textContent = NAME.charAt(0).toUpperCase(); });
$('#date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

/* ---------------------------------------------------------------- panel */

const ago = (m) => (m < 1 ? 'just now' : m < 60 ? m + 'm ago' : Math.floor(m / 60) + 'h ago');
const list = (items) => `<ul class='dots'>${items.map((s) => `<li>${s}</li>`).join('')}</ul>`;

function feedHtml(id) {
  const rows = state.feed.filter((f) => id === 'chief' || f.bot === id).slice(0, 8);
  return rows.map((f) => `<li><p><b>${id === 'chief' ? byId[f.bot].name + ': ' : ''}${f.what}</b><i>${ago(f.min)}</i></p><span>${f.more}</span></li>`).join('');
}

function blockHtml(k) {
  let h = '';
  if (k.rows) {
    h += `<h2>${k.rows.title}</h2><dl class='rows'>${k.rows.list.map((r) => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>`;
  }
  if (k.ideas) {
    h += `<h2>Ideas from your group today</h2><ul class='ideas'>`;
    k.ideas.forEach((i) => {
      h += `<li class='${i.fit ? 'fit' : 'no'}'><p><b>${i.who}</b><i>${i.state}</i></p><span>${i.what}</span><em>${i.note}</em></li>`;
    });
    h += '</ul>';
  }
  if (k.bars) {
    h += `<h2>${k.bars.title}</h2><ul class='bars'>`;
    k.bars.list.forEach((b) => {
      const pct = Math.round(Math.abs(b[1]) / k.bars.max * 100);
      h += `<li><span>${b[0]}${k.bars.unit ? `<small>${b[2]}</small>` : ''}</span><div><i class='${b[1] < 0 ? 'neg' : ''}' style='width:${pct}%'></i></div><b>${k.bars.unit ? b[1] + k.bars.unit : b[2]}</b></li>`;
    });
    h += '</ul>';
  }
  if (k.meters) {
    h += `<h2>${k.meters.title}</h2><ul class='meters'>`;
    k.meters.list.forEach((b) => {
      h += `<li><p><span>${b[0]}</span><b>${b[1]}%</b></p><div><i style='width:${b[1]}%'></i></div><small>${b[2]}</small></li>`;
    });
    h += '</ul>';
  }
  return h;
}

function renderPanel() {
  const k = byId[state.sel || (wide() ? '' : 'chief')];
  panel.classList.toggle('open', !!k);
  if (!k) return;
  let h = `<header class='who'><span class='face${k.live ? '' : ' off'}'>${k.live ? k.name.charAt(0) : ''}</span>`;
  h += `<div><h1>${k.name}</h1><p>${k.role}${k.live ? `<i class='on'>Working</i>` : `<i class='soon'>Coming soon</i>`}</p></div>`;
  h += `<nav><button type='button' data-act='prev' aria-label='Previous cabin'>&lsaquo;</button><button type='button' data-act='next' aria-label='Next cabin'>&rsaquo;</button><button type='button' data-act='close' aria-label='Back to the whole office'>&times;</button></nav></header>`;
  h += `<div class='body'><p class='line'>${k.line}</p>`;

  if (!k.live) {
    h += `<h2>What this desk will do</h2>${list(k.plan)}`;
    h += `<p class='note'>This cabin is kept for the next phase. Once it opens it joins the same team, so Kavya reports on it in the daily briefing.</p>`;
  } else {
    h += `<p class='chips'>${k.links.map((s) => `<span>${s}</span>`).join('')}</p>`;
    h += `<section class='help'><h2>How ${k.name} helps you</h2><div><p><b>Without ${k.name}</b>${k.before}</p><p><b>With ${k.name}</b>${k.after}</p></div></section>`;
    h += `<h2>What ${k.name} does every day</h2>${list(k.does)}`;
    if (k.briefing) h += `<section class='brief'><h2>Daily briefing</h2><p>${k.briefing}</p><small>Written by ${k.name} at 8:30 this morning</small></section>`;
    h += `<h2>${k.id === 'chief' ? 'At a glance' : 'Today'}</h2><div class='kpis'>${k.kpis.map((p) => `<p><span>${p[1]}</span><b>${p[0]}</b><i>${p[2]}</i></p>`).join('')}</div>`;

    if (k.id === 'chief') {
      h += `<h2>Waiting for your OK</h2><ul class='todo'>`;
      staff.forEach((d) => {
        h += `<li><button type='button' data-go='${d.id}'><b>${d.name}, ${d.desk.toLowerCase()}</b><span>${d.decide.short}</span>${state.ok[d.id] ? '<i>Approved</i>' : ''}</button></li>`;
      });
      h += `</ul><h2>Your team</h2><ul class='team'>`;
      staff.forEach((d) => {
        h += `<li><button type='button' data-go='${d.id}'><span class='face small'>${d.name.charAt(0)}</span><p><b>${d.name}, ${d.role.toLowerCase()}</b><span>${d.status}</span></p></button></li>`;
      });
      h += '</ul>';
    } else {
      h += blockHtml(k);
      h += `<h2>How it works</h2><ol class='steps'>${k.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
      h += `<section class='decide' id='decide'><h2>Waiting for your OK</h2>`;
      h += state.ok[k.id]
        ? `<p>${k.decide.done}</p><span class='stamp'>Approved at ${state.ok[k.id]}</span>`
        : `<p>${k.decide.ask}</p><button class='btn' type='button' data-act='approve'>Approve</button>`;
      h += '</section>';
      h += `<h2>What ${k.name} sends on WhatsApp</h2><div class='wa'><small>${k.wa.to}</small><p>${k.wa.text}</p></div>`;
    }
    h += `<h2>${k.id === 'chief' ? 'Everything happening now' : 'Live activity'}</h2><ul class='feed' id='feed'>${feedHtml(k.id)}</ul>`;
  }
  h += `<p class='foot'>Demo by Autiva. Every name and number here is sample data. The office does not give buy or sell calls and does not place orders.</p></div>`;
  panel.innerHTML = h;
}

function renderChrome() {
  const n = pending().length;
  $('#okPill').innerHTML = `<b>${n}</b> waiting for your OK`;
  $('#roster').innerHTML = BOTS.map((k) =>
    `<button type='button' class='chip${k.live ? '' : ' soon'}${state.sel === k.id ? ' cur' : ''}' data-go='${k.id}'>${k.name}</button>`).join('');
  document.querySelectorAll('#plan [data-go]').forEach((el) => el.classList.toggle('cur', el.dataset.go === state.sel));
  labels.querySelectorAll('.tag').forEach((el) => el.classList.toggle('cur', el.dataset.go === state.sel));
}

// Floor plan in the corner: the same cabins, seen from above.
function renderPlan() {
  const X = (x) => (x + 15) / 30 * 232, Z = (z) => (z + 10) / 20 * 152;
  let s = `<div class='plan-top'><span>Floor plan</span><button type='button' data-act='close'>Whole office</button></div>`;
  s += `<svg width='232' height='152' viewBox='0 0 232 152' role='group' aria-label='Floor plan'>`;
  s += `<rect width='232' height='152' rx='6' class='room'/>`;
  BOTS.forEach((k) => {
    const w = k.size[0] / 30 * 232, d = k.size[1] / 20 * 152;
    s += `<g data-go='${k.id}' role='button' tabindex='0' aria-label='${k.name}' class='${k.live ? 'live' : 'soon'}'>`;
    s += `<rect x='${(X(k.pos[0]) - w / 2).toFixed(1)}' y='${(Z(k.pos[1]) - d / 2).toFixed(1)}' width='${w.toFixed(1)}' height='${d.toFixed(1)}' rx='4'/>`;
    s += `<text x='${X(k.pos[0]).toFixed(1)}' y='${(Z(k.pos[1]) + 3.5).toFixed(1)}' text-anchor='middle'>${k.name.split(' ')[0]}</text></g>`;
  });
  s += `<circle cx='${X(0)}' cy='${Z(7.05)}' r='4' class='you'/><text x='${X(0) + 8}' y='${Z(7.05) + 3.5}' class='youT'>You</text>`;
  s += `</svg><p class='legend'><span class='l1'>Working</span><span class='l2'>Coming soon</span></p>`;
  $('#plan').innerHTML = s;
}

function approve(id) {
  state.ok[id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const top = panel.scrollTop;
  renderPanel();
  renderChrome();
  panel.scrollTop = top;
}

function step(dir) {
  const i = BOTS.findIndex((k) => k.id === state.sel);
  select(BOTS[(i + dir + BOTS.length) % BOTS.length].id);
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-act]');
  if (!t) return;
  if (t.dataset.go) return select(t.dataset.go);
  const act = t.dataset.act;
  if (act === 'approve') approve(state.sel);
  if (act === 'prev') step(-1);
  if (act === 'next') step(1);
  if (act === 'close') select(null);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') select(null);
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.go) select(e.target.dataset.go);
});
$('#okPill').addEventListener('click', () => select('chief'));
tourBtn.addEventListener('click', () => (state.tour ? stopTour() : startTour()));

// New activity keeps arriving while the page is open.
setInterval(() => {
  state.feed.forEach((f) => { f.min += 1; });
  const n = LIVE[state.next % LIVE.length];
  state.next += 1;
  state.feed.unshift({ bot: n[0], min: 0, what: n[1], more: n[2] });
  state.feed.length = Math.min(state.feed.length, 24);
  const el = $('#feed'), k = byId[state.sel || (wide() ? '' : 'chief')];
  if (el && k) el.innerHTML = feedHtml(k.id);
}, 9000);

/* --------------------------------------------------------------- camera */

const rig = { tx: 0, ty: 0.4, tz: 0.4, th: 1.25, ph: 0.7, r: 52, shift: 0 };
let goal = Object.assign({}, rig);
let aspect = 1.6;

function viewOf(id) {
  const side = wide() && id ? Math.min(0.42, 470 / stage.clientWidth) : 0;
  if (!id) return aspect < 1
    ? { tx: 0, ty: 0.4, tz: 0, th: 1.2, ph: 0.8, r: Math.max(38, 34 / aspect), shift: 0 }
    : { tx: 0, ty: 0.4, tz: 1.1, th: 0.62, ph: 0.9, r: Math.max(36, 58 / aspect), shift: 0 };
  const k = byId[id];
  return { tx: k.pos[0], ty: 1.1, tz: k.pos[1] + 0.4, th: 0.5, ph: 1.02, r: Math.max(k.size[0] * 2 + 3.4, 10.5 / (aspect * (1 - side))), shift: -side };
}

function select(id, fromTour) {
  if (!fromTour) stopTour();
  state.sel = id;
  renderPanel();
  renderChrome();
  panel.scrollTop = 0;
  goal = viewOf(id);
  app.classList.toggle('focus', !!id);
  $('#hint').hidden = true;
}

/* ----------------------------------------------------------------- tour */

function startTour() {
  state.tour = { i: -1, t: 0 };
  app.classList.add('touring');
  $('#caption').hidden = false;
  tourBtn.textContent = 'Stop the tour';
  nextStep();
}

function stopTour() {
  if (!state.tour) return;
  state.tour = null;
  app.classList.remove('touring');
  $('#caption').hidden = true;
  tourBtn.textContent = 'Play the tour';
}

function nextStep() {
  const s = state.tour;
  s.i += 1; s.t = 0; s.approved = false;
  if (s.i >= TOUR.length) { stopTour(); select(null); return; }
  const st = TOUR[s.i];
  $('#capText').textContent = st.text;
  if (s.i === 0 || st.go !== state.sel) select(st.go, true);
}

function tickTour(dt) {
  const s = state.tour, st = TOUR[s.i];
  s.t += dt;
  $('#capFill').style.transform = 'scaleX(' + Math.min(1, s.t / st.dur) + ')';
  goal.th += dt * 0.015;
  const box = $('#decide');
  if (st.scroll && s.t >= st.scroll && box) {
    panel.scrollTop += (box.offsetTop - 80 - panel.scrollTop) * (reduce ? 1 : 1 - Math.exp(-dt * 5));
  }
  if (st.approve && !s.approved && s.t >= st.approve) {
    s.approved = true;
    if (!state.ok[st.go]) approve(st.go);
  }
  if (s.t >= st.dur) nextStep();
}

/* -------------------------------------------------------------- pictures */

const INK = '#0B1118', AMB = '#FFB020', CRM = '#EDE6D6', DIM = '#9AA6B2', UP = '#2FBF8A', DOWN = '#F0645A';

function candles(x, w, h, n, seed) {
  let y = h * 0.72;
  const rnd = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  const gap = (w - 60) / n;
  for (let i = 0; i < n; i++) {
    const open = y, close = clamp(open + (rnd() - 0.57) * h * 0.13, h * 0.14, h * 0.86);
    const top = Math.min(open, close) - rnd() * h * 0.04, low = Math.max(open, close) + rnd() * h * 0.04;
    x.fillStyle = close < open ? UP : DOWN;
    x.fillRect(30 + i * gap + gap * 0.32, top, Math.max(2, gap * 0.1), low - top);
    x.fillRect(30 + i * gap, Math.min(open, close), gap * 0.7, Math.max(3, Math.abs(close - open)));
    y = close;
  }
}

// What gets drawn on each screen, plate, window and board in the room.
const PAINT = {
  plate: [512, 128, (x, p) => {
    x.fillStyle = INK; x.fillRect(0, 0, 512, 128);
    x.fillStyle = p.bot.live ? AMB : DIM;
    x.font = '600 50px Lora, serif'; x.fillText(p.bot.name, 24, 62);
    x.fillStyle = p.bot.live ? CRM : DIM;
    x.font = '500 26px Inter, sans-serif'; x.fillText(p.bot.live ? p.bot.role : 'Coming soon', 26, 104);
  }],
  screen: [512, 256, (x, p) => {
    x.fillStyle = '#0E1722'; x.fillRect(0, 0, 512, 256);
    x.fillStyle = AMB; x.fillRect(0, 0, 512, 8);
    x.fillStyle = CRM; x.font = '700 104px Inter, sans-serif'; x.fillText(p.bot.tv[0], 22, 132);
    x.fillStyle = DIM; x.font = '500 30px Inter, sans-serif'; x.fillText(p.bot.tv[1], 26, 180);
    x.fillStyle = UP;
    [38, 52, 44, 66, 58, 80, 72, 96].forEach((v, i) => x.fillRect(290 + i * 26, 232 - v, 16, v));
  }],
  board: [1024, 512, (x) => {
    x.fillStyle = '#0E1722'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = AMB; x.font = '600 44px Lora, serif'; x.fillText('Today at a glance', 40, 70);
    [['14', 'trades this week'], ['5', 'group ideas'], ['40%', 'loss limit used'], ['4', 'need your OK']].forEach((k, i) => {
      const px = 40 + i * 240;
      x.fillStyle = '#16212F'; x.fillRect(px, 104, 222, 150);
      x.fillStyle = CRM; x.font = '700 64px Inter, sans-serif'; x.fillText(k[0], px + 18, 186);
      x.fillStyle = DIM; x.font = '500 22px Inter, sans-serif'; x.fillText(k[1], px + 18, 228);
    });
    x.translate(0, 276);
    candles(x, 1024, 220, 40, 23);
    x.setTransform(1, 0, 0, 1, 0, 0);
  }],
  market: [1024, 512, (x) => {
    x.fillStyle = '#0A121B'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = 'rgba(255, 255, 255, 0.07)';
    for (let i = 1; i < 5; i++) x.fillRect(0, i * 102, 1024, 2);
    candles(x, 1024, 512, 44, 11);
    x.fillStyle = AMB;
    for (let i = 0; i < 1024; i += 26) x.fillRect(i, 150, 15, 3);
    x.font = '500 28px Inter, sans-serif'; x.fillText('Your alert level', 24, 138);
    x.fillStyle = DIM; x.font = '600 30px Inter, sans-serif'; x.fillText('Sample chart', 24, 486);
  }],
  rules: [1024, 512, (x) => {
    x.fillStyle = '#0E1722'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = AMB; x.font = '600 66px Lora, serif'; x.fillText('My rules', 56, 104);
    x.fillRect(56, 126, 150, 6);
    x.fillStyle = CRM; x.font = '500 40px Inter, sans-serif';
    ['1. Risk 1 percent per trade', '2. Stop at the daily loss limit', '3. Half size on expiry day', '4. No new trades after 2 pm', '5. No trades before results']
      .forEach((line, i) => x.fillText(line, 56, 206 + i * 66));
  }],
  group: [1024, 512, (x) => {
    x.fillStyle = '#0E1722'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = AMB; x.font = '600 60px Lora, serif'; x.fillText('Group ideas today', 48, 92);
    byId.ideas.ideas.forEach((idea, i) => {
      const y = 170 + i * 68;
      x.fillStyle = idea.fit ? UP : DOWN; x.fillRect(48, y - 30, 12, 40);
      x.fillStyle = CRM; x.font = '600 38px Inter, sans-serif'; x.fillText(idea.who, 82, y);
      x.fillStyle = DIM; x.font = '500 32px Inter, sans-serif'; x.fillText(idea.fit ? 'fits your rules' : 'breaks a rule', 300, y);
      x.fillStyle = CRM; x.fillText(idea.state, 640, y);
    });
  }],
  sign: [1024, 128, (x) => {
    x.fillStyle = '#16212F'; x.fillRect(0, 0, 1024, 128);
    x.fillStyle = AMB; x.fillRect(0, 0, 1024, 4); x.fillRect(0, 124, 1024, 4);
    x.font = '600 66px Lora, serif'; x.textAlign = 'center';
    x.fillText(NAME.toUpperCase().split('').join(' '), 512, 86);
    x.textAlign = 'left';
  }],
  window: [256, 256, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#22345A'); g.addColorStop(0.55, '#C8744F'); g.addColorStop(1, '#F6B25E');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#FFE2A6'; x.beginPath(); x.arc(170, 168, 26, 0, 6.3); x.fill();
    x.fillStyle = '#101822';
    [[0, 150, 44], [40, 110, 38], [82, 170, 30], [116, 130, 46], [166, 186, 36], [204, 142, 52]].forEach((b) => x.fillRect(b[0], b[1], b[2], 256 - b[1]));
    x.fillRect(84, 0, 6, 256); x.fillRect(170, 0, 6, 256); x.fillRect(0, 122, 256, 6);
  }]
};

function start3D() {
  const G = createGL(canvas);
  if (!G) return false;
  const office = buildOffice(BOTS);
  const world = {
    ground: G.mesh(office.ground), solid: G.mesh(office.solid), glass: G.mesh(office.glass),
    movers: office.people.map((p) => ({ id: p.id, base: p.base, mesh: G.mesh(p.geo), m: p.base })),
    pictures: []
  };

  const signs = office.pics.map((p) => {
    const spec = PAINT[p.kind], c = document.createElement('canvas');
    c.width = spec[0]; c.height = spec[1];
    const redraw = () => spec[2](c.getContext('2d'), p);
    redraw();
    const pic = G.picture(p.corners, c);
    return { redraw: redraw, pic: pic };
  });
  world.pictures = signs.map((s) => s.pic);
  if (document.fonts && document.fonts.load) {
    Promise.all(['600 50px Lora', '700 60px Inter', '600 30px Inter', '500 30px Inter'].map((f) => document.fonts.load(f)))
      .then(() => { signs.forEach((s) => { s.redraw(); s.pic.update(); }); tags.forEach((tag) => { tag.w = 0; }); });
  }

  // Name tags that float over each cabin while the whole office is in view.
  const tags = BOTS.map((k) => ({ id: k.id, text: `<b>${k.name}</b><span>${k.live ? k.desk : 'Coming soon'}</span>`, soon: !k.live }))
    .concat([{ id: 'you', text: '<b>You</b><span>Every desk reports here</span>', plain: true }, { id: 'group', text: '<b>Your trading group</b><span>Ideas go to Meera</span>', go: 'ideas' }])
    .map((t) => {
      const el = document.createElement(t.plain ? 'div' : 'button');
      if (!t.plain) { el.type = 'button'; el.dataset.go = t.go || t.id; }
      el.className = 'tag' + (t.soon ? ' soon' : '') + (t.plain ? ' you' : '');
      el.innerHTML = t.text;
      labels.appendChild(el);
      return { el: el, at: office.anchors[t.id], w: 0 };
    });

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    aspect = w / h;
    tags.forEach((tag) => { tag.w = 0; });
    const th = goal.th;
    goal = viewOf(state.sel);
    if (state.sel || state.tour) goal.th = th;
    renderPanel();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  if (reduce) Object.assign(rig, goal);

  let cam = camera(rig, aspect);

  // Drag to look around, tap to pick a cabin.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 6) {
      stopTour();
      goal.th -= dx * 0.006;
      goal.ph = clamp(goal.ph - dy * 0.004, 0.4, 1.4);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drag && drag.moved <= 6) pick(e);
    drag = null;
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    goal.r = clamp(goal.r * (1 + e.deltaY * 0.001), 6, 70);
  }, { passive: false });

  function pick(e) {
    const b = canvas.getBoundingClientRect();
    const d = cam.ray((e.clientX - b.left) / b.width * 2 - 1 - rig.shift, 1 - (e.clientY - b.top) / b.height * 2);
    let best = null, bestT = Infinity;
    office.hits.forEach((hit) => {
      const o = [cam.eye[0] - hit.pos[0], cam.eye[1], cam.eye[2] - hit.pos[1]];
      let t0 = 0, t1 = Infinity;
      for (let i = 0; i < 3; i++) {
        const a = (hit.min[i] - o[i]) / d[i], z = (hit.max[i] - o[i]) / d[i];
        t0 = Math.max(t0, Math.min(a, z));
        t1 = Math.min(t1, Math.max(a, z));
      }
      if (t0 <= t1 && t0 < bestT) { bestT = t0; best = hit.id; }
    });
    if (best) select(best);
  }

  let last = 0, frames = 0;
  function frame(ms) {
    requestAnimationFrame(frame);
    const t = ms / 1000, dt = Math.min(0.1, last ? t - last : 0);
    last = t;
    if (state.tour) tickTour(dt);

    const ease = reduce ? 1 : 1 - Math.exp(-dt * 2.4);
    Object.keys(goal).forEach((key) => {
      rig[key] += (goal[key] - rig[key]) * ease;
      if (!isFinite(rig[key])) rig[key] = goal[key];
    });
    cam = camera(rig, aspect);
    // Slide the whole picture left when the side panel is open, so the cabin stays in view.
    const vp = new Float32Array(cam.vp);
    for (let c = 0; c < 4; c++) vp[c * 4] += rig.shift * vp[c * 4 + 3];

    world.movers.forEach((o, i) => {
      const active = o.id === state.sel;
      const bob = reduce ? 0 : Math.sin(t * (active ? 3.2 : 1.5) + i * 1.7) * (active ? 0.03 : 0.012);
      const turn = reduce ? 0 : Math.sin(t * 0.7 + i) * 0.12;
      o.m = mul(o.base, trs(0, bob, 0, turn));
    });
    G.render(world, vp);

    const w = stage.clientWidth, h = stage.clientHeight;
    tags.forEach((tag) => {
      let p = cam.project(tag.at);
      if (p) p = [p[0] + rig.shift / 2, p[1]];
      if (p && (p[0] < 0 || p[0] > 1 || p[1] < 0.1 || p[1] > 0.94)) p = null;
      tag.el.style.visibility = p ? 'visible' : 'hidden';
      if (!p) return;
      tag.w = tag.w || tag.el.offsetWidth;
      const x = clamp(p[0] * w, tag.w / 2 + 6, w - tag.w / 2 - 6);
      tag.el.style.transform = 'translate(-50%,-100%) translate(' + x.toFixed(1) + 'px,' + (p[1] * h).toFixed(1) + 'px)';
    });

    frames += 1;
    if (frames === 3) setTimeout(() => $('#loader').classList.add('done'), 700);
  }
  requestAnimationFrame(frame);
  return true;
}

/* ----------------------------------------------------------------- boot */

renderPlan();
renderPanel();
renderChrome();
if (!start3D()) {
  app.classList.add('flat');
  tourBtn.hidden = true;
  $('#loader').classList.add('done');
}
if (/[?&]tour=1/.test(location.search) && !app.classList.contains('flat')) startTour();
