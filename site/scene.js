// Lays out the office floor: cabins, front desk, boards and floor markings.

import { Geo, rgb, trs, mul } from './gl.js';

const INK = rgb(0x12372A), VEST = rgb(0xF2B33D), WHITE = rgb(0xFFFFFF), WOOD = rgb(0xD8B88A);
const GLASS = rgb(0xBFD8EA, 0.32), GHOST = rgb(0xA8B8AC, 0.36), CARD = rgb(0xC9A26B);
const W = 5, D = 4.2, H = 2.7;

// A point in a desk's own space moved to the floor (desks only turn around the vertical axis).
const place = (m, p) => [m[0] * p[0] + m[8] * p[2] + m[12], p[1], m[2] * p[0] + m[10] * p[2] + m[14]];

// A standing figure with feet at the origin, facing +z.
function person(g, o) {
  const shirt = rgb(o.shirt), skin = rgb(o.skin), hair = rgb(o.hair);
  g.cyl(0, 0, 0, 0.2, 0.25, 0.86, rgb(0x232A3F), 12);
  g.cyl(0, 0.86, 0, 0.26, 0.32, 0.58, shirt, 14);
  g.ball(0, 1.44, 0, 0.32, shirt, 14, 0.5, 0.5);
  [-1, 1].forEach((s) => {
    g.cyl(s * 0.38, 0.92, 0, 0.075, 0.095, 0.56, shirt, 8);
    g.ball(s * 0.38, 0.9, 0, 0.085, skin, 8);
    g.ball(s * 0.09, 1.87, 0.226, 0.032, rgb(0x161821), 6);
  });
  g.cyl(0, 1.5, 0, 0.1, 0.1, 0.16, skin, 10);
  g.ball(0, 1.86, 0, 0.25, skin, 16);
  g.ball(0, 1.9, -0.05, 0.27, hair, 16, 0.5);
  if (o.bun) g.ball(0, 1.95, -0.28, 0.11, hair, 10);
  if (o.cap) {
    g.cyl(0, 2.03, 0, 0.275, 0.25, 0.1, rgb(o.cap), 14);
    g.box(0, 2.04, 0.28, 0.3, 0.03, 0.2, rgb(o.cap));
  }
  g.box(0, 1.33, 0.3, 0.025, 0.24, 0.02, VEST);
  g.box(0, 1.16, 0.315, 0.13, 0.17, 0.02, WHITE);
}

function plant(g, x, z) {
  g.cyl(x, 0, z, 0.22, 0.3, 0.5, rgb(0xB8704A), 12);
  g.ball(x, 1.05, z, 0.55, rgb(0x3E9364), 10);
  g.ball(x + 0.28, 0.82, z + 0.12, 0.34, rgb(0x2F7F54), 8);
}

export function buildOffice(desks) {
  const ground = new Geo(), solid = new Geo(), glass = new Geo();
  const out = { ground: ground, solid: solid, glass: glass, people: [], screens: [], hits: [], anchors: {}, brand: null, boards: [] };
  const use = (m) => { ground.M = solid.M = glass.M = m; };

  // Floor slab, plinth and the yellow walkway that links every cabin to the front desk.
  ground.box(0, -0.25, 0.2, 27.2, 0.5, 16.8, rgb(0xEEF2EA));
  ground.box(0, -0.62, 0.2, 27.9, 0.25, 17.5, rgb(0xB5C3B4));
  ground.rect(0, -0.2, 0.16, 4.2, 0.008, VEST);
  ground.rect(0, -2.3, 13.36, 0.16, 0.008, VEST);
  [-6.6, 0, 6.6].forEach((x) => ground.rect(x, -2.6, 0.16, 0.6, 0.008, VEST));
  for (let x = 0.6; x < 8.2; x += 0.8) {
    ground.rect(x, 1.4, 0.45, 0.14, 0.008, rgb(0xB3C0B2));
    ground.rect(-x, 1.4, 0.45, 0.14, 0.008, rgb(0xB3C0B2));
  }

  desks.forEach((k) => {
    const m = trs(k.pos[0], 0, k.pos[1], k.rot);
    use(m);

    if (k.id === 'front') {
      solid.box(0, 0.52, 0, 3.8, 1.04, 0.9, INK);
      solid.box(0, 1.08, 0, 4, 0.08, 1.06, WHITE);
      solid.box(0, 0.74, 0.46, 3.8, 0.1, 0.02, VEST);
      solid.box(0, 1.3, -1.95, 4.6, 2.6, 0.16, rgb(0xF7F8FA));
      solid.box(0, 0.1, -1.95, 4.64, 0.2, 0.2, INK);
      out.brand = [[-2.1, 0.42, -1.86], [2.1, 0.42, -1.86], [2.1, 2.52, -1.86], [-2.1, 2.52, -1.86]].map((p) => place(m, p));
      out.people.push({ id: k.id, desk: k, base: mul(m, trs(1.15, 0, -0.9, 0)) });
      out.hits.push({ id: k.id, pos: k.pos, rot: k.rot, min: [-2.3, 0, -2.1], max: [2.3, 2.6, 0.6] });
      out.anchors[k.id] = place(m, [0, 3.1, -1.95]);
      return;
    }

    const wall = k.live ? solid : glass, col = k.live ? INK : GHOST;
    ground.rect(0, 0, W, D, 0.006, k.live ? WHITE : rgb(0xE4E9E1));
    wall.box(0, H / 2, -D / 2, W, H, 0.14, col);
    wall.box(0, H + 0.06, -D / 2, W + 0.14, 0.12, 0.22, k.live ? VEST : GHOST);
    [-1, 1].forEach((i) => {
      wall.box(i * W / 2, 0.5, 0, 0.12, 1, D, col);
      if (k.live) glass.box(i * W / 2, 1.6, -0.25, 0.05, 1.2, D - 0.5, GLASS);
    });
    out.hits.push({ id: k.id, pos: k.pos, rot: k.rot, min: [-W / 2, 0, -D / 2], max: [W / 2, H, D / 2] });
    out.anchors[k.id] = place(m, [0, H + 0.45, -D / 2]);

    if (!k.live) {
      // Not set up yet: packing boxes and a covered desk.
      solid.box(-0.9, 0.3, -0.7, 0.9, 0.6, 0.7, CARD);
      solid.box(-0.8, 0.85, -0.7, 0.6, 0.5, 0.5, CARD);
      solid.box(0.2, 0.25, -0.2, 0.7, 0.5, 0.6, CARD);
      solid.box(1, 0.4, 0.7, 1.7, 0.8, 0.9, rgb(0xDDE2EA));
      return;
    }

    solid.box(0, 0.78, 0.5, 3.4, 0.08, 1.1, WOOD);
    solid.box(0, 0.42, 1, 3.2, 0.68, 0.06, INK);
    solid.box(0, 0.62, 1.035, 3.2, 0.08, 0.02, VEST);
    [-1, 1].forEach((i) => solid.box(i * 1.62, 0.39, 0.5, 0.08, 0.78, 1, INK));
    solid.box(-0.95, 0.835, 0.35, 0.52, 0.03, 0.36, rgb(0xC9CED8));
    solid.box(-0.95, 1, 0.55, 0.52, 0.32, 0.03, rgb(0x9AA3B5));
    solid.box(0.7, 0.83, 0.5, 0.3, 0.02, 0.42, WHITE);
    solid.box(1.1, 1.72, -D / 2 + 0.1, 2.24, 1.19, 0.06, rgb(0x14201B));
    const z = -D / 2 + 0.14;
    out.screens.push({ desk: k, corners: [[0.05, 1.195, z], [2.15, 1.195, z], [2.15, 2.245, z], [0.05, 2.245, z]].map((p) => place(m, p)) });
    out.people.push({ id: k.id, desk: k, base: mul(m, trs(-0.95, 0, -0.8, 0)) });
  });

  use(trs(0, 0, 0, 0));
  [[-12.4, 7.4], [12.4, 7.4], [-3.3, -6.4], [3.3, -6.4]].forEach((p) => plant(solid, p[0], p[1]));

  // Two boards near the entrance: a chart and the written rules, with the trader looking on.
  [[-8.6, 6.6, 0.5], [8.6, 6.6, -0.5]].forEach((b) => {
    const m = trs(b[0], 0, b[1], b[2]);
    use(m);
    solid.box(0, 1.55, 0, 4.4, 2.3, 0.12, rgb(0x14201B));
    [-1, 1].forEach((i) => solid.box(i * 1.6, 0.2, 0, 0.12, 0.4, 0.7, rgb(0x14201B)));
    out.boards.push([[-2.1, 0.5, 0.07], [2.1, 0.5, 0.07], [2.1, 2.6, 0.07], [-2.1, 2.6, 0.07]].map((p) => place(m, p)));
  });
  solid.at(-7.83, 0, 8, 0.5 + Math.PI);
  person(solid, { shirt: 0xF1EFE6, skin: 0xC08A63, hair: 0x8D8D8A });
  use(trs(0, 0, 0, 0));

  // Desk staff are separate so they can move a little.
  out.people.forEach((p) => { p.geo = new Geo(); person(p.geo, p.desk); });
  return out;
}
