import { DESKS, TOUR, NAME } from './data.js';
import { createGL, camera, mul, trs } from './gl.js';
import { buildOffice } from './scene.js';

const $ = (s) => document.querySelector(s);
const app = $('#app'), stage = $('#stage'), canvas = $('#scene'), panel = $('#panel');
const labels = $('#labels'), roster = $('#roster'), tourBtn = $('#tourBtn'), back = $('#back');
const byId = {};
DESKS.forEach((k) => { byId[k.id] = k; });

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canSpeak = 'speechSynthesis' in window;
const state = { sel: null, tour: null, ok: {} };
const hex = (n) => '#' + ('00000' + n.toString(16)).slice(-6);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pending = () => DESKS.filter((k) => k.decide && !state.ok[k.id]);

document.title = NAME + ' AI Office';
$('#brandName').textContent = NAME;

/* ---------------------------------------------------------------- panel */

function renderPanel() {
  const k = byId[state.sel || 'front'];
  let h = '<header class="badge">';
  h += k.live
    ? '<div class="photo" style="--shirt:' + hex(k.shirt) + ';--skin:' + hex(k.skin) + ';--hair:' + hex(k.hair) + '"></div>'
    : '<div class="photo empty"></div>';
  h += '<div class="who"><h1>' + (k.person || k.name) + '</h1>';
  h += k.live
    ? '<p>' + k.role + ', ' + k.name.toLowerCase() + '</p></div><span class="stamp">On duty</span></header>'
    : '<span class="stamp soon big">Coming soon</span></div></header>';

  if (!k.live) {
    h += '<p class="lead">' + k.what + '</p><h2>What this desk will do</h2>';
    h += '<ul class="lines">' + k.does.map((s) => '<li>' + s + '</li>').join('') + '</ul>';
  } else {
    const figs = k.id === 'front' ? k.figures.concat([[String(pending().length), 'waiting for your OK']]) : k.figures;
    h += '<div class="figs">' + figs.map((f) => '<p><b>' + f[0] + '</b><span>' + f[1] + '</span></p>').join('') + '</div>';
    h += `<div class="row"><h2>Today's report</h2>`;
    h += (canSpeak ? '<button class="link" type="button" data-act="speak">Read it out</button>' : '') + '</div>';
    h += '<ul class="lines">' + k.report.map((s) => '<li>' + s + '</li>').join('') + '</ul>';

    if (k.id === 'front') {
      h += '<h2>Waiting for your OK</h2><ul class="todo">';
      DESKS.filter((d) => d.decide).forEach((d) => {
        h += '<li><button type="button" data-go="' + d.id + '"><b>' + d.name + '</b><span>' + d.decide.short + '</span>';
        h += (state.ok[d.id] ? '<i>Approved</i>' : '') + '</button></li>';
      });
      h += '</ul><p class="lead small">Each cabin is one AI staff member looking after one part of your trading. They work from your own trades and rules, report here, and wait for your OK before anything changes.</p>';
    } else {
      h += '<section class="decide" id="decide"><h2>Waiting for your OK</h2>';
      h += state.ok[k.id]
        ? '<p>' + k.decide.done + '</p><span class="stamp big">Approved at ' + state.ok[k.id] + '</span>'
        : '<p>' + k.decide.ask + '</p><button class="btn" type="button" data-act="approve">Approve</button>';
      h += '</section>';
      h += '<h2>What it sends on WhatsApp</h2><div class="wa"><p class="to">' + k.wa.to + '</p><p class="bubble">' + k.wa.text + '</p></div>';
      h += '<h2>How this desk works</h2><ol class="steps">' + k.steps.map((s) => '<li>' + s + '</li>').join('') + '</ol>';
    }
  }
  h += '<p class="foot">Demo by Autiva. Every name and number here is sample data. The office does not give buy or sell calls and does not place orders.</p>';
  panel.innerHTML = h;
}

function renderRoster() {
  roster.innerHTML = DESKS.map((k) =>
    '<button type="button" class="chip' + (k.live ? '' : ' soon') + (state.sel === k.id ? ' cur' : '') + '" data-go="' + k.id + '">' +
    k.name + (k.decide && !state.ok[k.id] ? '<i title="Needs your OK"></i>' : '') + '</button>').join('');
}

function approve(id) {
  state.ok[id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const top = panel.scrollTop;
  renderPanel();
  renderRoster();
  panel.scrollTop = top;
}

function speak(k) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(k.report.join(' '));
  u.lang = 'en-IN';
  speechSynthesis.speak(u);
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-act]');
  if (!t) return;
  if (t.dataset.go) return select(t.dataset.go);
  if (t.dataset.act === 'approve') approve(state.sel);
  if (t.dataset.act === 'speak') speak(byId[state.sel || 'front']);
});
back.addEventListener('click', () => select(null));
tourBtn.addEventListener('click', () => (state.tour ? stopTour() : startTour()));

/* --------------------------------------------------------------- camera */

const rig = { tx: 0, ty: 0.6, tz: -0.4, th: -0.5, ph: 0.8, r: 46 };
let goal = Object.assign({}, rig);
let aspect = 1.4;

function viewOf(id) {
  if (!id) return { tx: 0, ty: 0.6, tz: 0.5, th: 0, ph: aspect < 1 ? 0.75 : 0.95, r: Math.max(26, 42 / aspect) };
  const k = byId[id];
  return { tx: k.pos[0], ty: 1.3, tz: k.pos[1], th: k.rot + k.yaw, ph: 1.2, r: Math.max(9.5, 8.2 / aspect) };
}

function select(id, fromTour) {
  if (!fromTour) stopTour();
  if (canSpeak) speechSynthesis.cancel();
  state.sel = id;
  renderPanel();
  renderRoster();
  panel.scrollTop = 0;
  goal = viewOf(id);
  back.hidden = !id;
  $('#hint').hidden = true;
  labels.querySelectorAll('.tag').forEach((el) => el.classList.toggle('cur', el.dataset.go === id));
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
  if (s.i === 0 || st.desk !== state.sel) select(st.desk, true);
}

function tickTour(dt) {
  const s = state.tour, st = TOUR[s.i];
  s.t += dt;
  $('#capFill').style.transform = 'scaleX(' + Math.min(1, s.t / st.dur) + ')';
  goal.th += dt * 0.02;
  const box = $('#decide');
  if (st.scroll && s.t >= st.scroll && box) {
    panel.scrollTop += (box.offsetTop - 90 - panel.scrollTop) * (reduce ? 1 : 1 - Math.exp(-dt * 5));
  }
  if (st.approve && !s.approved && s.t >= st.approve) {
    s.approved = true;
    if (!state.ok[st.desk]) approve(st.desk);
  }
  if (s.t >= st.dur) nextStep();
}

/* ---------------------------------------------------------------- scene */

function sign(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const redraw = () => paint(c.getContext('2d'));
  redraw();
  return { canvas: c, redraw: redraw };
}

function start3D() {
  const G = createGL(canvas);
  if (!G) return false;
  const office = buildOffice(DESKS);
  const world = {
    ground: G.mesh(office.ground), solid: G.mesh(office.solid), glass: G.mesh(office.glass),
    movers: office.people.map((p) => ({ id: p.id, base: p.base, mesh: G.mesh(p.geo), m: p.base })),
    pictures: []
  };

  // Wall screens, the brand wall and the two boards are drawn on a 2D canvas, then used as pictures.
  const signs = office.screens.map((s) => {
    const sg = sign(512, 256, (x) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 256);
      x.fillStyle = '#F2B33D'; x.fillRect(0, 0, 512, 56);
      x.fillStyle = '#12372A';
      x.font = '600 30px Poppins, sans-serif'; x.fillText(s.desk.tv[0], 24, 39);
      x.font = '700 104px Poppins, sans-serif'; x.fillText(s.desk.tv[1], 20, 168);
      x.fillStyle = '#5A6B62';
      x.font = '500 30px Poppins, sans-serif'; x.fillText(s.desk.tv[2], 24, 222);
    });
    sg.pic = G.picture(s.corners, sg.canvas);
    return sg;
  });
  const wall = sign(1024, 512, (x) => {
    x.fillStyle = '#F7F8FA'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = '#12372A';
    let size = 130;
    do { size -= 6; x.font = '700 ' + size + 'px Poppins, sans-serif'; } while (x.measureText(NAME).width > 640 && size > 40);
    x.fillText(NAME, 64, 236);
    x.fillStyle = '#F2B33D'; x.fillRect(68, 278, 286, 76);
    x.fillStyle = '#12372A';
    x.font = '600 54px Poppins, sans-serif'; x.fillText('AI Office', 88, 335);
  });
  wall.pic = G.picture(office.brand, wall.canvas);
  const chart = sign(1024, 512, (x) => {
    x.fillStyle = '#10221C'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 1; i < 5; i++) x.fillRect(0, i * 102, 1024, 2);
    let seed = 11, y = 380;
    const rnd = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 38; i++) {
      const open = y, close = clamp(open + (rnd() - 0.56) * 64, 70, 440);
      const top = Math.min(open, close) - rnd() * 22, low = Math.max(open, close) + rnd() * 22;
      x.fillStyle = close < open ? '#27B07A' : '#E0584F';
      x.fillRect(47 + i * 25, top, 3, low - top);
      x.fillRect(40 + i * 25, Math.min(open, close), 17, Math.max(4, Math.abs(close - open)));
      y = close;
    }
    x.fillStyle = '#F2B33D';
    for (let i = 0; i < 1024; i += 26) x.fillRect(i, 150, 15, 3);
    x.font = '500 28px Poppins, sans-serif'; x.fillText('Your alert level', 24, 138);
    x.fillStyle = '#CFE3D8';
    x.font = '600 34px Poppins, sans-serif'; x.fillText('Sample chart', 24, 484);
  });
  chart.pic = G.picture(office.boards[0], chart.canvas);
  const rules = sign(1024, 512, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = '#12372A';
    x.font = '700 64px Poppins, sans-serif'; x.fillText('My rules', 56, 104);
    x.fillStyle = '#F2B33D'; x.fillRect(56, 124, 150, 10);
    x.fillStyle = '#14241D';
    x.font = '500 40px Poppins, sans-serif';
    ['1. Risk 1 percent per trade', '2. Stop at the daily loss limit', '3. Half size on expiry day', '4. No fresh trades before results']
      .forEach((line, i) => x.fillText(line, 56, 216 + i * 76));
  });
  rules.pic = G.picture(office.boards[1], rules.canvas);
  signs.push(wall, chart, rules);
  world.pictures = signs.map((s) => s.pic);
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 100px Poppins'), document.fonts.load('600 30px Poppins'), document.fonts.load('500 30px Poppins')])
      .then(() => { signs.forEach((s) => { s.redraw(); s.pic.update(); }); tags.forEach((tag) => { tag.w = 0; }); });
  }

  // Name tags that follow each desk on screen.
  const tags = DESKS.map((k) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tag' + (k.live ? '' : ' soon');
    el.dataset.go = k.id;
    el.innerHTML = '<b>' + (k.person || k.name.split(' ')[0]) + '</b><span>' + (k.live ? k.name : 'Coming soon') + '</span>';
    labels.appendChild(el);
    return { el: el, at: office.anchors[k.id], w: 0 };
  });

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    aspect = w / h;
    tags.forEach((tag) => { tag.w = 0; });
    const th = goal.th;
    goal = viewOf(state.sel);
    if (state.sel || state.tour) goal.th = th;
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  if (reduce) Object.assign(rig, goal);

  let cam = camera(rig, aspect);

  // Drag to look around, tap to pick a desk.
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
      goal.ph = clamp(goal.ph - dy * 0.004, 0.45, 1.42);
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
    const d = cam.ray((e.clientX - b.left) / b.width * 2 - 1, 1 - (e.clientY - b.top) / b.height * 2);
    let best = null, bestT = Infinity;
    office.hits.forEach((hit) => {
      // Move the ray into the desk's own space, then test against its box.
      const c = Math.cos(hit.rot), s = Math.sin(hit.rot);
      const ox = cam.eye[0] - hit.pos[0], oz = cam.eye[2] - hit.pos[1];
      const o = [c * ox - s * oz, cam.eye[1], s * ox + c * oz];
      const v = [c * d[0] - s * d[2], d[1], s * d[0] + c * d[2]];
      let t0 = 0, t1 = Infinity;
      for (let i = 0; i < 3; i++) {
        const a = (hit.min[i] - o[i]) / v[i], z = (hit.max[i] - o[i]) / v[i];
        t0 = Math.max(t0, Math.min(a, z));
        t1 = Math.min(t1, Math.max(a, z));
      }
      if (t0 <= t1 && t0 < bestT) { bestT = t0; best = hit.id; }
    });
    if (best) select(best);
  }

  let last = 0;
  function frame(ms) {
    requestAnimationFrame(frame);
    const t = ms / 1000, dt = Math.min(0.1, last ? t - last : 0);
    last = t;
    if (state.tour) tickTour(dt);

    const ease = reduce ? 1 : 1 - Math.exp(-dt * 2.6);
    Object.keys(goal).forEach((key) => { rig[key] += (goal[key] - rig[key]) * ease; });
    cam = camera(rig, aspect);

    world.movers.forEach((o, i) => {
      const active = o.id === (state.sel || 'front');
      const bob = reduce ? 0 : Math.sin(t * (active ? 3.2 : 1.5) + i * 1.7) * (active ? 0.03 : 0.012);
      const turn = reduce ? 0 : Math.sin(t * 0.7 + i) * 0.12;
      o.m = mul(o.base, trs(0, bob, 0, turn));
    });
    G.render(world, cam.vp);

    const w = stage.clientWidth, h = stage.clientHeight;
    tags.forEach((tag) => {
      let p = cam.project(tag.at);
      if (p && (p[0] < 0 || p[0] > 1 || p[1] < 0.06 || p[1] * h > h - 64)) p = null;
      tag.el.style.visibility = p ? 'visible' : 'hidden';
      if (!p) return;
      tag.w = tag.w || tag.el.offsetWidth;
      const x = clamp(p[0] * w, tag.w / 2 + 6, w - tag.w / 2 - 6);
      tag.el.style.transform = 'translate(-50%,-100%) translate(' + x.toFixed(1) + 'px,' + (p[1] * h).toFixed(1) + 'px)';
    });
  }
  requestAnimationFrame(frame);
  return true;
}

/* ----------------------------------------------------------------- boot */

renderPanel();
renderRoster();
if (!start3D()) {
  app.classList.add('flat');
  tourBtn.hidden = true;
}
if (/[?&]tour=1/.test(location.search) && !app.classList.contains('flat')) startTour();
