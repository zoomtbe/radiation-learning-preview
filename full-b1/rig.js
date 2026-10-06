/* Emilia — raster mesh-deformation presenter rig (WebGL).
 * Artwork: the approved 5 October Emilia artwork (rig base emilia-rig-base.png),
 * cleaned and cropped as a cut-out (alpha halo removed).
 * Technique (Live2D-like): the painted image is a dense textured mesh. Per frame the vertices
 * are displaced by parameter fields (jaw/lips, lids, gaze, brows, head, breathing, forearms,
 * wrists). The lips are a separately meshed patch cut along the lip line, so the mouth really
 * opens; a painted interior (teeth, tongue, shadow) is visible only through that aperture.
 * Coordinates below are in rig-base image pixels (662 x 1536, approved 5 October artwork).
 */
(function () {
  'use strict';
  const BASE = new URL('./', document.currentScript.src).href;
  // 2D revision 2026-10-05: landmarks measured on the approved 5 October Emilia
  // (the approved artwork, prepared as a cut-out
  // into emilia-rig-base.png, 662 x 1536). The old artwork's coordinates are not reused.
  const L = {
    size: [662, 1536],
    lip: [[265.0, 209.7], [276.7, 210.0], [290.0, 208.0], [305.0, 205.3], [319.2, 199.2]],
    lipUp: 12, lipDn: 20,
    eyes: [
      { c: [249.5, 156.0], a: 17.0, tilt: -6.0, bt: 9.5, bb: 6.8, iris: [253.7, 154.2] },
      { c: [318.3, 140.4], a: 20.0, tilt: -19.5, bt: 10.5, bb: 8.0, iris: [316.3, 139.7] },
    ],
    brows: [{ c: [243, 131], inner: [262, 133], tilt: -6 }, { c: [308, 115], inner: [289, 118], tilt: -10 }],
    headPivot: [300, 270], face: [289, 172],
    arms: {
      L: { elbow: [172, 565], wrist: [110, 560], handDir: -1, attach: [[122, 522], [205, 527], [200, 600], [150, 626]],
        mask: [[0, 478], [108, 478], [124, 520], [206, 526], [200, 560], [195, 615], [150, 628], [100, 632], [60, 622], [0, 600]] },
      R: { elbow: [500, 555], wrist: [535, 640], handDir: 1, attach: [[488, 470], [492, 540], [505, 600], [507, 700], [520, 760]],
        mask: [[488, 470], [525, 470], [560, 560], [600, 612], [655, 628], [660, 760], [520, 760], [507, 700], [505, 600], [492, 540]] },
    },
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function inPoly(x, y, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  function distPolyline(x, y, pl) {
    let best = 1e9;
    for (let i = 1; i < pl.length; i++) {
      const [ax, ay] = pl[i - 1], [bx, by] = pl[i]; const vx = bx - ax, vy = by - ay;
      const t = clamp(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy), 0, 1);
      best = Math.min(best, Math.hypot(x - ax - vx * t, y - ay - vy * t));
    }
    return best;
  }

  /* lip curve, arc-length parametrised, with linear extension beyond the corners */
  const lipCurve = (() => {
    const p = L.lip; const seg = []; let tot = 0;
    for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(d); tot += d; }
    function at(u) {
      let s = u * tot;
      if (s <= 0) { const t = [(p[1][0] - p[0][0]) / seg[0], (p[1][1] - p[0][1]) / seg[0]]; return { x: p[0][0] + t[0] * s, y: p[0][1] + t[1] * s, tx: t[0], ty: t[1] }; }
      for (let i = 0; i < seg.length; i++) {
        if (s <= seg[i] || i === seg.length - 1) {
          const t = [(p[i + 1][0] - p[i][0]) / seg[i], (p[i + 1][1] - p[i][1]) / seg[i]];
          return { x: p[i][0] + t[0] * s, y: p[i][1] + t[1] * s, tx: t[0], ty: t[1] };
        }
        s -= seg[i];
      }
    }
    const samples = [];
    for (let k = 0; k <= 220; k++) { const u = -0.6 + (k / 220) * 2.2; samples.push([u, at(u)]); }
    function project(x, y) {
      let best = 1e9, bu = 0, bp = null;
      for (const [u, q] of samples) { const d = (x - q.x) ** 2 + (y - q.y) ** 2; if (d < best) { best = d; bu = u; bp = q; } }
      const nx = -bp.ty, ny = bp.tx; // normal pointing down (toward chin)
      const v = (x - bp.x) * nx + (y - bp.y) * ny;
      return { u: bu, v };
    }
    return { at, project, length: tot };
  })();

  /* ---------------- mesh construction ---------------- */
  function axis(max, denseFrom, denseTo, coarse, fine) {
    const out = [];
    for (let x = 0; x < denseFrom; x += coarse) out.push(x);
    for (let x = denseFrom; x < denseTo; x += fine) out.push(x);
    for (let x = denseTo; x < max; x += coarse) out.push(x);
    out.push(max);
    return out;
  }

  function buildMesh(alpha) {
    const [W, H] = L.size;
    const xs = axis(W, 210, 380, 10, 3), ys = axis(H, 96, 270, 10, 3);
    const nx = xs.length, ny = ys.length;
    const opaque = (x, y) => { // any alpha in a 6px neighbourhood
      for (let dy = -6; dy <= 6; dy += 3) for (let dx = -6; dx <= 6; dx += 3) {
        const px = clamp(Math.round(x + dx), 0, W - 1), py = clamp(Math.round(y + dy), 0, H - 1);
        if (alpha[py * W + px] > 0) return true;
      }
      return false;
    };
    const verts = []; // [x,y]
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) verts.push([xs[i], ys[j]]);
    const tri = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
      // Keep full texture mesh: do not cull narrow finger-edge triangles.
      // leave the lip core to the mouth patch
      if (cx > 250 && cx < 335 && cy > 185 && cy < 232) {
        const pr = lipCurve.project(cx, cy);
        if (pr.u > 0.03 && pr.u < 0.97 && pr.v > -9 && pr.v < 14) continue;
      }
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      tri.push(a, b, c, b, d, c);
    }
    // mouth patch with a cut seam between the corners
    const pu = 60, pvUp = 10, pvDn = 16;
    const base = verts.length; const patchIdx = {}; const seamUpper = [], seamLower = [];
    const sides = [];
    for (let k = 0; k <= pu; k++) {
      const u = -0.35 + (k / pu) * 1.7; const q = lipCurve.at(u); const nX = -q.ty, nY = q.tx;
      for (let r = -pvUp; r <= pvDn; r++) {
        const v = r < 0 ? (r / pvUp) * L.lipUp : (r / pvDn) * L.lipDn;
        const key = k + ':' + r;
        const cut = r === 0 && u > 0.001 && u < 0.999;
        const pos = [q.x + nX * v, q.y + nY * v];
        if (cut) {
          patchIdx[key + 'u'] = verts.length; verts.push(pos.slice()); sides.push([verts.length - 1, -1, u, 0]); seamUpper.push(verts.length - 1);
          patchIdx[key + 'l'] = verts.length; verts.push(pos.slice()); sides.push([verts.length - 1, 1, u, 0]); seamLower.push(verts.length - 1);
        } else {
          patchIdx[key] = verts.length; verts.push(pos); sides.push([verts.length - 1, v < 0 ? -1 : v > 0 ? 1 : 0, u, v]);
        }
      }
    }
    const P = (k, r, s) => patchIdx[k + ':' + r] != null ? patchIdx[k + ':' + r] : patchIdx[k + ':' + r + s];
    const patchTri = [];
    for (let k = 0; k < pu; k++) for (let r = -pvUp; r < pvDn; r++) {
      const s = r < 0 ? 'u' : 'l'; // rows above the seam use the upper copies; below use lower copies
      const a = P(k, r, r + 1 === 0 ? 'u' : s), b = P(k + 1, r, r + 1 === 0 ? 'u' : s);
      const c = P(k, r + 1, r + 1 === 0 ? 'u' : s), d = P(k + 1, r + 1, r + 1 === 0 ? 'u' : s);
      const a2 = r === 0 ? P(k, 0, 'l') : a, b2 = r === 0 ? P(k + 1, 0, 'l') : b;
      patchTri.push(a2, b2, c, b2, d, c);
    }
    return { verts, tri, patchTri, base, sides, seamUpper, seamLower, nx, ny };
  }

  /* ---------------- static per-vertex weights ---------------- */
  function precompute(mesh) {
    const n = mesh.verts.length;
    const F = (k) => new Float32Array(n);
    const w = { u: F(), v: F(), side: F(), mouth: F(), jaw: F(), corner: F(), cornerSign: F(), head: F(), core: F(),
      eye: new Int8Array(n).fill(-1), ex: F(), ey: F(), brow: F(), browIn: F(), browSide: new Int8Array(n),
      armL: F(), handL: F(), armR: F(), handR: F(), breath: F(), shoulder: F() };
    const patchSide = new Map(mesh.sides.map((s) => [s[0], s]));
    for (let i = 0; i < n; i++) {
      const [x, y] = mesh.verts[i];
      // mouth coordinates
      let u, v, side;
      if (patchSide.has(i)) { const s = patchSide.get(i); side = s[1]; u = s[2]; v = i >= mesh.base ? lipCurve.project(x, y).v : s[3]; if (s[3] === 0 && s[1] !== 0) v = 0; }
      else if (x > 225 && x < 370 && y > 165 && y < 285) { const pr = lipCurve.project(x, y); u = pr.u; v = pr.v; side = v < 0 ? -1 : 1; }
      else { u = -9; v = 99; side = 0; }
      w.u[i] = u; w.v[i] = v; w.side[i] = side;
      const du = Math.min(Math.abs(u * lipCurve.length), Math.abs((u - 1) * lipCurve.length));
      w.mouth[i] = (u > -0.5 && u < 1.5) ? Math.exp(-(((Math.max(0, -u * lipCurve.length) + Math.max(0, (u - 1) * lipCurve.length)) / 14) ** 2)) * Math.exp(-((v / 30) ** 2)) : 0;
      w.corner[i] = (u > -0.5 && u < 1.5) ? Math.exp(-((du / 10) ** 2) - ((v / 12) ** 2)) : 0;
      w.cornerSign[i] = u < 0.5 ? -1 : 1;
      // jaw: lower face below the lip line, fading at cheeks and neck
      if (side > 0 || (x > 232 && x < 362 && y > 205 && y < 292 && v > 0)) {
        const sx = 1 - sstep(46, 72, Math.abs(x - 294));
        const sy = 1 - sstep(244, 266, y);
        w.jaw[i] = sx * sy * (v > -1 ? 1 : 0);
      }
      // head rigid weight
      w.head[i] = 1 - sstep(240, 296, y);
      if ((x > 390 || x < 215) && y > 195) w.head[i] *= 1 - sstep(215, 300, y); // curls resting on both shoulders
      w.core[i] = Math.exp(-(((x - L.face[0]) / 62) ** 2) - (((y - L.face[1]) / 70) ** 2));
      // eyes (local rotated frame)
      L.eyes.forEach((e, k) => {
        const t = (-e.tilt * Math.PI) / 180, dx = x - e.c[0], dy = y - e.c[1];
        const lx = dx * Math.cos(t) - dy * Math.sin(t), ly = dx * Math.sin(t) + dy * Math.cos(t);
        if (Math.abs(lx) < e.a + 8 && ly > -e.bt - 16 && ly < e.bb + 8) { w.eye[i] = k; w.ex[i] = lx; w.ey[i] = ly; }
      });
      // brows
      L.brows.forEach((b, k) => {
        const g = Math.exp(-(((x - b.c[0]) / 26) ** 2) - (((y - b.c[1]) / 11) ** 2));
        if (g > w.brow[i]) { w.brow[i] = g; w.browSide[i] = k; w.browIn[i] = Math.exp(-(((x - b.inner[0]) / 12) ** 2) - (((y - b.inner[1]) / 9) ** 2)); }
      });
      // forearms and hands (masked so torso pixels are never dragged)
      ['L', 'R'].forEach((s) => {
        const A = L.arms[s];
        if (!inPoly(x, y, A.mask)) return;
        const d = Math.hypot(x - A.elbow[0], y - A.elbow[1]);
        w['arm' + s][i] = sstep(18, 80, d) * sstep(3, 26, distPolyline(x, y, A.attach));
        const along = (x - A.wrist[0]) * A.handDir;
        w['hand' + s][i] = sstep(-6, 14, along);
      });
      w.breath[i] = sstep(250, 300, y) * (1 - sstep(560, 780, y));
      w.shoulder[i] = (1 - sstep(330, 430, y)) * sstep(255, 305, y) * sstep(30, 90, Math.abs(x - 312));
    }
    return w;
  }

  /* ---------------- WebGL ---------------- */
  const VS = `attribute vec2 p; attribute vec2 t; uniform vec4 m; varying vec2 vt;
    void main(){ vt=t; gl_Position=vec4(p.x*m.x+m.z, p.y*m.y+m.w, 0.0, 1.0); }`;
  const FS = `precision mediump float; varying vec2 vt; uniform sampler2D s; void main(){ gl_FragColor=texture2D(s,vt); }`;

  function create(container, opts) {
    opts = opts || {};
    const src = opts.src || BASE + 'emilia-rig-base.png';
    const canvas = document.createElement('canvas');
    canvas.className = 'emilia-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Emilia, your course presenter');
    container.appendChild(canvas);
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
    const state = {
      mouth: { open: 0, wide: 0, round: 0, teeth: 0, tuck: 0, tongue: 0, press: 0 }, smile: 0, brows: { l: 0, r: 0, furrow: 0, worry: 0 },
      blink: 0, squint: 0, gaze: { x: 0, y: 0 }, head: { yaw: 0, pitch: 0, roll: 0 }, body: { breath: 0, sway: 0, shift: 0, shoulders: 0 },
      arms: { L: { lift: 0, wrist: 0 }, R: { lift: 0, wrist: 0 } },
    };
    const api = { state, canvas, ready: false, render: () => {}, onready: null, failed: false };
    if (!gl) {
      api.failed = true;
      const img = document.createElement('img'); img.src = src; img.alt = ''; img.className = 'emilia-fallback';
      container.replaceChild(img, canvas);
      console.warn('WebGL unavailable: Emilia shown as a still illustration.');
      return api;
    }
    const img = new Image();
    img.onload = () => {
      const [W, H] = L.size;
      const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
      const x2 = c2.getContext('2d'); x2.drawImage(img, 0, 0);
      let data;
      try { data = x2.getImageData(0, 0, W, H).data; } catch (e) {
        // file:// pages cannot read image pixels: show the still artwork and say how to get animation
        api.failed = true;
        const still = document.createElement('img'); still.src = src; still.alt = ''; still.className = 'emilia-fallback';
        if (canvas.parentNode) canvas.parentNode.replaceChild(still, canvas);
        console.warn('Emilia animation needs the local preview server (Launch B1.1 preview.cmd); showing the still illustration.');
        return;
      }
      const alpha = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) alpha[i] = data[i * 4 + 3];
      const mesh = buildMesh(alpha); const wt = precompute(mesh);
      const sample = (sx, sy) => { let r = 0, g = 0, b = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = ((sy + dy) * W + (sx + dx)) * 4; r += data[k]; g += data[k + 1]; b += data[k + 2]; } return [r / 9, g / 9, b / 9]; };
      const lidSkin = [sample(258, 170), sample(331, 156)]; // under-eye skin: closest clean match for the lid
      setup(mesh, wt, lidSkin);
    };
    img.src = src;

    function setup(mesh, wt, lidSkin) {
      const [W, H] = L.size;
      const prog = gl.createProgram();
      [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]].forEach(([type, code]) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); gl.attachShader(prog, s); });
      gl.linkProgram(prog); gl.useProgram(prog);
      const aP = gl.getAttribLocation(prog, 'p'), aT = gl.getAttribLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');
      const tex = (source) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
      const texImg = tex(img);
      // mouth interior canvas (pre-rigid space rect)
      const MI = { x: 252, y: 183, w: 84, h: 52, s: 4 };
      const ic = document.createElement('canvas'); ic.width = MI.w * MI.s; ic.height = MI.h * MI.s; const ix = ic.getContext('2d');
      const texIn = tex(ic);
      const n = mesh.verts.length;
      const rest = new Float32Array(n * 2), pos = new Float32Array(n * 2), uv = new Float32Array(n * 2);
      mesh.verts.forEach(([x, y], i) => { rest[i * 2] = x; rest[i * 2 + 1] = y; uv[i * 2] = x / W; uv[i * 2 + 1] = y / H; });
      const bPos = gl.createBuffer(), bUv = gl.createBuffer(), bIdx = gl.createBuffer(), bIdx2 = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
      const ext = gl.getExtension('OES_element_index_uint');
      const IdxT = n > 65535 ? Uint32Array : Uint16Array;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new IdxT(mesh.tri), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx2); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new IdxT(mesh.patchTri), gl.STATIC_DRAW);
      const idxType = IdxT === Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      if (IdxT === Uint32Array && !ext) console.warn('32-bit indices unsupported');
      // interior quad
      const qPos = new Float32Array(8), qUv = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
      const bQ = gl.createBuffer(), bQuv = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bQuv); gl.bufferData(gl.ARRAY_BUFFER, qUv, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bQ); gl.bufferData(gl.ARRAY_BUFFER, qPos, gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const local = new Float32Array(n * 2);
      /* per-region vertex lists so each field only touches what it moves */
      const used = new Uint8Array(n);
      mesh.tri.forEach((k) => { used[k] = 1; }); mesh.patchTri.forEach((k) => { used[k] = 1; });
      const lists = { active: [], mouth: [], eye: [], brow: [], armL: [], armR: [], head: [], body: [] };
      const mTx = new Float32Array(n), mTy = new Float32Array(n), mSin = new Float32Array(n), mLow = new Float32Array(n), mUp = new Float32Array(n), mPress = new Float32Array(n), mPuck = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        if (!used[i]) continue;
        lists.active.push(i);
        if (wt.mouth[i] > 0.002 || wt.jaw[i] > 0.002) {
          lists.mouth.push(i);
          const u = wt.u[i], v = wt.v[i], q = lipCurve.at(clamp(u, -0.3, 1.3));
          mTx[i] = q.tx; mTy[i] = q.ty; mSin[i] = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
          mLow[i] = Math.exp(-((v / 13) ** 2)) * wt.mouth[i]; mUp[i] = Math.exp(-((v / 10) ** 2)) * wt.mouth[i];
          mPress[i] = Math.exp(-((v / 8) ** 2)); mPuck[i] = (u > -0.2 && u < 1.2) ? -(u - 0.5) * Math.exp(-((v / 14) ** 2)) * wt.mouth[i] : 0;
        }
        if (wt.eye[i] >= 0) lists.eye.push(i);
        if (wt.brow[i] > 0.01) lists.brow.push(i);
        if (wt.armL[i] > 0) lists.armL.push(i);
        if (wt.armR[i] > 0) lists.armR.push(i);
        if (wt.head[i] > 0) lists.head.push(i);
      }
      const eyeConst = L.eyes.map((e) => ({ c: Math.cos((e.tilt * Math.PI) / 180), s: Math.sin((e.tilt * Math.PI) / 180) }));
      const eyeTop = new Float32Array(n), eyeBot = new Float32Array(n), eyeWx = new Float32Array(n), eyeIn = new Float32Array(n);
      lists.eye.forEach((i) => {
        const e = L.eyes[wt.eye[i]], lx = wt.ex[i], ly = wt.ey[i];
        const r = clamp(Math.abs(lx) / e.a, 0, 1);
        eyeTop[i] = -e.bt * Math.pow(1 - r * r, 0.55); eyeBot[i] = e.bb * Math.pow(1 - r * r, 0.7);
        eyeWx[i] = sstep(e.a + 6, e.a - 1, Math.abs(lx));
        eyeIn[i] = (lx / e.a) ** 2 + (ly > 0 ? (ly / e.bb) ** 2 : (ly / e.bt) ** 2);
      });
      const D = new Float32Array(n * 2); // working positions
      function rotList(list, wArr, cx, cy, ang, handArr, wrist, wAng) {
        if (Math.abs(ang) < 1e-5 && Math.abs(wAng) < 1e-5) return;
        const wc = Math.cos(ang), ws = Math.sin(ang);
        const wx0 = cx + (wrist[0] - cx) * wc - (wrist[1] - cy) * ws, wy0 = cy + (wrist[0] - cx) * ws + (wrist[1] - cy) * wc;
        for (let j = 0; j < list.length; j++) {
          const i = list[j]; let x = D[i * 2], y = D[i * 2 + 1];
          const a = ang * wArr[i]; const c = Math.cos(a), s = Math.sin(a);
          const ox = x - cx, oy = y - cy; x = cx + ox * c - oy * s; y = cy + ox * s + oy * c;
          const hw = handArr[i];
          if (hw > 0 && wAng) { const a2 = wAng * hw, c2 = Math.cos(a2), s2 = Math.sin(a2); const hx = x - wx0, hy = y - wy0; x = wx0 + hx * c2 - hy * s2; y = wy0 + hx * s2 + hy * c2; }
          D[i * 2] = x; D[i * 2 + 1] = y;
        }
      }
      function deform(st) {
        D.set(rest);
        const m = st.mouth, J = clamp(m.open, 0, 1.2), R = clamp(m.round, 0, 1), Wd = m.wide, P = m.press, S = st.smile;
        const LIPOPEN = 11.5 * (1 - 0.3 * R), CHIN = 4.2, expo = 0.75 + R * 1.8;
        const cornerAmt = Wd * 2.6 - R * 6.5;
        /* mouth & jaw */
        for (let j = 0; j < lists.mouth.length; j++) {
          const i = lists.mouth[j], side = wt.side[i];
          const prof = mSin[i] > 0 ? Math.pow(mSin[i], expo) : 0;
          let dx = 0, dy = 0;
          const rp = R > 0 && mSin[i] > 0 ? Math.pow(mSin[i], 3.2) : 0; // rounded aperture (O/U): a small central opening
          if (side > 0) dy += J * (LIPOPEN * prof * mLow[i] + CHIN * wt.jaw[i]) + R * 3.4 * rp * mLow[i] - (P * 1.0 + m.tuck * 2.2) * prof * mPress[i];
          else if (side < 0) dy += -(J * 2.2 + R * 0.8) * prof * mUp[i] - R * 2.4 * rp * mUp[i] + P * 0.8 * prof * mPress[i];
          const cw = wt.corner[i];
          if (cw > 0.001) { const a = cornerAmt * wt.cornerSign[i] * cw; dx += mTx[i] * a; dy += mTy[i] * a + cw * (-S * 2.6 + J * 1.4); }
          if (R > 0) { const g = mPuck[i] * R * 7; dx += mTx[i] * g; dy += mTy[i] * g; }
          D[i * 2] += dx; D[i * 2 + 1] += dy;
        }
        /* eyes: lid collapse + gaze */
        const B = clamp(st.blink + (st.lidDrop || 0), 0, 1), Bq = clamp(st.squint, 0, 1);
        const gx = st.gaze.x, gy = st.gaze.y;
        for (let j = 0; j < lists.eye.length; j++) {
          const i = lists.eye[j], k = wt.eye[i], lx = wt.ex[i], ly = wt.ey[i];
          const topL = eyeTop[i], botL = eyeBot[i], wx = eyeWx[i];
          const closeLine = topL + 0.7 * (botL - topL);
          let ny = ly, nx = lx;
          // the eyelid itself is a painted layer (paintLids); the mesh only lifts the lower lid for smiles/squints
          if (ly >= closeLine) ny = ly + (closeLine - ly) * Bq * 0.3 * (1 - sstep(botL - 0.5, botL + 3.5, ly)) * wx;
          if (eyeIn[i] < 1) { const g = 1 - eyeIn[i]; nx += gx * 2.8 * g; ny += gy * 1.3 * g * (1 - B); }
          const ec = eyeConst[k], ddx = nx - lx, ddy = ny - ly;
          D[i * 2] += ddx * ec.c - ddy * ec.s; D[i * 2 + 1] += ddx * ec.s + ddy * ec.c;
        }
        /* brows */
        for (let j = 0; j < lists.brow.length; j++) {
          const i = lists.brow[j], k = wt.browSide[i], bw = wt.brow[i], inn = wt.browIn[i];
          const raise = k === 0 ? st.brows.l : st.brows.r;
          D[i * 2 + 1] += -raise * 3.6 * bw + (st.brows.furrow * 2.2 - st.brows.worry * 2.4) * inn;
          D[i * 2] += (k === 0 ? 1 : -1) * st.brows.furrow * 1.6 * inn;
        }
        /* forearms & wrists */
        const AL = L.arms.L, AR = L.arms.R;
        /* Arm deformation disabled to preserve complete hands.
        rotList(lists.armL, wt.armL, AL.elbow[0], AL.elbow[1], (st.arms.L.lift * Math.PI) / 180, wt.handL, AL.wrist, (st.arms.L.wrist * Math.PI) / 180);
        rotList(lists.armR, wt.armR, AR.elbow[0], AR.elbow[1], (st.arms.R.lift * Math.PI) / 180, wt.handR, AR.wrist, (st.arms.R.wrist * Math.PI) / 180);
        */
        /* head rigid: roll about the neck, yaw/pitch parallax */
        const roll = (st.head.roll * Math.PI) / 180, [px0, py0] = L.headPivot, yaw = st.head.yaw, pitch = st.head.pitch;
        for (let j = 0; j < lists.head.length; j++) {
          const i = lists.head[j], hw = wt.head[i];
          let x = D[i * 2], y = D[i * 2 + 1];
          const a = roll * hw; if (a) { const c = Math.cos(a), s = Math.sin(a), ox = x - px0, oy = y - py0; x = px0 + ox * c - oy * s; y = py0 + ox * s + oy * c; }
          const core = wt.core[i];
          D[i * 2] = x + yaw * (3.2 + 5.5 * core) * hw; D[i * 2 + 1] = y + pitch * (2.2 + 3.2 * core) * hw;
        }
        local.set(D);
        /* body: breathing, shoulders, weight shift, sway about the feet */
        const sway = (st.body.sway * Math.PI) / 180, cs = Math.cos(sway), ss = Math.sin(sway);
        const br = st.body.breath * 1.6, sh = st.body.shoulders * 3, shift = st.body.shift;
        for (let j = 0; j < lists.active.length; j++) {
          const i = lists.active[j];
          const x = D[i * 2] + shift - 300, y = D[i * 2 + 1] - br * wt.breath[i] - sh * wt.shoulder[i] - 1510;
          pos[i * 2] = 300 + x * cs - y * ss; pos[i * 2 + 1] = 1510 + x * ss + y * cs;
        }
      }

      function paintInterior(st) {
        const m = st.mouth;
        ix.setTransform(MI.s, 0, 0, MI.s, -MI.x * MI.s, -MI.y * MI.s);
        ix.clearRect(MI.x, MI.y, MI.w, MI.h);
        const up = mesh.seamUpper, lo = mesh.seamLower, N = up.length;
        let maxGap = 0, mj = 0;
        for (let j = 0; j < N; j++) { const g = local[lo[j] * 2 + 1] - local[up[j] * 2 + 1]; if (g > maxGap) { maxGap = g; mj = j; } }
        if (maxGap < 0.35) return;
        const UX = (j) => local[up[j] * 2], UY = (j) => local[up[j] * 2 + 1], LX = (j) => local[lo[j] * 2], LY = (j) => local[lo[j] * 2 + 1];
        const sinU = (j) => Math.sin((Math.PI * j) / (N - 1));
        ix.beginPath();
        for (let j = 0; j < N; j++) j ? ix.lineTo(UX(j), UY(j) - 0.25) : ix.moveTo(UX(j), UY(j) - 0.25);
        for (let j = N - 1; j >= 0; j--) ix.lineTo(LX(j), LY(j) + 0.25);
        ix.closePath();
        const cx = (UX(mj) + LX(mj)) / 2, cy = (UY(mj) + LY(mj)) / 2;
        const base = ix.createRadialGradient(cx, cy - maxGap * 0.2, 0.5, cx, cy, 26);
        base.addColorStop(0, '#57232a'); base.addColorStop(0.55, '#3d1517'); base.addColorStop(1, '#2c0d0f'); // code-technical revision: red-brown, not black, so thin corners don't read as an outline
        ix.fillStyle = base; ix.fill();
        ix.save(); ix.clip();
        const open = Math.min(1, maxGap / 3.2);
        // upper teeth, shaded and fading toward the corners
        const th = (1.0 + m.teeth * 3.4) * Math.max(open, 0.35 * m.teeth); // teeth stay visible in narrow apertures
        if (m.teeth > 0.05 && th > 0.25) {
          ix.beginPath();
          for (let j = 0; j < N; j++) j ? ix.lineTo(UX(j), UY(j) - 0.5) : ix.moveTo(UX(j), UY(j) - 0.5);
          // code-technical revision 2026-10-04: warmer, less bright enamel tapering into the corners
          // (was a flat pale band reaching the corners, which read as a sticker)
          for (let j = N - 1; j >= 0; j--) ix.lineTo(UX(j), UY(j) + th * Math.pow(sinU(j), 1.9));
          ix.closePath();
          const tg = ix.createLinearGradient(0, UY(mj) - 1, 0, UY(mj) + th + 1);
          tg.addColorStop(0, `rgba(214,203,188,${0.3 + 0.5 * m.teeth})`); tg.addColorStop(0.65, `rgba(226,216,203,${0.3 + 0.5 * m.teeth})`); tg.addColorStop(1, `rgba(176,162,148,${0.25 + 0.45 * m.teeth})`);
          ix.fillStyle = tg; ix.fill();
          const tc = ix.createLinearGradient(UX(0), 0, UX(N - 1), 0);
          tc.addColorStop(0, 'rgba(40,12,12,0.55)'); tc.addColorStop(0.28, 'rgba(40,12,12,0)'); tc.addColorStop(0.72, 'rgba(40,12,12,0)'); tc.addColorStop(1, 'rgba(40,12,12,0.55)');
          ix.fillStyle = tc; ix.fill();
        }
        // lower teeth only in wider openings
        if (m.open > 0.45 && m.teeth > 0.3) {
          ix.beginPath();
          for (let j = 0; j < N; j++) j ? ix.lineTo(LX(j), LY(j) + 0.5) : ix.moveTo(LX(j), LY(j) + 0.5);
          for (let j = N - 1; j >= 0; j--) ix.lineTo(LX(j), LY(j) - 1.8 * m.teeth * Math.pow(sinU(j), 1.4));
          ix.closePath(); ix.fillStyle = 'rgba(214,204,192,0.55)'; ix.fill();
        }
        // tongue rests low; lifts toward the teeth for L (H shape)
        if (maxGap > 2.2) {
          const w = Math.abs(LX(Math.floor(N * 0.8)) - LX(Math.floor(N * 0.2)));
          const ty = LY(mj) + 2.2 - Math.min(maxGap * 0.3, 3) - m.tongue * maxGap * 0.25;
          const tgr = ix.createLinearGradient(0, ty - 4, 0, ty + 4);
          tgr.addColorStop(0, '#a5545a'); tgr.addColorStop(1, '#7c353b');
          ix.beginPath(); ix.ellipse(cx + 1, ty, w * 0.3, 2.4 + maxGap * 0.12, -0.18, 0, Math.PI * 2);
          ix.fillStyle = tgr; ix.fill();
        }
        // lip shadow over the teeth, and soft darkening into the corners
        ix.beginPath();
        for (let j = 0; j < N; j++) j ? ix.lineTo(UX(j), UY(j) - 0.5) : ix.moveTo(UX(j), UY(j) - 0.5);
        for (let j = N - 1; j >= 0; j--) ix.lineTo(UX(j), UY(j) + 2.2);
        ix.closePath();
        const ls = ix.createLinearGradient(0, UY(mj) - 0.5, 0, UY(mj) + 2.2);
        ls.addColorStop(0, 'rgba(30,6,8,0.38)'); ls.addColorStop(1, 'rgba(30,6,8,0)');
        ix.fillStyle = ls; ix.fill();
        [[UX(0), UY(0)], [UX(N - 1), UY(N - 1)]].forEach(([x, y]) => {
          const r = ix.createRadialGradient(x, y, 0, x, y, 9); r.addColorStop(0, 'rgba(30,8,9,0.42)'); r.addColorStop(1, 'rgba(18,3,4,0)');
          ix.fillStyle = r; ix.fillRect(x - 10, y - 10, 20, 20);
        });
        ix.restore();
      }

      /* Eyelids. A small lid mesh per eye samples Emilia's own painted lid skin just above the
         lash line and stretches it down over the eye to the closing edge, so tone, shading and
         crease match the artwork. Fresh lashes are drawn on the moving edge (overlay canvas).
         Fully closed hides iris and sclera; partial values lower the lid over the iris. */
      const EO = { x: 222, y: 104, w: 140, h: 70, s: 4 };
      const ec = document.createElement('canvas'); ec.width = EO.w * EO.s; ec.height = EO.h * EO.s; const ex = ec.getContext('2d');
      const texLid = tex(ec);
      const LNP = 20, LNR = 6, perEye = (LNP + 1) * (LNR + 1);
      const lidPos = new Float32Array(perEye * 2 * 2), lidUv = new Float32Array(perEye * 2 * 2), lidIdx = [];
      const lidGeom = L.eyes.map((e) => {
        const cols = [];
        const ext = e.a + 1.5;
        for (let j = 0; j <= LNP; j++) {
          const lx = -ext + (2 * ext * j) / LNP; const r = clamp(Math.abs(lx) / e.a, 0, 1);
          const topL = -e.bt * Math.pow(1 - r * r, 0.55), botL = e.bb * Math.pow(1 - r * r, 0.7);
          const band = 3 + 6.5 * Math.sqrt(1 - r * r);
          cols.push({ lx, topL, botL, srcTop: topL - 2.8 - band, srcBot: topL - 2.8 });
        }
        return cols;
      });
      L.eyes.forEach((e, k) => {
        const t = (e.tilt * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
        lidGeom[k].forEach((col, j) => {
          for (let r = 0; r <= LNR; r++) {
            const ly = lerpN(col.srcTop, col.srcBot, r / LNR);
            const idx = k * perEye + j * (LNR + 1) + r;
            lidUv[idx * 2] = (e.c[0] + col.lx * c - ly * s) / W; lidUv[idx * 2 + 1] = (e.c[1] + col.lx * s + ly * c) / H;
          }
        });
        for (let j = 0; j < LNP; j++) for (let r = 0; r < LNR; r++) {
          const a = k * perEye + j * (LNR + 1) + r, b = a + LNR + 1;
          lidIdx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      });
      const bLidPos = gl.createBuffer(), bLidUv = gl.createBuffer(), bLidIdx = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bLidUv); gl.bufferData(gl.ARRAY_BUFFER, lidUv, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bLidPos); gl.bufferData(gl.ARRAY_BUFFER, lidPos, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bLidIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lidIdx), gl.STATIC_DRAW);
      function headPoint(x, y, st) {
        const roll = (st.head.roll * Math.PI) / 180, [px0, py0] = L.headPivot;
        const ox = x - px0, oy = y - py0; const nx = px0 + ox * Math.cos(roll) - oy * Math.sin(roll), ny = py0 + ox * Math.sin(roll) + oy * Math.cos(roll);
        const core = Math.exp(-(((x - L.face[0]) / 62) ** 2) - (((y - L.face[1]) / 70) ** 2));
        return [nx + st.head.yaw * (3.2 + 5.5 * core), ny + st.head.pitch * (2.2 + 3.2 * core)];
      }
      function paintLids(st) {
        const B = clamp(st.blink + (st.lidDrop || 0), 0, 1);
        if (B < 0.04) return false;
        ex.setTransform(EO.s, 0, 0, EO.s, -EO.x * EO.s, -EO.y * EO.s);
        ex.clearRect(EO.x, EO.y, EO.w, EO.h);
        L.eyes.forEach((e, k) => {
          const t = (e.tilt * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
          const toHead = (lx, ly) => headPoint(e.c[0] + lx * c - ly * s, e.c[1] + lx * s + ly * c, st);
          const edge = [];
          lidGeom[k].forEach((col, j) => {
            const edgeY = lerpN(col.topL + 0.4, col.botL - 0.1, B);
            for (let r = 0; r <= LNR; r++) {
              const ly = lerpN(col.srcTop, edgeY, r / LNR);
              const [hx, hy] = toHead(col.lx, ly);
              const [bx, by] = bodyXform(hx, hy, st);
              const idx = k * perEye + j * (LNR + 1) + r;
              lidPos[idx * 2] = bx; lidPos[idx * 2 + 1] = by;
            }
            edge.push(toHead(col.lx, edgeY));
          });
          // lash line along the lid edge, heavier toward the outer corner; closed-lid lash flicks
          const NP = LNP, outer = k === 0 ? 0 : NP;
          ex.lineCap = 'round'; ex.lineJoin = 'round';
          ex.strokeStyle = `rgba(120,70,55,${0.22 * B})`; ex.lineWidth = 1.8;
          ex.beginPath(); edge.forEach(([x, y], j) => (j ? ex.lineTo(x, y - 1.1) : ex.moveTo(x, y - 1.1))); ex.stroke();
          for (let j = 1; j <= NP; j++) {
            const d = Math.abs((j - 0.5) - outer) / NP;
            ex.strokeStyle = `rgba(34,20,14,${0.6 + 0.35 * B})`;
            ex.lineWidth = 0.6 + (1 - d) * 1.3 * (0.45 + 0.55 * B);
            ex.beginPath(); ex.moveTo(edge[j - 1][0], edge[j - 1][1]); ex.lineTo(edge[j][0], edge[j][1]); ex.stroke();
          }
          if (B > 0.55) {
            ex.strokeStyle = `rgba(34,20,14,${Math.min(1, (B - 0.55) * 1.8)})`; ex.lineWidth = 0.55;
            const dir = outer === 0 ? -1 : 1;
            for (let q = 0; q < 6; q++) {
              const j = outer === 0 ? 1 + q * 2 : NP - 1 - q * 2; const [x, y] = edge[j];
              ex.beginPath(); ex.moveTo(x, y + 0.2); ex.quadraticCurveTo(x + dir * 1.1, y + 1.5, x + dir * (2.3 - q * 0.25), y + 2.3); ex.stroke();
            }
          }
        });
        return true;
      }
      function lerpN(a, b, t) { return a + (b - a) * t; }

      function bodyXform(x, y, st) { // same rigid body transform as the mesh, for the interior quad
        const sway = (st.body.sway * Math.PI) / 180;
        x += st.body.shift; const ox = x - 300, oy = y - 1510;
        return [300 + ox * Math.cos(sway) - oy * Math.sin(sway), 1510 + ox * Math.sin(sway) + oy * Math.cos(sway)];
      }

      function render(st) {
        st = st || state;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = Math.max(1, Math.round(rect.width * dpr)), ch = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
        deform(st);
        paintInterior(st);
        gl.viewport(0, 0, cw, ch);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform4f(uM, 2 / W, -2 / H, -1, 1);
        // interior quad, transformed rigidly like the head
        const roll = (st.head.roll * Math.PI) / 180, [hx, hy] = L.headPivot;
        const corners = [[MI.x, MI.y], [MI.x + MI.w, MI.y], [MI.x, MI.y + MI.h], [MI.x + MI.w, MI.y + MI.h]];
        corners.forEach(([x, y], k) => { // local[] already contains head rigid motion for mesh points; interior was painted in that space
          const p = bodyXform(x, y, st); qPos[k * 2] = p[0]; qPos[k * 2 + 1] = p[1];
        });
        gl.bindTexture(gl.TEXTURE_2D, texIn);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ic);
        gl.bindBuffer(gl.ARRAY_BUFFER, bQ); gl.bufferSubData(gl.ARRAY_BUFFER, 0, qPos);
        gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(aP);
        gl.bindBuffer(gl.ARRAY_BUFFER, bQuv); gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(aT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // character mesh, then the lip patch
        gl.bindTexture(gl.TEXTURE_2D, texImg);
        gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
        gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.drawElements(gl.TRIANGLES, mesh.tri.length, idxType, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx2); gl.drawElements(gl.TRIANGLES, mesh.patchTri.length, idxType, 0);
        // painted eyelids on top while blinking / lowering the lids
        if (paintLids(st)) {
          gl.bindTexture(gl.TEXTURE_2D, texImg);
          gl.bindBuffer(gl.ARRAY_BUFFER, bLidPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, lidPos);
          gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, bLidUv); gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bLidIdx); gl.drawElements(gl.TRIANGLES, lidIdx.length, gl.UNSIGNED_SHORT, 0);
          [[EO.x, EO.y], [EO.x + EO.w, EO.y], [EO.x, EO.y + EO.h], [EO.x + EO.w, EO.y + EO.h]].forEach(([x, y], k) => {
            const p = bodyXform(x, y, st); qPos[k * 2] = p[0]; qPos[k * 2 + 1] = p[1];
          });
          gl.bindTexture(gl.TEXTURE_2D, texLid);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ec);
          gl.bindBuffer(gl.ARRAY_BUFFER, bQ); gl.bufferSubData(gl.ARRAY_BUFFER, 0, qPos);
          gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, bQuv); gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
      api.render = render;
      api.ready = true;
      api.meshInfo = { vertices: n, triangles: (mesh.tri.length + mesh.patchTri.length) / 3 };
      render(state);
      if (api.onready) api.onready(api);
    }
    return api;
  }

  window.EmiliaRig = { create, LANDMARKS: L };
})();
