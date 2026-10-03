// Lays out the office: room, glass cabins, lounge for the trading group, and the trader's own desk.

import { Geo, rgb, trs, mul } from './gl.js';

const BRASS = rgb(0xC9973A), AMBER = rgb(0xFFB020), FLOOR = rgb(0x212E3E), WALL = rgb(0x18232F);
const CREAM = rgb(0xE9E2D2), WOOD = rgb(0x3A2A20), DARK = rgb(0x0B1118);
const GLASS = rgb(0x9CC7E8, 0.13), SMOKE = rgb(0x06090D, 0.55);
const H = 2.6;

// A point in a cabin's own space moved to the floor, and a flat picture area facing the front.
const place = (m, p) => [m[0] * p[0] + m[8] * p[2] + m[12], p[1], m[2] * p[0] + m[10] * p[2] + m[14]];
const front = (m, x0, x1, y0, y1, z) => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]].map((p) => place(m, p));
// A picture area on the left wall, facing into the room.
const side = (z0, z1, y0, y1) => [[-14.9, y0, z1], [-14.9, y0, z0], [-14.9, y1, z0], [-14.9, y1, z1]];

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
  g.box(0, 1.33, 0.3, 0.025, 0.24, 0.02, AMBER);
  g.box(0, 1.16, 0.315, 0.13, 0.17, 0.02, CREAM);
}

function plant(g, x, z) {
  g.cyl(x, 0, z, 0.2, 0.27, 0.5, rgb(0xD9D2C2), 12);
  g.ball(x, 1, z, 0.48, rgb(0x2F8F63), 10);
  g.ball(x + 0.24, 0.8, z + 0.1, 0.3, rgb(0x256F4E), 8);
}

export function buildOffice(bots) {
  const ground = new Geo(), solid = new Geo(), glass = new Geo();
  const out = { ground: ground, solid: solid, glass: glass, people: [], pics: [], hits: [], anchors: {} };
  const use = (m) => { ground.M = solid.M = glass.M = m; };
  const HOME = trs(0, 0, 0, 0);
  const line = (x, z, w, d) => ground.rect(x, z, w, d, 0.008, AMBER);

  // Room: floor on a brass plinth, back wall and left wall.
  ground.box(0, -0.25, 0, 30.4, 0.5, 20.4, FLOOR);
  ground.box(0, -0.6, 0, 30.9, 0.2, 20.9, BRASS);
  solid.box(0, 2.1, -10.1, 30.4, 4.2, 0.2, WALL);
  solid.box(-15.1, 2.1, 0, 0.2, 4.2, 20.4, WALL);
  solid.box(0, 0.06, -9.96, 30.2, 0.12, 0.08, BRASS);
  solid.box(-14.96, 0.06, 0, 0.08, 0.12, 20.2, BRASS);

  // Amber lines on the floor: every cabin leads back to the trader's desk.
  line(-1.6, 3.3, 15.7, 0.1);
  [-9.4, -4.2, 1, 6.2].forEach((x) => line(x, 2.9, 0.1, 0.8));
  line(0, 4.5, 0.1, 2.4);
  line(-2.5, -3, 18.1, 0.1);
  [-11.5, -6.5, 0, 6.5].forEach((x) => line(x, -3.6, 0.1, 1.2));
  line(-1.6, 0.15, 0.1, 6.3);

  // Windows on the left wall, the name sign and the market wall at the back.
  [-6, -1, 4].forEach((z) => {
    solid.box(-14.96, 2.1, z, 0.06, 2.6, 2.8, BRASS);
    out.pics.push({ kind: 'window', corners: side(z - 1.3, z + 1.3, 0.9, 3.3) });
  });
  out.pics.push({ kind: 'sign', corners: front(HOME, -3.6, 3.6, 3.05, 3.95, -9.98) });
  solid.box(11.4, 2.2, -9.95, 6, 2.9, 0.1, DARK);
  out.pics.push({ kind: 'market', corners: front(HOME, 8.6, 14.2, 0.8, 3.6, -9.88) });

  bots.forEach((k) => {
    const w = k.size[0], d = k.size[1], m = trs(k.pos[0], 0, k.pos[1], 0);
    const pane = k.live ? GLASS : SMOKE;
    use(m);

    // Rug, brass frame and glass on three sides, with an open doorway at the front.
    ground.rect(0, 0, w - 0.2, d - 0.2, 0.006, rgb(k.live ? (k.id === 'chief' ? 0x4A3320 : 0x223C52) : 0x121A24));
    [-1, 1].forEach((i) => {
      [-1, 1].forEach((j) => solid.box(i * w / 2, H / 2, j * d / 2, 0.07, H, 0.07, BRASS));
      solid.box(0, H, i * d / 2, w + 0.07, 0.06, 0.07, BRASS);
      solid.box(i * w / 2, H, 0, 0.07, 0.06, d, BRASS);
      glass.box(i * w / 2, H / 2, 0, 0.03, H, d, pane);
      glass.box(i * w * 0.36, H / 2, d / 2, w * 0.28, H, 0.03, pane);
    });
    glass.box(0, H / 2, -d / 2, w, H, 0.03, pane);

    // Name plate in front of the cabin.
    solid.box(-w / 2 + 1.05, 0.42, d / 2 + 0.4, 1.92, 0.58, 0.07, DARK);
    solid.box(-w / 2 + 1.05, 0.06, d / 2 + 0.4, 1.92, 0.12, 0.3, BRASS);
    out.pics.push({ kind: 'plate', bot: k, corners: front(m, -w / 2 + 0.15, -w / 2 + 1.95, 0.19, 0.64, d / 2 + 0.44) });
    out.hits.push({ id: k.id, pos: k.pos, rot: 0, min: [-w / 2, 0, -d / 2], max: [w / 2, H, d / 2] });
    out.anchors[k.id] = place(m, [0, H + 0.35, 0]);

    if (k.id === 'chief') {
      // The chief of staff has a wall of screens instead of a desk.
      solid.box(0, 1.5, -d / 2 + 0.3, 4.3, 2.2, 0.12, DARK);
      out.pics.push({ kind: 'board', corners: front(m, -2, 2, 0.5, 2.5, -d / 2 + 0.37) });
      solid.box(2.2, 0.5, 0.9, 1, 1, 0.6, WOOD);
      solid.box(2.2, 1.03, 0.9, 1.1, 0.06, 0.7, CREAM);
      plant(solid, -w / 2 + 0.6, -d / 2 + 0.7);
      out.people.push({ id: k.id, bot: k, base: mul(m, trs(-2.3, 0, 0.9, 0.25)) });
      return;
    }

    solid.box(0.5, 0.74, -d / 2 + 1, 2.4, 0.07, 0.95, k.live ? CREAM : rgb(0x2A3442));
    [-1, 1].forEach((i) => solid.box(0.5 + i * 1.05, 0.37, -d / 2 + 1, 0.09, 0.74, 0.85, WOOD));
    solid.box(0.5, 0.42, -d / 2 + 1.44, 2.1, 0.5, 0.05, WOOD);
    if (!k.live) return;

    solid.box(0.8, 1.3, -d / 2 + 0.85, 1.6, 0.85, 0.05, DARK);
    solid.box(0.8, 0.82, -d / 2 + 0.85, 0.3, 0.12, 0.2, DARK);
    out.pics.push({ kind: 'screen', bot: k, corners: front(m, 0.05, 1.55, 0.92, 1.67, -d / 2 + 0.88) });
    plant(solid, w / 2 - 0.55, -d / 2 + 0.55);
    out.people.push({ id: k.id, bot: k, base: mul(m, trs(-0.95, 0, 0.3, 0.2)) });
  });

  use(HOME);

  // Lounge by the left wall: the trading group and the board of ideas they share.
  ground.rect(-11.4, 7.2, 6.4, 4.4, 0.006, rgb(0x33284A));
  solid.box(-13.9, 0.34, 7.2, 0.95, 0.3, 3.2, CREAM);
  solid.box(-14.4, 0.72, 7.2, 0.2, 0.5, 3.2, CREAM);
  [-1, 1].forEach((i) => solid.box(-13.9, 0.5, 7.2 + i * 1.7, 0.95, 0.4, 0.2, CREAM));
  solid.cyl(-11.2, 0, 7.2, 0.62, 0.62, 0.42, WOOD, 20);
  solid.cyl(-11.2, 0.42, 7.2, 0.7, 0.7, 0.05, CREAM, 20);
  out.pics.push({ kind: 'group', corners: side(6.1, 9.3, 1.45, 3.05) });
  [
    [-12, 5.9, 0.9, { shirt: 0xD9A441, skin: 0xC08A63, hair: 0x15100D }],
    [-10, 6.2, -0.7, { shirt: 0x4F7CAC, skin: 0xD3A17B, hair: 0x1D1410 }],
    [-10.3, 8.4, -2.4, { shirt: 0xB5446E, skin: 0xB57B56, hair: 0x100C0A }]
  ].forEach((p) => { solid.at(p[0], 0, p[1], p[2]); person(solid, p[3]); });
  solid.at(0, 0, 0, 0);
  out.anchors.group = [-11.2, 2.6, 7.2];

  // The trader's own standing desk at the front, where every line ends.
  solid.box(0, 1.04, 6.2, 1.8, 0.06, 0.8, CREAM);
  [-1, 1].forEach((i) => solid.box(i * 0.8, 0.52, 6.2, 0.08, 1.04, 0.7, WOOD));
  solid.box(0, 1.1, 6.15, 0.5, 0.03, 0.34, rgb(0xC9CED8));
  solid.box(0, 1.26, 5.98, 0.5, 0.32, 0.03, rgb(0x9AA3B5));
  solid.at(0, 0, 7.05, Math.PI);
  person(solid, { shirt: 0xF1EFE6, skin: 0xC08A63, hair: 0x8D8D8A });
  solid.at(0, 0, 0, 0);
  out.anchors.you = [0, 2.55, 7.05];

  // The written rules, on a board beside the risk desk.
  solid.box(11.4, 1.55, 1.2, 4, 2.1, 0.12, DARK);
  [-1, 1].forEach((i) => solid.box(11.4 + i * 1.5, 0.25, 1.2, 0.12, 0.5, 0.7, DARK));
  out.pics.push({ kind: 'rules', corners: front(HOME, 9.5, 13.3, 0.6, 2.5, 1.27) });

  [[13.9, 8.9], [13.9, -8.6], [-13.9, -8.9], [9.2, 8.9], [-13.9, 2.6]].forEach((p) => plant(solid, p[0], p[1]));

  // Desk staff are separate so they can move a little.
  out.people.forEach((p) => { p.geo = new Geo(); person(p.geo, p.bot); });
  return out;
}
