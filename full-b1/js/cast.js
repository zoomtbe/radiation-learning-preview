/* 2D revision: supporting people on the lesson stage (Daniel, Clara, Bram, Luc, Sofia) and Emilia's pose variants.
 *
 * - Art: Codex's delivered sheets (app/data/cast.js, generated from the character asset manifest).
 *   One pose cell is shown at a time, cut with the manifest's exact source rectangle; alpha is used as supplied.
 * - Space: the layer shares Emilia's camera transform. Units are rig-artwork pixels (Emilia's rig base is 662 x 1536,
 *   her feet at x 331, y 1524, visible height 1511), so a shot change moves everybody together like one camera.
 * - spec.x is the person's foot position in % of stage width (kept clear of the board whatever the stage size);
 *   it is converted to artwork units at every camera change. Everyone stands on Emilia's floor line (y 1524); one scale per sheet, so a
 *   pose change never resizes the head or body. Pose changes cross-fade; nobody is mirrored.
 * - Motion: a one-time entrance (fade + short walk-in), restrained breathing, pose changes on narration cues.
 *   Reduced motion: no walk-in, no breathing, instant pose changes.
 */
(function () {
  const FLOOR = 1524, EM_VIS = 1511, ART_H = 1536;
  function create(screen, emEl) {
    const D = window.CAST || { people: {} };
    const layer = document.createElement('div'); layer.className = 'cast'; layer.setAttribute('aria-hidden', 'true');
    emEl.insertAdjacentElement('afterend', layer);
    // name/role cards live in their own top layer (above the board), placed from the person's on-screen box
    const labelLayer = document.createElement('div'); labelLayer.className = 'cast-labels'; labelLayer.setAttribute('aria-hidden', 'true'); screen.appendChild(labelLayer);
    const live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); screen.appendChild(live);
    const members = {}; // who -> { el, cells: {pose: el}, pose, on, label }
    const introduced = new Set();
    let unit = 1, specs = [], emiliaPose = null, cam = { W: 1, s: 1, x: 30 };
    const docked = () => !!screen.closest('.with-dock');
    const xUnits = (m) => { if (m.rel != null) return 331 + m.rel; const pct = docked() && m.xDock != null ? m.xDock : m.xPct; return pct == null ? m.x : 331 + (((pct - cam.x) / 100) * cam.W) / (unit * cam.s); };

    function scaleOf(p) { return (EM_VIS * p.height) / p.visible; } // artwork units per sheet pixel
    function build(who) {
      const p = D.people[who]; if (!p) { console.warn('cast: unknown person', who); return null; }
      const el = document.createElement('div'); el.className = 'member off'; el.dataset.who = who;
      const body = document.createElement('div'); body.className = 'mbody'; el.appendChild(body);
      const cells = {};
      for (const [id, q] of Object.entries(p.poses)) {
        const c = document.createElement('div'); c.className = 'pose'; c.dataset.pose = id; body.appendChild(c); cells[id] = c;
      }
      const label = document.createElement('div'); label.className = 'who'; label.innerHTML = `<b>${p.name}</b>${p.role ? '<span>' + p.role + '</span>' : ''}`;
      labelLayer.appendChild(label);
      layer.appendChild(el);
      // stagger breathing so two people never breathe in sync
      body.style.animationDelay = (-Math.random() * 4).toFixed(2) + 's';
      return (members[who] = { el, body, cells, label, pose: null, on: false, x: 0, p });
    }
    function placeCells(m) {
      const k = scaleOf(m.p) * unit;
      for (const [id, c] of Object.entries(m.cells)) {
        const q = m.p.poses[id]; const [rx, ry, rw, rh] = q.rect; const [fx, fy] = q.foot;
        c.style.left = ((rx - fx) * k).toFixed(1) + 'px'; c.style.top = ((ry - fy) * k).toFixed(1) + 'px';
        c.style.width = (rw * k).toFixed(1) + 'px'; c.style.height = (rh * k).toFixed(1) + 'px';
        c.style.backgroundImage = `url("${m.p.src}")`;
        c.style.backgroundSize = `${(m.p.size[0] * k).toFixed(1)}px ${(m.p.size[1] * k).toFixed(1)}px`;
        c.style.backgroundPosition = `${(-rx * k).toFixed(1)}px ${(-ry * k).toFixed(1)}px`;
      }
      m.el.style.left = (xUnits(m) * unit).toFixed(1) + 'px'; m.el.style.top = (FLOOR * unit).toFixed(1) + 'px';
    }
    function setPose(m, pose) {
      if (!m.cells[pose]) { console.warn('cast: unknown pose', m.el.dataset.who, pose); return; }
      if (m.pose === pose) return;
      m.pose = pose;
      for (const [id, c] of Object.entries(m.cells)) c.classList.toggle('on', id === pose);
    }

    /* camera: copy Emilia's transform; unit = stage height / artwork height (pre-scale) */
    function camera(transform, W, H, s, shotX) {
      layer.style.transform = transform; layer.style.setProperty('--inv', (1 / (s || 1)).toFixed(4));
      unit = H / ART_H; cam = { W, s, x: shotX };
      layer.classList.toggle('narrow', W < 700 && H > W * 0.9); // portrait phone: Emilia is centred above the board; no room for a colleague
      Object.values(members).forEach(placeCells);
    }

    /* scene spec: [{ who, x, at, until, pose, poses: [{at, pose}], from: 'left'|'right' }] with cues already resolved */
    function setScene(list) {
      specs = list || [];
      const wanted = new Set(specs.map((s) => s.who));
      Object.entries(members).forEach(([who, m]) => { if (who !== 'emilia_poses' && !wanted.has(who) && m.on) leave(m); });
      specs.forEach((s) => { const m = members[s.who] || build(s.who); if (!m) return; s.m = m; m.from = s.from || 'right'; if (m.xPct !== s.x || m.xDock !== s.xDock || m.rel !== s.rel) { m.xPct = s.x; m.xDock = s.xDock; m.rel = s.rel; placeCells(m); } });
    }
    // name/role card: at the person's hip, horizontally centred on them, kept fully inside the stage (moved, never shrunk)
    function clampLabel(m) {
      requestAnimationFrame(() => {
        const sr = screen.getBoundingClientRect(), on = m.cells[m.pose]; if (!on) return;
        const br = on.getBoundingClientRect(); if (!br.width) return;
        const l = m.label; const lw = l.offsetWidth, lh = l.offsetHeight;
        const cx = br.left + br.width / 2 - sr.left; let left = cx - lw / 2; left = Math.max(10, Math.min(sr.width - lw - 10, left));
        let top = br.top - sr.top + br.height * 0.58; top = Math.max(10, Math.min(sr.height - lh - 10, top));
        l.style.left = left.toFixed(0) + 'px'; l.style.top = top.toFixed(0) + 'px';
      });
    }
    function enter(m) {
      m.on = true; m.el.classList.remove('off', 'from-left', 'from-right'); m.el.classList.add('in'); clampLabel(m);
      const who = m.el.dataset.who;
      if (!introduced.has(who) && m.p.role) {
        introduced.add(who); Object.values(members).forEach((o) => o.label.classList.remove('intro')); // one introduction card at a time
        m.label.classList.add('intro'); live.textContent = `${m.p.name}, ${m.p.role}.`;
        setTimeout(() => m.label.classList.remove('intro'), 4200);
      }
    }
    function leave(m) { m.on = false; m.label.classList.remove('intro'); m.el.classList.remove('in'); m.el.classList.add('off', m.from === 'left' ? 'from-left' : 'from-right'); }
    const reached = (cue, pos) => !cue || pos.p > cue.p || (pos.p === cue.p && pos.t >= cue.t);
    function update(pos) {
      for (const s of specs) {
        const m = s.m; if (!m) continue;
        const on = reached(s.at, pos) && !(s.until && reached(s.until, pos));
        let pose = s.pose; (s.poses || []).forEach((e) => { if (reached(e.cue, pos)) pose = e.pose; });
        setPose(m, pose);
        if (on && !m.on) { if (!m.el.classList.contains('in')) { m.el.classList.add(m.from === 'left' ? 'from-left' : 'from-right'); void m.el.offsetWidth; } enter(m); }
        else if (!on && m.on) leave(m);
      }
    }

    /* Emilia's pose variants: shown in place of the speaking rig only while she is silent */
    const em = () => members.emilia_poses || (build('emilia_poses') && Object.assign(members.emilia_poses, { x: 331 }));
    function setEmiliaPose(pose) {
      if (pose === emiliaPose) return; emiliaPose = pose;
      const m = em(); if (!m) return;
      if (m.x !== 331 || !m.el.style.left) { m.x = 331; placeCells(m); }
      m.el.classList.add('emilia-pose');
      if (pose) { setPose(m, pose); m.on = true; m.el.classList.remove('off'); m.el.classList.add('in'); }
      else { m.on = false; m.el.classList.remove('in'); m.el.classList.add('off'); }
      emEl.classList.toggle('posed', !!pose);
    }
    function anchorOf(who) { const m = members[who]; return m && m.on ? m.el : null; }
    return { camera, setScene, update, setEmiliaPose, anchorOf, get emiliaPose() { return emiliaPose; }, members };
  }
  window.CastStage = { create };
})();
