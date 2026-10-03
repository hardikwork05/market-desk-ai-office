// Small WebGL helper for the office scene. No external library.

export function trs(x, y, z, ry) {
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1]);
}

export function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

export function rgb(hex, a) {
  return [(hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255, a === undefined ? 1 : a];
}

// Builds triangles as: position 3, normal 3, colour 4.
export class Geo {
  constructor() { this.v = []; this.M = trs(0, 0, 0, 0); }
  at(x, y, z, ry) { this.M = trs(x, y, z, ry); return this; }
  put(p, n, c) {
    const M = this.M;
    this.v.push(
      M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12],
      M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13],
      M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14],
      M[0] * n[0] + M[4] * n[1] + M[8] * n[2],
      M[1] * n[0] + M[5] * n[1] + M[9] * n[2],
      M[2] * n[0] + M[6] * n[1] + M[10] * n[2],
      c[0], c[1], c[2], c[3]);
  }
  quad(a, b, c, d, n, col) {
    this.put(a, n, col); this.put(b, n, col); this.put(c, n, col);
    this.put(a, n, col); this.put(c, n, col); this.put(d, n, col);
  }
  box(x, y, z, w, h, d, col) {
    const X = w / 2, Y = h / 2, Z = d / 2;
    const P = (i, j, k) => [x + i * X, y + j * Y, z + k * Z];
    this.quad(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), [0, 0, 1], col);
    this.quad(P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), [0, 0, -1], col);
    this.quad(P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), [1, 0, 0], col);
    this.quad(P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), [-1, 0, 0], col);
    this.quad(P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1), [0, 1, 0], col);
    this.quad(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), [0, -1, 0], col);
  }
  // Flat rectangle lying on the floor at height y.
  rect(x, z, w, d, y, col) {
    const X = w / 2, Z = d / 2;
    this.quad([x - X, y, z + Z], [x + X, y, z + Z], [x + X, y, z - Z], [x - X, y, z - Z], [0, 1, 0], col);
  }
  // Upright cylinder or cone section: base centre at x,y,z.
  cyl(x, y, z, r0, r1, h, col, n) {
    n = n || 14;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const b0 = [x + c0 * r0, y, z + s0 * r0], b1 = [x + c1 * r0, y, z + s1 * r0];
      const t0 = [x + c0 * r1, y + h, z + s0 * r1], t1 = [x + c1 * r1, y + h, z + s1 * r1];
      const n0 = [c0, 0, s0], n1 = [c1, 0, s1], up = [0, 1, 0];
      this.put(b0, n0, col); this.put(b1, n1, col); this.put(t1, n1, col);
      this.put(b0, n0, col); this.put(t1, n1, col); this.put(t0, n0, col);
      this.put([x, y + h, z], up, col); this.put(t0, up, col); this.put(t1, up, col);
    }
  }
  // Sphere. cut below 1 keeps only the top part, sy squashes it.
  ball(x, y, z, r, col, n, cut, sy) {
    n = n || 12; cut = cut || 1; sy = sy || 1;
    const rings = Math.max(3, Math.round(n * 0.6 * cut));
    const at = (p, t) => {
      const d = [Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
      return [[x + r * d[0], y + r * sy * d[1], z + r * d[2]], d];
    };
    for (let i = 0; i < rings; i++) {
      const p0 = i / rings * Math.PI * cut, p1 = (i + 1) / rings * Math.PI * cut;
      for (let j = 0; j < n; j++) {
        const t0 = j / n * 6.2832, t1 = (j + 1) / n * 6.2832;
        const a = at(p0, t0), b = at(p1, t0), c = at(p1, t1), d = at(p0, t1);
        this.put(a[0], a[1], col); this.put(b[0], b[1], col); this.put(c[0], c[1], col);
        this.put(a[0], a[1], col); this.put(c[0], c[1], col); this.put(d[0], d[1], col);
      }
    }
  }
}

const VS = 'attribute vec3 p;attribute vec3 n;attribute vec4 c;uniform mat4 vp;uniform mat4 m;' +
  'varying vec3 vn;varying vec4 vc;' +
  'void main(){vn=(m*vec4(n,0.0)).xyz;vc=c;gl_Position=vp*m*vec4(p,1.0);}';
const FS = 'precision mediump float;varying vec3 vn;varying vec4 vc;uniform vec3 L;uniform vec4 tint;' +
  'void main(){if(tint.a>0.0){gl_FragColor=tint;return;}' +
  'vec3 k=normalize(vn);float d=max(dot(k,L),0.0);' +
  'vec3 h=mix(vec3(0.60,0.65,0.76),vec3(1.0),k.y*0.5+0.5);' +
  'gl_FragColor=vec4(min(vc.rgb*(h*0.74+d*0.40),1.0),vc.a);}';
const VS2 = 'attribute vec3 p;attribute vec2 uv;uniform mat4 vp;varying vec2 vu;' +
  'void main(){vu=uv;gl_Position=vp*vec4(p,1.0);}';
const FS2 = 'precision mediump float;varying vec2 vu;uniform sampler2D t;' +
  'void main(){gl_FragColor=texture2D(t,vu);}';

const LIGHT = [0.392, 0.784, 0.479];
const ID = trs(0, 0, 0, 0);

export function createGL(canvas) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, stencil: true });
  if (!gl) return null;

  const program = (vs, fs) => {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach((d) => {
      const s = gl.createShader(d[0]);
      gl.shaderSource(s, d[1]); gl.compileShader(s); gl.attachShader(p, s);
    });
    gl.linkProgram(p);
    return p;
  };
  const A = program(VS, FS), B = program(VS2, FS2);
  const uA = { vp: gl.getUniformLocation(A, 'vp'), m: gl.getUniformLocation(A, 'm'), L: gl.getUniformLocation(A, 'L'), tint: gl.getUniformLocation(A, 'tint') };
  const aA = { p: gl.getAttribLocation(A, 'p'), n: gl.getAttribLocation(A, 'n'), c: gl.getAttribLocation(A, 'c') };
  const uB = { vp: gl.getUniformLocation(B, 'vp') };
  const aB = { p: gl.getAttribLocation(B, 'p'), uv: gl.getAttribLocation(B, 'uv') };

  // Shadow matrix: flattens everything onto the floor along the light.
  const a = LIGHT[0] / LIGHT[1], b = LIGHT[2] / LIGHT[1], h = 0.014;
  const SHADOW = new Float32Array([1, 0, 0, 0, -a, 0, -b, 0, 0, 0, 1, 0, h * a, h, h * b, 1]);

  const mesh = (geo) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.v), gl.STATIC_DRAW);
    return { buf: buf, n: geo.v.length / 10 };
  };

  // Textured rectangle from four corners (bottom left, bottom right, top right, top left).
  const picture = (corners, source) => {
    const c = corners, d = [];
    [[0, 0, 0], [1, 1, 0], [2, 1, 1], [0, 0, 0], [2, 1, 1], [3, 0, 1]].forEach((k) => {
      d.push(c[k[0]][0], c[k[0]][1], c[k[0]][2], k[1], k[2]);
    });
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.STATIC_DRAW);
    const tex = gl.createTexture();
    const update = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    };
    update();
    return { buf: buf, tex: tex, update: update };
  };

  const draw = (m, model, tint) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
    gl.vertexAttribPointer(aA.p, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(aA.n, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(aA.c, 4, gl.FLOAT, false, 40, 24);
    gl.uniformMatrix4fv(uA.m, false, model);
    gl.uniform4fv(uA.tint, tint || [0, 0, 0, 0]);
    gl.drawArrays(gl.TRIANGLES, 0, m.n);
  };

  // world: { ground, solid, glass, movers: [{ mesh, m }], pictures: [] }
  const render = (world, vp) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    gl.useProgram(A);
    gl.enableVertexAttribArray(aA.p); gl.enableVertexAttribArray(aA.n); gl.enableVertexAttribArray(aA.c);
    gl.uniformMatrix4fv(uA.vp, false, vp);
    gl.uniform3fv(uA.L, LIGHT);

    // Floor marks the stencil so shadows only land on it, once per pixel.
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.ALWAYS, 1, 255);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    draw(world.ground, ID);
    gl.disable(gl.STENCIL_TEST);

    draw(world.solid, ID);
    world.movers.forEach((o) => draw(o.mesh, o.m));

    gl.useProgram(B);
    gl.enableVertexAttribArray(aB.p); gl.enableVertexAttribArray(aB.uv);
    gl.uniformMatrix4fv(uB.vp, false, vp);
    world.pictures.forEach((q) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, q.buf);
      gl.vertexAttribPointer(aB.p, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(aB.uv, 2, gl.FLOAT, false, 20, 12);
      gl.bindTexture(gl.TEXTURE_2D, q.tex);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    gl.useProgram(A);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.EQUAL, 1, 255);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
    const shade = [0.08, 0.12, 0.26, 0.2];
    draw(world.solid, SHADOW, shade);
    world.movers.forEach((o) => draw(o.mesh, mul(SHADOW, o.m), shade));
    gl.disable(gl.STENCIL_TEST);

    draw(world.glass, ID);
    gl.depthMask(true);
  };

  return { mesh: mesh, picture: picture, render: render };
}

// Camera on a sphere around a target. Returns the matrix plus what picking needs.
export function camera(rig, aspect) {
  const fov = 0.7, near = 1, far = 140;
  const sp = Math.sin(rig.ph), cp = Math.cos(rig.ph);
  const eye = [rig.tx + rig.r * sp * Math.sin(rig.th), rig.ty + rig.r * cp, rig.tz + rig.r * sp * Math.cos(rig.th)];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const z = norm([eye[0] - rig.tx, eye[1] - rig.ty, eye[2] - rig.tz]);
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  const view = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
  const f = 1 / Math.tan(fov / 2);
  const proj = new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
  const vp = mul(proj, view);
  return {
    vp: vp,
    eye: eye,
    // Screen position (0..1) of a world point, or null when it is behind the camera.
    project: (p) => {
      const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
      if (w <= 0) return null;
      return [(vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]) / w * 0.5 + 0.5,
        0.5 - (vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]) / w * 0.5];
    },
    // Ray direction through a screen point given as -1..1.
    ray: (nx, ny) => {
      const t = Math.tan(fov / 2);
      return norm([-z[0] + x[0] * nx * t * aspect + y[0] * ny * t,
        -z[1] + x[1] * nx * t * aspect + y[1] * ny * t,
        -z[2] + x[2] * nx * t * aspect + y[2] * ny * t]);
    }
  };
}
