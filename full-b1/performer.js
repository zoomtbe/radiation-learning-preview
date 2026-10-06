/* Performer: turns the audio clock + transcript timing into Emilia's performance on the raster rig.
 * Speech channels (lips, jaw, gestures, nods, brows, sentence blinks) are pure functions of
 * audio.currentTime, so pause, seek, replay and rate changes stay synchronised; with no audio
 * playing the mouth returns to rest. Idle life (breathing, blinks, micro-saccades, weight
 * shift) runs on wall-clock time. Movement is deliberately restrained.
 */
(function () {
  'use strict';
  const VIS = window.VISEMES;
  const KEYS = ['open', 'wide', 'round', 'teeth', 'tuck', 'tongue', 'press'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function rng(seed) { let s = 7; for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---- Rhubarb cues ---- */
  const cueCache = new Map();
  function cues(id, m) {
    if (cueCache.has(id)) return cueCache.get(id);
    const raw = [];
    if (m) m.split(';').forEach((p) => { if (p) raw.push([parseFloat(p.slice(1)), p[0]]); });
    // Fable 5.1 revision: drop flicker cues shorter than 50 ms (except a closure before a rest) so the
    // mouth does not jump through shapes the eye cannot follow; the neighbouring shape carries on.
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      const nx = raw[i + 1];
      const short = nx && nx[0] - raw[i][0] < 0.05;
      if (short && i > 0 && !(raw[i][1] === 'A' && nx[1] === 'X')) continue;
      out.push(raw[i]);
    }
    cueCache.set(id, out);
    return out;
  }
  function mouthAt(list, t) {
    const out = {};
    if (!list.length) { KEYS.forEach((k) => { out[k] = 0; }); return out; }
    let lo = 0, hi = list.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (list[mid][0] <= t) lo = mid; else hi = mid - 1; }
    const cur = VIS[list[lo][1]] || VIS.X, prev = lo > 0 ? VIS[list[lo - 1][1]] : VIS.X;
    // Fable 5.1 revision: slower coarticulation (90 ms), gentler anticipation of the next shape, and a
    // soft close toward rest in the last 120 ms before an X (pause) cue so lips settle instead of snapping.
    const w = smooth((t - list[lo][0]) / 0.09);
    KEYS.forEach((k) => { out[k] = lerp(prev[k], cur[k], w); });
    const nx = list[lo + 1];
    if (nx && nx[0] - t < 0.06) { const a = (1 - (nx[0] - t) / 0.06) * (nx[1] === 'X' ? 0.6 : 0.3); const n = VIS[nx[1]]; KEYS.forEach((k) => { out[k] = lerp(out[k], n[k], a); }); }
    out.open *= 0.88;
    return out;
  }

  /* ---- gesture plan derived from the transcript (deterministic per clip) ----
   * Gestures are forearm lifts (+ = hand rises) and wrist turns, per arm.  */
  const G = {
    relax:   { L: [-9, -4], R: [-9, -4] },
    open:    { L: [5, 6], R: [5, 6] },
    offerL:  { L: [10, 10], R: [-6, -2] },
    offerR:  { L: [-6, -2], R: [10, 10] },
    weigh:   { L: [8, 8], R: [-4, -6] },
    small:   { L: [2, 4], R: [-3, 0] },
    smallR:  { L: [-3, 0], R: [3, 5] },
  };
  const NEG = /^(not|don't|doesn't|isn't|aren't|cannot|can't|won't|wouldn't|shouldn't|neither|nor|never|no)$/i;
  const SERIOUS = /(fail|abnormal|incident|accident|danger|malicious|defect|wrong|overexposure|missing|invent|outdated)/i;
  const WARM = /(welcome|hello|thank|glad|together|good|useful|that's the distinction|exactly|yes\b|that's right)/i;
  const planCache = new Map();
  function plan(id, media, opts) {
    const key = id + '|' + (opts.boardSide || '') + '|' + (opts.reveals || []).join(',');
    if (planCache.has(key)) return planCache.get(key);
    const R = rng(id);
    const w = media.w || [];
    const sentences = [];
    let s0 = 0;
    for (let i = 0; i < w.length; i++) if (/[.?!]['’"]?$/.test(w[i][0]) || i === w.length - 1) { sentences.push([s0, i]); s0 = i + 1; }
    const gestures = [], beats = [], brows = [], tilts = [], blinks = [], nods = [];
    sentences.forEach(([a, b], si) => {
      const words = w.slice(a, b + 1).map((x) => x[0]);
      const text = words.join(' ');
      const start = w[a][1], end = w[b][2];
      const q = /\?['’"]?$/.test(words[words.length - 1] || '');
      const r = R();
      let g;
      if (opts.first && si === 0 && /welcome|hello/i.test(text)) g = 'open';
      else if (q) g = r < 0.5 ? 'open' : 'offerR';
      else if (words.some((x) => NEG.test(x.replace(/[^A-Za-z']/g, '')))) g = r < 0.5 ? 'weigh' : 'small';
      else if (/\b(first|second|third|three|both|separate|different|distinct)\b/i.test(text)) g = r < 0.5 ? 'offerL' : 'offerR';
      else if (r < 0.34) g = 'relax';
      else g = ['small', 'smallR', 'offerL', 'offerR', 'open'][Math.floor(R() * 5)];
      gestures.push({ g, start: Math.max(0, start - 0.3), end: Math.min(end + 0.2, start + 6) });
      if (q) brows.push({ start: Math.max(0, end - 1.2), end: end + 0.5, raise: 0.6 });
      tilts.push({ start, end, roll: (R() - 0.5) * (q ? 4.5 : 2.6), yaw: (R() - 0.5) * 0.35, pitch: (R() - 0.5) * 0.25 });
      if (R() < 0.7) blinks.push(end + 0.1 + R() * 0.15);
      if (!q && R() < 0.45) nods.push(end - 0.25);
      for (let i = a; i <= b; i++) {
        const word = w[i][0].replace(/[^A-Za-z]/g, '');
        if ((word.length >= 8 && R() < 0.4) || /^[A-Z]{3,}$/.test(word)) beats.push({ t: w[i][1], k: 0.5 + R() * 0.5 });
        if (NEG.test(word) && R() < 0.7) brows.push({ start: w[i][1] - 0.1, end: w[i][2] + 0.5, furrow: 0.5 });
      }
    });
    gestures.sort((x, y) => x.start - y.start);
    const allText = w.map((x) => x[0]).join(' ');
    const tone = SERIOUS.test(allText) ? 'serious' : WARM.test(w.slice(0, 14).map((x) => x[0]).join(' ')) ? 'warm' : 'neutral';
    const p = { gestures, beats, brows, tilts, blinks, nods, tone, end: w.length ? w[w.length - 1][2] : 0 };
    planCache.set(key, p);
    return p;
  }

  function create(rig) {
    const R = rng('idle-' + Math.floor(Math.random() * 1e9));
    let nextBlink = 1.4, blinkStart = -1, lastNow = 0, saccade = { x: 0, y: 0, until: 0 };
    const mouth = {}; KEYS.forEach((k) => { mouth[k] = 0; });
    const arm = { L: [-9, -4], R: [-9, -4] };
    const st = rig.state;

    function frame(now, speech, ctx) {
      ctx = ctx || {};
      if (!rig.ready) return;
      const dt = Math.min(0.1, Math.max(0, now - lastNow)); lastNow = now;
      const reduced = !!ctx.reducedMotion, micro = reduced ? 0.35 : 1;
      const active = !!(speech && speech.media && (speech.playing || speech.scrub));
      let p = null, t = 0;
      if (speech && speech.media) { p = plan(speech.id, speech.media, speech); t = speech.t; }

      /* lips & jaw */
      const target = active ? mouthAt(cues(speech.id, speech.media.m), t) : VIS.X;
      KEYS.forEach((k) => { mouth[k] = active ? lerp(mouth[k], target[k], Math.min(1, dt * 30)) : lerp(mouth[k], target[k], Math.min(1, dt * 10)); });
      Object.assign(st.mouth, mouth);

      /* forearms & wrists */
      let tgt = { L: G.relax.L.slice(), R: G.relax.R.slice() };
      if (active && p) {
        for (const g of p.gestures) {
          if (t < g.start - 0.1 || t > g.end + 0.9) continue;
          const k = smooth((t - g.start) / 0.55) * (1 - smooth((t - g.end) / 0.8));
          if (k <= 0) continue;
          const pose = G[g.g];
          ['L', 'R'].forEach((s) => { tgt[s][0] = lerp(tgt[s][0], pose[s][0], k); tgt[s][1] = lerp(tgt[s][1], pose[s][1], k); });
        }
        let beat = 0;
        for (const b of p.beats) { const d = t - b.t; if (d > -0.05 && d < 0.5) beat = Math.max(beat, Math.sin(Math.PI * clamp(d / 0.5, 0, 1)) * b.k); }
        st.__beat = beat;
        tgt.R[1] += beat * 5; tgt.L[1] += beat * 3; tgt.R[0] += beat * 2;
      } else {
        st.__beat = 0;
        if (ctx.listening) tgt = { L: [-4, 0], R: [-4, 0] };
      }
      /* turn toward the board (full-B1 build): staged, rare, smoothly blended by app (ctx.turn.k 0..1).
         The board-side forearm opens in a restrained presenting gesture; the far arm stays relaxed.
         Rig limit: there is no upper-arm or torso rotation in depth, so this is head/gaze/lean + forearm. */
      const turn = ctx.turn && ctx.turn.k > 0.001 && !reduced ? ctx.turn : null;
      if (turn) {
        const near = turn.side === 'right' ? 'R' : 'L', far = near === 'R' ? 'L' : 'R';
        tgt[near][0] = lerp(tgt[near][0], 15, turn.k); tgt[near][1] = lerp(tgt[near][1], 14, turn.k);
        tgt[far][0] = lerp(tgt[far][0], G.relax[far][0], turn.k); tgt[far][1] = lerp(tgt[far][1], G.relax[far][1], turn.k);
      }
      const follow = active ? Math.min(1, dt * 9) : Math.min(1, dt * 2.5);
      ['L', 'R'].forEach((s) => { arm[s][0] = lerp(arm[s][0], tgt[s][0], follow); arm[s][1] = lerp(arm[s][1], tgt[s][1], follow); });
      // rig convention: left forearm + = up; right forearm - = up
      st.arms.L.lift = arm.L[0] + Math.sin(now * 0.9) * 0.6 * micro; st.arms.L.wrist = arm.L[1];
      st.arms.R.lift = -(arm.R[0] + Math.sin(now * 0.8 + 2) * 0.6 * micro); st.arms.R.wrist = -arm.R[1];

      /* head: slow drift + sentence tilts + nods + speech energy */
      let yaw = Math.sin(now * 0.31) * 0.08 * micro, pitch = Math.sin(now * 0.47 + 1) * 0.06 * micro, roll = Math.sin(now * 0.23) * 0.6 * micro;
      if (active && p) {
        for (const tl of p.tilts) if (t >= tl.start - 0.5 && t <= tl.end + 0.7) {
          const k = smooth((t - tl.start + 0.5) / 0.7) * (1 - smooth((t - tl.end) / 0.7));
          roll += tl.roll * k * micro; yaw += tl.yaw * k * micro; pitch += tl.pitch * k * micro;
        }
        for (const n of p.nods) { const d = (t - n) / 0.55; if (d > 0 && d < 1) pitch += Math.sin(Math.PI * d) * 0.55 * micro; }
        pitch += (st.__beat || 0) * 0.3 * micro - mouth.open * 0.15;
      }
      if (ctx.lookSide) yaw += ctx.lookSide === 'left' ? -0.35 : 0.35;
      const tk = ctx.turn ? ctx.turn.k : 0, tsign = ctx.turn && ctx.turn.side === 'left' ? -1 : 1;
      if (tk > 0.001) { yaw = lerp(yaw, 0.62 * tsign * (reduced ? 0.4 : 1), tk); pitch += 0.06 * tk; roll += 0.8 * tsign * tk * micro; }
      st.head.yaw = lerp(st.head.yaw, yaw, Math.min(1, dt * 5));
      st.head.pitch = lerp(st.head.pitch, pitch, Math.min(1, dt * 9));
      st.head.roll = lerp(st.head.roll, roll, Math.min(1, dt * 4));

      /* gaze: learner-directed with micro-saccades; glances toward the board or dock */
      if (now > saccade.until) {
        saccade = { x: (R() - 0.5) * 0.25, y: (R() - 0.5) * 0.2, until: now + 0.6 + R() * 1.8 };
        if (!active && R() < 0.15) { saccade.x = (R() < 0.5 ? -1 : 1) * 0.6; saccade.y = -0.3; saccade.until = now + 1.1; }
      }
      let gx = saccade.x, gy = saccade.y;
      if (ctx.lookSide) { gx = ctx.lookSide === 'left' ? -0.85 : 0.85; gy = 0.1; }
      if (tk > 0.001) { gx = lerp(gx, 0.9 * tsign, tk); gy = lerp(gy, 0.05, tk); }
      st.gaze.x = lerp(st.gaze.x, gx, Math.min(1, dt * 16)); st.gaze.y = lerp(st.gaze.y, gy, Math.min(1, dt * 16));

      /* brows & expression */
      let raise = 0.05, furrow = 0, worry = 0;
      if (active && p) {
        for (const b of p.brows) if (t >= b.start && t <= b.end + 0.35) { const k = smooth((t - b.start) / 0.25) * (1 - smooth((t - b.end) / 0.35)); raise += (b.raise || 0) * k; furrow += (b.furrow || 0) * k; }
        raise += (st.__beat || 0) * 0.3;
        if (p.tone === 'serious') worry += 0.15;
      }
      st.brows.l = lerp(st.brows.l, raise, Math.min(1, dt * 10)); st.brows.r = lerp(st.brows.r, raise * 1.1, Math.min(1, dt * 10));
      st.brows.furrow = lerp(st.brows.furrow, furrow, Math.min(1, dt * 8)); st.brows.worry = lerp(st.brows.worry, worry, Math.min(1, dt * 4));
      // the artwork already smiles; serious content relaxes the corners, warm moments lift them
      const sm = ctx.mood === 'correct' ? 0.5 : ctx.mood === 'retry' ? -0.4 : !p || !active ? 0 : p.tone === 'warm' ? 0.35 : p.tone === 'serious' ? -0.55 : -0.15;
      st.smile = lerp(st.smile, sm, Math.min(1, dt * 3));
      st.squint = clamp(st.smile, 0, 1) * 0.5;

      /* blinks: random (wall clock) plus at sentence ends (audio clock) */
      if (now >= nextBlink && blinkStart < 0) { blinkStart = now; nextBlink = now + 2.4 + R() * 3.8; }
      let b = 0;
      if (blinkStart >= 0) { const d = (now - blinkStart) / 0.16; b = d < 1 ? Math.sin(Math.PI * d) : 0; if (d >= 1) blinkStart = -1; }
      if (active && p) for (const bt of p.blinks) { const d = (t - bt) / 0.16; if (d > 0 && d < 1) b = Math.max(b, Math.sin(Math.PI * d)); }
      st.blink = b;
      st.lidDrop = active ? 0 : (ctx.listening ? 0.08 : 0.04);

      /* body */
      st.body.breath = Math.sin(now * Math.PI * 2 * (active ? 0.28 : 0.21)) * (reduced ? 0.4 : 1);
      st.body.sway = Math.sin(now * 0.37) * 0.25 * micro;
      st.body.shift = Math.sin(now * 0.17) * 1.6 * micro + (reduced ? 0 : 4 * tsign * tk);
      st.body.shoulders = lerp(st.body.shoulders || 0, active && p && (st.__beat || 0) > 0.6 ? 0.4 : 0, Math.min(1, dt * 4));
      rig.render(st);
    }
    return { frame };
  }

  window.Performer = { create, plan, cues, mouthAt };
})();
