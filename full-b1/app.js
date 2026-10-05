/* Radiation / In Context — B1 learner application (local, no network, no telemetry).
 * Full-B1 build 2026-10-05: six lessons. The lesson is chosen from ?l=<id> (or the last lesson used on
 * this device); switching lessons navigates, so each lesson's timeline is built fresh and no other
 * lesson's audio is loaded. Review links: ?l=<id>&s=<scene>&p=<paragraph>&t=<seconds>#lesson */
(function () {
  'use strict';
  const C = window.B1_CONTENT, M = window.B1_MEDIA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = window.Boards.esc;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const norm = (w) => String(w).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]/g, '');
  const ACTIVE = C.active || ['B1.1'];
  const KEY = 'ric.b1.progress.v1'; // kept: existing B1.1 progress on this device stays valid
  const params = new URLSearchParams(location.search);
  const lastUsed = (() => { try { return (JSON.parse(localStorage.getItem(KEY) || '{}') || {}).current; } catch (e) { return null; } })();
  const playable = (id) => ACTIVE.includes(id) && C.lessons.some((l) => l.id === id && !l.parked);
  const lesson = C.lessons.find((l) => l.id === [params.get('l'), lastUsed, ACTIVE[0]].find(playable));
  const lessonNo = C.lessons.indexOf(lesson) + 1;
  const deepLink = params.get('s') ? { scene: params.get('s'), type: params.get('step') || 'para', key: params.get('item'), p: +(params.get('p') || 1), t: Math.max(0, +(params.get('t') || 0) || 0) } : null;
  const lessonUrl = (id, extra) => '?' + new URLSearchParams(Object.assign({ l: id }, extra || {})).toString() + '#lesson';

  // Genuine photographs. Nothing from this registry is written on stage; attribution, licence and
  // change notices appear in the Sources and credits view (required by the CC licences).
  const PHOTOS = {
    'photo-weld': { src: 'welded-pipe-tewebs-detail.jpg', title: 'Bended Welded Pipe', author: 'TeWeBs', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', sourcePage: 'https://commons.wikimedia.org/wiki/File:Bended_Welded_Pipe.JPG', credit: '“Bended Welded Pipe” by TeWeBs, Wikimedia Commons, CC BY-SA 4.0', changes: 'Cropped to the weld detail and resized; the adaptation is shared under the same licence.', note: 'A welded pipe joint photographed in Germany. It illustrates the kind of object inspected in the lesson’s example; it is not a Belgian site and the photograph does not show that this pipe was radiographed or needed radiography.' },
    'photo-industrial-context': { src: 'refinery-tanks-carl-young-1800.jpg', title: 'Refinery Tanks 2', author: 'Carl Young', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', sourcePage: 'https://commons.wikimedia.org/wiki/File:Refinery_Tanks_2.jpg', credit: '“Refinery Tanks 2” by Carl Young, Wikimedia Commons, CC BY-SA 4.0', changes: 'Resized to 1800 px; the adaptation is shared under the same licence.', note: 'An industrial setting photographed in the United States, used as an opening view only. It is not a Belgian site, not a radiation workplace and not a company in this course.' },
  };
  const ILLUSTRATIONS = [
    'Emilia is an original illustrated character: original artwork animated by a mesh-deformation rig. She does not depict a real person.',
    'The industrial radiographer in the roles picture is an original animated-style illustration prepared for this course on 4 October 2026. It does not depict a real person, and the figure’s appearance is not evidence of any qualification.',
    'Equipment picture: three original drawings (a gamma projector with guide tube, collimator and remote winder; a portable directional X-ray generator with its control unit; a digital detector panel with a display). They are illustrations, not photographs, and represent no manufacturer, model or settings.',
    'Teaching studio background: original synthetic illustration, not a photograph of a real facility. Course overview, roles picture, principle panels, planning boards, limit diagram, folders, sketch and other diagrams: original illustrations for this course.',
    'Voice: Microsoft neural voice “Sonia” (en-GB, synthetic), rate −4%. Lip movement from Rhubarb Lip Sync cues generated locally from the audio.',
    'The client, site and worksite situations and the colleagues mentioned in these lessons are training examples; they do not describe a real company, client, person or incident.',
  ];

  /* ---------------- storage (anonymous, this device only) ---------------- */
  const store = (() => {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }
    data.lessons = data.lessons || {}; data.settings = Object.assign({ captions: true, capLarge: false, motion: 'auto', rate: 1, volume: 1, muted: false }, data.settings || {});
    data.review = data.review || {};
    const blank = () => ({ idx: 0, t: 0, heard: {}, answers: {}, explored: {}, reflections: {}, activities: {}, notes: '', ended: false, started: false });
    const L = (id) => {
      const k = id || lesson.id;
      if (!data.lessons[k] || typeof data.lessons[k] !== 'object' || Array.isArray(data.lessons[k])) data.lessons[k] = blank();
      const rec = data.lessons[k];
      // Keep the same object: interaction checks must not detach a caller's
      // current record before it saves scalar fields such as started/ended.
      for (const [key, value] of Object.entries(blank())) if (rec[key] == null) rec[key] = value;
      return rec;
    };
    data.current = lesson.id;
    return {
      data, L,
      peek: (id) => data.lessons[id] || null,
      save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable: progress stays in memory */ } },
      reset() { delete data.lessons[lesson.id]; this.save(); },
    };
  })();
  const S = store.data.settings;
  store.save();

  /* ---------------- lesson model ---------------- */
  const sceneById = {}; lesson.scenes.forEach((s) => { sceneById[s.id] = s; });
  const actById = {}; (C.activities || []).forEach((a) => { actById[a.id] = a; });
  function buildSteps(withActivities) {
    const out = [], chs = [];
    lesson.sequences.forEach((seq, ci) => {
      const first = out.length;
      seq.forEach((sid) => {
        const sc = sceneById[sid];
        sc.paras.forEach((p, pi) => out.push({ type: 'para', scene: sid, p: pi + 1, clip: p.clip, text: p.text, chapter: ci }));
        if (sc.interaction) out.push({ type: 'interaction', scene: sid, chapter: ci, it: sc.interaction });
        if (withActivities) (sc.activities || []).forEach((id) => out.push({ type: 'activity', scene: sid, chapter: ci, act: actById[id] }));
      });
      const last = out[out.length - 1];
      if (ci === lesson.sequences.length - 1) out.push({ type: 'lessonEnd', scene: last.scene, chapter: ci });
      else if (last.type === 'para') out.push({ type: 'chapterEnd', scene: last.scene, chapter: ci });
      chs.push({ index: ci, first, scenes: seq, title: sceneById[seq[0]].title });
    });
    return { out, chs };
  }
  const built = buildSteps(true);
  const steps = built.out, chapters = built.chs;
  // stable positions: progress is saved as scene/type/paragraph so new activity steps never shift a bookmark
  const posOf = (i) => { const s = steps[i]; return { scene: s.scene, type: s.type, p: s.p || 0, act: s.act ? s.act.id : '' }; };
  const findPos = (pos) => steps.findIndex((s) => s.scene === pos.scene && s.type === pos.type && (s.p || 0) === (pos.p || 0) && (s.act ? s.act.id : '') === (pos.act || ''));
  function resumeIndex(L) {
    if (L.pos) { const i = findPos(L.pos); if (i >= 0) return i; }
    if (!L.pos && L.idx > 0) { // legacy v1 bookmark: an index into the timeline without activity steps
      const old = buildSteps(false).out[L.idx];
      if (old) { const i = findPos({ scene: old.scene, type: old.type, p: old.p || 0, act: '' }); if (i >= 0) return i; }
    }
    return clamp(L.idx || 0, 0, steps.length - 1);
  }
  const dur = (clip) => (M[clip] ? M[clip].d : 0);
  function runOf(i) {
    let a = i, b = i;
    if (steps[i].type !== 'para') return null;
    while (a > 0 && steps[a - 1].type === 'para') a--;
    while (b < steps.length - 1 && steps[b + 1].type === 'para') b++;
    const parts = []; let tot = 0;
    for (let k = a; k <= b; k++) { parts.push({ k, start: tot, d: dur(steps[k].clip) }); tot += dur(steps[k].clip); }
    return { a, b, parts, total: tot };
  }

  /* cue resolution: 'p2', 'p2:word', 'p2:word#2', 'p2+40%', 'end' */
  function resolveCue(sc, cue) {
    if (!cue) return null;
    if (cue === 'end') return { p: 99, t: 0 };
    const m = /^p(\d+)(?::([^#+]+))?(?:#(\d+))?(?:\+(\d+)%)?$/.exec(cue.trim());
    if (!m) { console.warn('Bad cue', cue); return { p: 0, t: 0 }; }
    const p = +m[1]; const para = sc.paras[p - 1];
    if (!para) { console.warn('Cue paragraph missing', sc.id, cue); return { p, t: 0 }; }
    const md = M[para.clip];
    let t = 0;
    if (m[2] && md) {
      const want = norm(m[2]); let nth = +(m[3] || 1); let found = false;
      for (const w of md.w) { if (norm(w[0]).startsWith(want) && --nth === 0) { t = w[1]; found = true; break; } }
      if (!found) console.warn('Cue word not found', sc.id, cue);
    } else if (m[4] && md) t = (md.d * +m[4]) / 100;
    return { p, t: Math.max(0, t - 0.05) };
  }
  const reached = (cue, pos) => !cue || pos.p > cue.p || (pos.p === cue.p && pos.t >= cue.t);

  /* ---------------- DOM ---------------- */
  const app = $('#app'), audio = $('#audio'), screen = $('#screen'), envEl = $('#env'), board = $('#board'), dock = $('#dock');
  const emEl = $('#emilia'), capBox = $('#captions'), capText = $('#capText'), overlay = $('#overlay');
  const announcer = $('#announcer');
  const announce = (msg) => { announcer.textContent = ''; setTimeout(() => { announcer.textContent = msg; }, 30); };

  /* ---------------- environment ---------------- */
  envEl.innerHTML = '<div class="plate studio"></div><div class="plate refinery off"></div>';
  const plates = { studio: $('.plate.studio', envEl), refinery: $('.plate.refinery', envEl) };
  const VIEWS = { wide: 'scale(1.0)', left: 'scale(1.22) translate(9%, 2%)', right: 'scale(1.16) translate(-6%, 1%)', soft: 'scale(1.08)', close: 'scale(1.32) translate(2%, 4%)' };
  let envState = '';
  function setEnv(env, view) {
    const key = env + '|' + view; if (key === envState) return; envState = key;
    Object.entries(plates).forEach(([k, el]) => el.classList.toggle('off', k !== env));
    plates.studio.style.transform = VIEWS[view] || VIEWS.wide;
    plates.studio.classList.toggle('soft', view === 'soft');
    plates.refinery.style.transform = env === 'refinery' ? 'scale(1.06)' : 'scale(1.0)';
  }

  /* ---------------- Emilia ---------------- */
  const rig = window.EmiliaRig.create(emEl);
  const perf = window.Performer.create(rig);
  const namecard = document.createElement('div'); namecard.className = 'namecard off'; screen.appendChild(namecard);
  const refTab = document.createElement('button'); refTab.type = 'button'; refTab.className = 'ref-tab'; refTab.hidden = true;
  refTab.innerHTML = '<span aria-hidden="true">≣</span> Reference'; refTab.setAttribute('aria-haspopup', 'dialog');
  refTab.addEventListener('click', () => openDrawer('panel', refTab)); screen.appendChild(refTab);
  const pendingNote = document.createElement('div'); pendingNote.className = 'pending-note off'; pendingNote.setAttribute('role', 'status'); pendingNote.textContent = 'Narration for this text is being regenerated — captions show the new wording.'; screen.appendChild(pendingNote);
  // shot: fraction of stage height for the full 1536px artwork, top offset (stage %), centre x (stage %)
  const SHOTS = { medium: { h: 2.02, top: 0.5 }, mcu: { h: 2.6, top: 0.8 }, three: { h: 1.5, top: 2.5 }, small: { h: 1.22, top: 9 }, full: { h: 0.98, top: 1 } };
  let shotKey = '', boardVisible = false;
  function setShot(shot, force) {
    const key = shot.s + '|' + shot.x + '|' + boardVisible; if (key === shotKey && !force) return; shotKey = key;
    const W = screen.clientWidth, H = screen.clientHeight; if (!W) return;
    const narrow = W < 700 && H > W * 0.9; // portrait narrow stage only (landscape phones keep 16:9)
    let sh = SHOTS[shot.s] || SHOTS.medium, x = shot.x;
    if (narrow) { sh = boardVisible ? { h: 1.5, top: 54 } : { h: 1.9, top: 22 }; x = 50; }
    const baseH = H, baseW = H * 649 / 1536; const s = sh.h;
    const tx = (x / 100) * W - (baseW * s) / 2, ty = (sh.top / 100) * H;
    emEl.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s})`;
  }

  /* ---------------- stage: scene composition + cues ---------------- */
  let stageScene = null, cueEls = [], sceneCues = null;
  function setScene(sid) {
    if (stageScene === sid) return;
    stageScene = sid;
    const sc = sceneById[sid]; const d = sc.stage || {};
    refTab.hidden = !sc.refpanel; if (sc.refpanel) refTab.setAttribute('aria-label', 'Reference: ' + sc.refpanel.title);
    // board: cross-fade old pane out, new pane in
    $$('.bpane', board).forEach((old) => { old.classList.add('leave'); setTimeout(() => old.remove(), 700); });
    if (d.board) {
      const pane = document.createElement('div');
      pane.className = 'bpane enter r-' + (d.board.region || 'right');
      pane.innerHTML = window.Boards.render(d.board, sc, { photos: PHOTOS });
      board.appendChild(pane);
      pane.addEventListener('scroll', updateMore, { passive: true });
      requestAnimationFrame(() => requestAnimationFrame(() => pane.classList.remove('enter')));
      cueEls = [];
      $$('[data-at],[data-until],[data-focus],[data-leave]', pane).forEach((el) => {
        const f = el.getAttribute('data-focus');
        let focus = null;
        if (f) { const [a, b] = f.split('->'); focus = [resolveCue(sc, a), resolveCue(sc, b)]; }
        cueEls.push({ el, at: resolveCue(sc, el.getAttribute('data-at')), until: resolveCue(sc, el.getAttribute('data-until')), focus, leave: resolveCue(sc, el.getAttribute('data-leave')) });
      });
      wireBoard(pane, sc);
    } else cueEls = [];
    sceneCues = {
      envAt: (d.envAt || []).map((e) => Object.assign({}, e, { cue: resolveCue(sc, e.at) })),
      shots: (d.shots || []).map((e) => Object.assign({}, e, { cue: resolveCue(sc, e.at) })),
      emiliaAt: resolveCue(sc, d.emiliaAt),
      turns: (d.turns || []).map((e) => ({ cue: resolveCue(sc, e.at), dur: e.dur || 2.6, side: e.side || ((d.board && d.board.region === 'left') ? 'left' : 'right') })),
      name: d.namecard ? { at: resolveCue(sc, d.namecard.at), until: resolveCue(sc, d.namecard.until) } : null,
      d,
    };
    if (d.namecard) namecard.innerHTML = `<b>${esc(d.namecard.name)}</b>${esc(d.namecard.line)}`;
    updateStage({ p: 0, t: 0 });
    requestAnimationFrame(updateMore);
  }
  function updateStage(pos) {
    if (!sceneCues) return;
    const d = sceneCues.d;
    let env = d.env || 'studio', view = d.view || 'wide';
    sceneCues.envAt.forEach((e) => { if (reached(e.cue, pos)) { env = e.env; view = e.view || view; } });
    setEnv(env, view);
    boardVisible = !!$('.bpane:not(.leave)', board) && (cueEls.length === 0 || cueEls.some((c) => !c.el.classList.contains('cue-off')));
    let shot = d.shot || { s: 'medium', x: 30 };
    sceneCues.shots.forEach((e) => { if (reached(e.cue, pos)) shot = { s: e.s, x: e.x }; });
    setShot(shot);
    emEl.classList.toggle('hidden', !!sceneCues.emiliaAt && !reached(sceneCues.emiliaAt, pos));
    if (sceneCues.name) namecard.classList.toggle('off', !(reached(sceneCues.name.at, pos) && !(sceneCues.name.until && reached(sceneCues.name.until, pos))));
    else namecard.classList.add('off');
    let revealed = null, changed = false;
    for (const c of cueEls) {
      const on = reached(c.at, pos) && !(c.until && reached(c.until, pos));
      const wasOff = c.el.classList.contains('cue-off'), off = !on && !c.leave;
      if (wasOff !== off) { changed = true; if (!off) revealed = c.el; }
      c.el.classList.toggle('cue-off', off);
      if (c.leave) c.el.classList.toggle('moved', reached(c.leave, pos));
      if (c.focus) c.el.classList.toggle('cue-focus', reached(c.focus[0], pos) && !reached(c.focus[1], pos));
    }
    if (revealed) requestAnimationFrame(() => keepInPane(revealed));
    else if (changed) requestAnimationFrame(updateMore);
  }
  /* Narrow stages: a board taller than its pane scrolls inside the pane. Newly revealed items are
   * scrolled into view (within the pane only, never the page) and a "More below" chip shows the rest. */
  const moreChip = document.createElement('button');
  moreChip.type = 'button'; moreChip.className = 'more-chip'; moreChip.tabIndex = -1; moreChip.setAttribute('aria-hidden', 'true');
  moreChip.innerHTML = 'More below <span aria-hidden="true">↓</span>';
  moreChip.addEventListener('click', () => { const pane = activePane(); if (pane) pane.scrollBy({ top: pane.clientHeight * 0.7, behavior: 'smooth' }); });
  screen.appendChild(moreChip);
  const activePane = () => $('.bpane:not(.leave)', board);
  function keepInPane(el) {
    const pane = activePane();
    if (pane && pane.contains(el) && getComputedStyle(pane).overflowY === 'auto' && pane.scrollHeight > pane.clientHeight + 2) {
      const pr = pane.getBoundingClientRect(), er = el.getBoundingClientRect();
      const reduce = app.classList.contains('rm');
      if (er.bottom > pr.bottom - 24) pane.scrollTo({ top: pane.scrollTop + Math.min(er.bottom - pr.bottom + 32, er.top - pr.top - 8), behavior: reduce ? 'auto' : 'smooth' });
      else if (er.top < pr.top) pane.scrollTo({ top: pane.scrollTop + er.top - pr.top - 8, behavior: reduce ? 'auto' : 'smooth' });
    }
    updateMore();
  }
  function updateMore() {
    const pane = activePane();
    const scrollable = !!pane && getComputedStyle(pane).overflowY === 'auto' && pane.scrollHeight > pane.clientHeight + 2;
    const below = scrollable && pane.scrollTop + pane.clientHeight < pane.scrollHeight - 6;
    const above = scrollable && pane.scrollTop > 6;
    if (pane) {
      pane.classList.toggle('more-below', below); pane.classList.toggle('more-above', above);
      if (scrollable) { pane.tabIndex = 0; pane.setAttribute('role', 'region'); pane.setAttribute('aria-label', 'Lesson picture (scrollable)'); }
      else { pane.removeAttribute('tabindex'); pane.removeAttribute('role'); pane.removeAttribute('aria-label'); }
    }
    screen.classList.toggle('has-more', below);
  }
  function wireBoard(pane, sc) {
    $$('[data-seek]', pane).forEach((el) => {
      const go = () => { const cue = resolveCue(sc, el.getAttribute('data-seek')); $$('.selected', pane).forEach((x) => x.classList.remove('selected')); el.classList.add('selected'); jumpTo(sc.id, cue.p, cue.t, true); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    $$('.replay-cue', pane).forEach((el) => el.addEventListener('click', () => { const cue = resolveCue(sc, el.getAttribute('data-cue')); jumpTo(sc.id, cue.p, cue.t, true); }));
    $$('[data-drawer]', pane).forEach((el) => el.addEventListener('click', () => openDrawer(el.getAttribute('data-drawer'), el)));
    $$('.folder', pane).forEach((el) => el.addEventListener('click', () => { if (activity && activity.openItem) activity.openItem(el.getAttribute('data-item')); }));
  }

  /* ---------------- audio / timeline ---------------- */
  const P = { idx: 0, playing: false, mode: 'idle', clip: null, gapTimer: null, aside: null, started: false, scrubUntil: 0 };
  let activity = null; // current dock activity controller
  audio.volume = S.volume; audio.muted = S.muted; audio.playbackRate = S.rate;
  const isPending = (clip) => !!(M[clip] && M[clip].pending);
  function loadClip(clip) {
    if (P.clip !== clip) { P.clip = clip; audio.src = isPending(clip) && M[clip].src ? M[clip].src : '' + clip + '.mp3'; }
    pendingNote.classList.toggle('off', !isPending(clip));
  }
  function clearGap() { if (P.gapTimer) { clearTimeout(P.gapTimer); P.gapTimer = null; } }
  function stopAside() { if (P.aside) { P.aside = null; } }
  function playAudio() {
    const pr = audio.play();
    if (pr && pr.catch) pr.catch((err) => {
      if (err && err.name === 'AbortError') return; // superseded by a newer clip load: expected during navigation
      console.warn('Playback blocked until a user action', err && err.name); P.playing = false; reflectPlay();
    });
  }

  function goto(i, t0, autoplay) {
    clearGap(); stopAside();
    i = clamp(i, 0, steps.length - 1);
    const st = steps[i];
    const prevIdx = P.idx; P.idx = i;
    const L = store.L(); L.idx = i; L.pos = posOf(i); L.t = t0 || 0; store.save();
    setScene(st.scene);
    hideOverlay();
    if (st.type === 'para') {
      P.mode = 'narration';
      closeDock();
      loadClip(st.clip);
      const seekTo = () => { try { audio.currentTime = t0 || 0; } catch (e) { /* metadata pending */ } };
      if (audio.readyState >= 1) seekTo(); else audio.addEventListener('loadedmetadata', seekTo, { once: true });
      P.playing = !!autoplay;
      if (autoplay) playAudio(); else audio.pause();
      updateStage({ p: st.p, t: t0 || 0 });
    } else {
      audio.pause(); P.playing = false; P.mode = 'idle';
      updateStage({ p: 99, t: 0 });
      if (st.type === 'interaction') openActivity(st, autoplay);
      else if (st.type === 'activity') openProductionActivity(st);
      else if (st.type === 'chapterEnd') showChapterEnd(st);
      else if (st.type === 'lessonEnd') showLessonEnd();
    }
    reflectPlay(); renderChapters(); markTranscript();
    if (prevIdx !== i) renderSeekMarks();
  }
  function jumpTo(sid, p, t, autoplay) {
    const i = steps.findIndex((s) => s.type === 'para' && s.scene === sid && s.p === p);
    if (i >= 0) goto(i, t || 0, autoplay);
  }
  audio.addEventListener('ended', () => {
    if (P.aside) { const a = P.aside; P.aside = null; P.mode = 'idle'; reflectPlay(); if (a.onend) a.onend(); return; }
    const st = steps[P.idx];
    if (st.type !== 'para') return;
    const L = store.L(); L.heard[st.clip] = true; store.save();
    if (!P.playing) return;
    const next = steps[P.idx + 1];
    const gap = next && next.scene !== st.scene ? 900 : 550;
    P.gapTimer = setTimeout(() => { P.gapTimer = null; goto(P.idx + 1, 0, true); }, gap);
  });
  audio.addEventListener('error', () => { console.error('Audio failed to load: ' + audio.src); announce('This audio clip could not be loaded. The text remains available in the transcript.'); });

  function playAside(clip, opts) {
    // prompts, answer explanations and folder notes: same voice, never overlapping narration
    clearGap();
    audio.pause();
    P.playing = false; P.mode = 'aside'; P.aside = Object.assign({ clip }, opts || {});
    loadClip(clip);
    const start = () => { try { audio.currentTime = 0; } catch (e) { /* noop */ } playAudio(); };
    if (audio.readyState >= 1 && audio.src.endsWith(clip + '.mp3')) start(); else audio.addEventListener('loadedmetadata', start, { once: true });
    reflectPlay();
  }
  function togglePlay() {
    if (!P.started) { beginLesson(); return; }
    const st = steps[P.idx];
    if (P.mode === 'aside') { if (audio.paused) playAudio(); else audio.pause(); reflectPlay(); return; }
    if (st.type !== 'para') { if (st.type === 'chapterEnd') goto(P.idx + 1, 0, true); return; }
    if (P.playing) { P.playing = false; clearGap(); audio.pause(); }
    else { P.playing = true; if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.05)) goto(P.idx + 1, 0, true); else playAudio(); }
    reflectPlay();
  }
  function reflectPlay() {
    const isPlaying = !audio.paused && !audio.ended;
    app.classList.toggle('playing', isPlaying || (P.playing && !!P.gapTimer));
    $('#btnPlay').setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }
  audio.addEventListener('play', reflectPlay); audio.addEventListener('pause', reflectPlay);
  function stepPara(dir) {
    let i = P.idx + dir;
    while (i >= 0 && i < steps.length && steps[i].type !== 'para' && dir < 0) i += dir;
    if (i < 0) i = 0;
    goto(i, 0, P.playing || dir > 0 && steps[i] && steps[i].type === 'para' && P.playing);
  }

  /* seek bar spans the current continuous run of narration */
  const seek = $('#seek'), timeEl = $('#time');
  let seeking = false;
  function runPosition() {
    const st = steps[P.idx];
    const r = st.type === 'para' ? runOf(P.idx) : null;
    if (!r) return null;
    const part = r.parts.find((x) => x.k === P.idx);
    const cur = P.mode === 'narration' ? (audio.currentTime || 0) : 0;
    return { r, t: part.start + Math.min(cur, part.d) };
  }
  function renderSeekMarks() {
    const m = $('#seekMarks'); m.innerHTML = '';
    const pos = runPosition(); if (!pos) return;
    pos.r.parts.slice(1).forEach((p) => { const i = document.createElement('i'); i.style.left = (100 * p.start / pos.r.total) + '%'; m.appendChild(i); });
  }
  seek.addEventListener('input', () => {
    seeking = true;
    const pos = runPosition(); if (!pos) return;
    const t = (seek.value / 1000) * pos.r.total;
    const part = pos.r.parts.slice().reverse().find((p) => p.start <= t) || pos.r.parts[0];
    if (part.k !== P.idx) goto(part.k, t - part.start, P.playing);
    else { try { audio.currentTime = t - part.start; } catch (e) { /* noop */ } }
    P.scrubUntil = performance.now() + 250;
  });
  seek.addEventListener('change', () => { seeking = false; });

  /* ---------------- captions ---------------- */
  function captionAt(clip, t) {
    const md = M[clip]; if (!md) return '';
    for (const [a, b] of md.c) {
      const s = md.w[a][1] - 0.08, e = md.w[b][2] + 0.5;
      if (t >= s && t <= e) return md.w.slice(a, b + 1).map((w) => w[0]).reduce((acc, w) => acc + (acc && !/[—]$/.test(acc) ? ' ' : '') + w, ''); // no space after an em dash
    }
    return '';
  }

  /* staged turns toward the board: ease in 0.7 s, hold, ease out 0.8 s; never on the narrow phone stage */
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  function turnAt(st, t, speaking) {
    if (!sceneCues || !sceneCues.turns.length || st.type !== 'para' || P.mode !== 'narration' || !speaking) return null;
    if (screen.clientWidth < 700 && screen.clientHeight > screen.clientWidth * 0.9) return null;
    for (const tr of sceneCues.turns) {
      if (!tr.cue || tr.cue.p !== st.p) continue;
      const d = t - tr.cue.t;
      if (d >= 0 && d <= tr.dur + 0.8) return { side: tr.side, k: ease(d / 0.7) * (1 - ease((d - tr.dur) / 0.8)) };
    }
    return null;
  }
  const CAPTURE = { on: false };
  /* ---------------- render loop ---------------- */
  let lastSave = 0;
  function frame(nowMs) {
    const now = nowMs / 1000;
    const st = steps[P.idx];
    const audible = P.clip && (P.mode === 'narration' || P.mode === 'aside');
    const t = audio.currentTime || 0;
    // capture mode (QA only): frames rendered at exact audio times while paused, for review videos
    const speaking = audible && ((!audio.paused && !audio.ended) || CAPTURE.on);
    const scrub = performance.now() < P.scrubUntil;
    const speech = audible ? { id: P.clip, media: M[P.clip], t, playing: speaking, scrub, first: st.scene === 'S01' && st.p === 1 } : null;
    const ctx = { reducedMotion: reduced(), listening: st.type === 'interaction' && !speaking, mood: P.aside && P.aside.mood, lookSide: null, turn: turnAt(st, t, speaking) };
    if (st.type === 'para' && P.mode === 'narration') updateStage({ p: st.p, t });
    perf.frame(now, speech, ctx);
    if (homeRig && homePerf && app.dataset.view === 'home') homePerf.frame(now, null, { reducedMotion: reduced() });
    // captions
    const cap = S.captions && audible && (speaking || audio.currentTime > 0) ? captionAt(P.clip, t) : '';
    if (capText.textContent !== cap) capText.textContent = cap;
    capBox.classList.toggle('off', !S.captions);
    // seek
    const pos = runPosition();
    if (pos && !seeking) {
      seek.value = Math.round(1000 * pos.t / Math.max(0.01, pos.r.total));
      timeEl.textContent = fmt(pos.t) + ' / ' + fmt(pos.r.total);
      seek.setAttribute('aria-valuetext', fmt(pos.t) + ' of ' + fmt(pos.r.total));
      seek.disabled = false;
    } else if (!pos) { seek.disabled = true; timeEl.textContent = P.mode === 'aside' ? fmt(t) + ' / ' + fmt(dur(P.clip)) : '—'; }
    // Do not overwrite an existing bookmark while the learner is still on
    // the home/start screen or while the selected clip is loading.
    if (P.started && P.mode === 'narration' && audio.readyState >= 1 && now - lastSave > 4 && st.type === 'para') { lastSave = now; const L = store.L(); L.idx = P.idx; L.pos = posOf(P.idx); L.t = t; store.save(); }
    requestAnimationFrame(frame);
  }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => S.motion === 'on' || (S.motion === 'auto' && mq.matches);
  function applyMotion() { app.classList.toggle('rm', reduced()); }

  /* ---------------- overlays ---------------- */
  function hideOverlay() { overlay.hidden = true; overlay.innerHTML = ''; overlay.className = 'overlay'; }
  function showOverlay(html, full) {
    overlay.className = 'overlay' + (full ? ' full' : ''); overlay.innerHTML = `<div class="ov-card" role="region" aria-label="Lesson message">${html}</div>`; overlay.hidden = false;
    const b = $('.btn', overlay); if (b) setTimeout(() => b.focus(), 60);
  }
  function showStart() {
    const L = store.L();
    const ri = resumeIndex(L);
    const resumable = L.started && ri > 0 && steps[ri];
    const dl = deepLink && sceneById[deepLink.scene] ? deepLink : null;
    const targetIdx = dl ? steps.findIndex((s) => s.scene === dl.scene && s.type === dl.type && (s.type === 'para' ? s.p === dl.p : !dl.key || (s.it || s.act || {}).id === dl.key)) : -1;
    const dlIdx = targetIdx >= 0 ? targetIdx : dl ? Math.max(0, steps.findIndex((s) => s.scene === dl.scene && s.type === 'para')) : -1;
    const firstScene = lesson.sequences[0][0];
    setScene(dl ? dl.scene : firstScene); updateStage({ p: 0, t: 0 }); emEl.classList.add('hidden');
    const intro = lessonNo === 1
      ? 'Your guide is Emilia, head of a physical control service. Together, you will explore how radiation protection fits into everyday industrial work in Belgium.'
      : 'Emilia, head of the physical control service, continues as your guide.';
    const primary = dl
      ? `<button class="btn" data-ov="link">▶ Play from: ${esc(sceneById[dl.scene].title)}${dl.t ? ' (' + fmt(dl.t) + ')' : ''}</button><button class="btn ghost" data-ov="restart">Start from the beginning</button>`
      : resumable ? `<button class="btn" data-ov="resume">Resume: ${esc(sceneById[steps[ri].scene].title)}</button><button class="btn ghost" data-ov="restart">Start from the beginning</button>`
        : `<button class="btn" data-ov="start">▶ Start the lesson</button>`;
    showOverlay(`<p class="kicker">Lesson ${lessonNo} of ${C.lessons.length}</p><h2>${esc(lesson.learnerTitle || lesson.title)}</h2>
      <p>${intro}</p>
      <p class="meta">Turn on your sound or follow the captions. Emilia's explanation continues at a relaxed pace and pauses for activities. You can pause, replay or return to a chapter whenever you need.</p>
      <div class="row">${primary}</div>`, false);
    overlay.querySelectorAll('[data-ov]').forEach((b) => b.addEventListener('click', () => {
      const k = b.getAttribute('data-ov');
      P.started = true; L.started = true; store.save();
      if (k === 'link') { history.replaceState(null, '', lessonUrl(lesson.id)); goto(dlIdx, steps[dlIdx].type === 'para' ? dl.t : 0, steps[dlIdx].type === 'para'); }
      else if (k === 'resume') goto(ri, L.t || 0, steps[ri].type === 'para'); else goto(0, 0, true);
    }));
  }
  function beginLesson() { P.started = true; store.L().started = true; store.save(); goto(0, 0, true); }
  function chapterDone(ci) {
    const L = store.L();
    return L && steps.every((s) => s.chapter !== ci || stepDone(s));
  }
  function interactionDone(it) {
    const L = store.L();
    if (it.type === 'single_choice') return !!(L.answers[it.id] && L.answers[it.id].tried.length);
    if (it.type === 'guided_exploration') return (L.explored[it.id] || []).length >= it.items.length;
    return true; // ungraded reflection is optional by design
  }
  const activityDone = (a) => !!(store.L().activities[a.id] && store.L().activities[a.id].checked);
  const stepDone = (s) => (s.type === 'para' ? store.L().heard[s.clip] : s.type === 'interaction' ? interactionDone(s.it) : true); // production practice is optional
  function showChapterEnd(st) {
    const next = chapters[st.chapter + 1];
    showOverlay(`<p class="kicker">Chapter ${st.chapter + 1} of ${chapters.length} complete</p><h2>Next: ${esc(next.title)}</h2>
      <p>Take a short break if you like. Your place is saved on this device.</p>
      <div class="row"><button class="btn" data-ov="next">Continue</button><button class="btn ghost" data-ov="again">Replay this chapter</button></div>`, true);
    $('[data-ov="next"]', overlay).addEventListener('click', () => goto(P.idx + 1, 0, true));
    $('[data-ov="again"]', overlay).addEventListener('click', () => goto(chapters[st.chapter].first, 0, true));
    renderChapters();
  }
  function showLessonEnd() {
    const L = store.L();
    const missing = [];
    steps.forEach((s, i) => {
      if (s.type === 'para' && !L.heard[s.clip]) missing.push({ i, label: `${sceneById[s.scene].title} — paragraph ${s.p}` });
      if (s.type === 'interaction' && !interactionDone(s.it)) missing.push({ i, label: `${sceneById[s.scene].title} — ${s.it.type === 'guided_exploration' ? 'open all three folders' : 'answer the question'}` });
    });
    const complete = missing.length === 0;
    L.ended = complete; store.save();
    const next = C.lessons.find((l) => l.id === lesson.next && playable(l.id));
    showOverlay(`<p class="kicker">${complete ? 'Lesson complete' : 'End of lesson reached'}</p><h2>${complete ? 'You have worked through this lesson.' : 'A few parts are still open.'}</h2>
      ${complete ? '<p>Every paragraph has been heard, every question attempted and each exploration item opened. Reflections and extra practice remain optional. This records your own progress on this device only — it is not an assessment, certificate or appointment.</p>' : `<p>Completion is based on what you actually did. Still open (${missing.length}):</p><ul>${missing.slice(0, 6).map((m) => `<li><button class="mini" data-goto="${m.i}">${esc(m.label)}</button></li>`).join('')}</ul>${missing.length > 6 ? `<p class="meta">…and ${missing.length - 6} more in the transcript.</p>` : ''}`}
      ${next ? `<p class="meta">Next: lesson ${C.lessons.indexOf(next) + 1}, “${esc(next.learnerTitle || next.title)}”.</p>` : '<p class="meta">This is the last lesson of the module.</p>'}
      <div class="row">${next ? `<button class="btn" data-ov="nextlesson">Continue to lesson ${C.lessons.indexOf(next) + 1}</button>` : ''}<button class="btn ${next ? 'ghost' : ''}" data-ov="review">Review this lesson</button><button class="btn ghost" data-ov="home">Course overview</button></div>`, true);
    $$('[data-goto]', overlay).forEach((b) => b.addEventListener('click', () => goto(+b.getAttribute('data-goto'), 0, true)));
    if (next) $('[data-ov="nextlesson"]', overlay).addEventListener('click', () => { location.href = lessonUrl(next.id); });
    $('[data-ov="review"]', overlay).addEventListener('click', () => openDrawer('transcript'));
    $('[data-ov="home"]', overlay).addEventListener('click', () => go('home'));
    renderChapters();
  }

  /* ---------------- dock activities ---------------- */
  function openDock() { dock.hidden = false; $('#player').classList.add('with-dock'); requestAnimationFrame(() => setShot(lastShotFor(), true)); }
  function closeDock() { if (!dock.hidden) { dock.hidden = true; dock.innerHTML = ''; $('#player').classList.remove('with-dock'); activity = null; requestAnimationFrame(() => setShot(lastShotFor(), true)); } }
  function lastShotFor() { const d = (sceneById[stageScene] || {}).stage || {}; const sh = d.shots && d.shots.length ? d.shots[d.shots.length - 1] : d.shot; return sh ? { s: sh.s, x: sh.x } : { s: 'medium', x: 30 }; }
  function openActivity(st, autoplayPrompt) {
    const it = st.it; const sc = sceneById[st.scene]; const style = ((sc.stage || {}).choice || {}).style || 'cards';
    openDock();
    if (it.type === 'single_choice') activity = choiceActivity(it, style);
    else if (it.type === 'guided_exploration') activity = exploreActivity(it);
    else activity = reflectActivity(it, st.scene);
    if (autoplayPrompt !== false && P.started) playAside(it.promptClip, {});
  }
  function openProductionActivity(st) {
    openDock();
    activity = window.Activities.render(dock, st.act, {
      state: () => { const L = store.L(); return (L.activities[st.act.id] = L.activities[st.act.id] || { placed: {}, checked: false, tries: 0 }); },
      save: () => store.save(), announce, reduced, speak: (clip) => playAside(clip, {}),
      onReady: () => { const c = $('[data-act="continue"]', dock); if (c) { c.disabled = false; c.removeAttribute('aria-disabled'); } renderChapters(); },
      continueHtml: (ready) => continueBtn(ready),
    });
    bindContinue(() => true);
  }
  function continueBtn(enabled) { return `<button type="button" class="btn" data-act="continue"${enabled ? '' : ' disabled aria-disabled="true"'}>Continue</button>`; }
  function bindContinue(isReady) {
    const b = $('[data-act="continue"]', dock);
    b.addEventListener('click', () => { if (!isReady()) return; goto(P.idx + 1, 0, true); });
  }

  function choiceActivity(it, style) {
    const L = store.L(); const rec = (L.answers[it.id] = L.answers[it.id] || { tried: [], correct: false });
    const name = 'opt-' + it.id;
    dock.innerHTML = `<p class="eyebrow">Your turn · practice question</p>
      <fieldset class="choices style-${esc(style)}"><legend id="q-${it.id}">${esc(it.prompt)}</legend>
      ${it.options.map((o, k) => `<label class="opt" data-opt="${esc(o.id)}"><input type="radio" name="${name}" value="${esc(o.id)}"><span><span class="optx">${esc(o.text)}</span><span class="tried" aria-live="off"></span></span></label>`).join('')}
      </fieldset>
      <div class="actions"><button type="button" class="btn" data-act="check" disabled>Check this answer</button><button type="button" class="btn ghost small" data-act="hearq">Hear the question</button></div>
      <div class="fbwrap" aria-live="polite"></div>
      <div class="actions">${continueBtn(rec.tried.length > 0)}<span class="progress-note" data-note>${rec.tried.length ? '' : 'Choose an answer to continue — you can try others too.'}</span></div>`;
    const check = $('[data-act="check"]', dock);
    const markTried = () => rec.tried.forEach((id) => {
      const o = it.options.find((x) => x.id === id); const lab = $(`[data-opt="${CSS.escape(id)}"]`, dock);
      lab.classList.add(o.correct ? 'was-ok' : 'was-no'); $('.tried', lab).textContent = o.correct ? '✓ Explained: this one fits' : '✕ Explained: why this does not fit';
    });
    markTried();
    $$('input', dock).forEach((r) => r.addEventListener('change', () => { check.disabled = false; }));
    check.addEventListener('click', () => {
      const sel = $(`input[name="${name}"]:checked`, dock); if (!sel) return;
      const o = it.options.find((x) => x.id === sel.value);
      if (!rec.tried.includes(o.id)) rec.tried.push(o.id);
      if (o.correct) rec.correct = true;
      store.save(); markTried();
      const fb = $('.fbwrap', dock);
      fb.innerHTML = `<div class="feedback ${o.correct ? 'ok' : 'no'}" tabindex="-1"><div class="fb-head"><span class="fb-icon" aria-hidden="true">${o.correct ? '✓' : '!'}</span>${o.correct ? 'Correct' : 'Not quite — here is why'}</div>
        <p class="fb-choice">You chose: “${esc(o.text)}”</p><p class="fb-text">${esc(o.feedback.text)}</p>
        <div class="actions"><button type="button" class="btn ghost small" data-act="hearfb">Hear Emilia again</button>${o.correct ? '' : '<button type="button" class="btn ghost small" data-act="retry">Try another answer</button>'}</div></div>`;
      playAside(o.feedback.clip, { mood: o.correct ? 'correct' : 'retry' });
      requestAnimationFrame(() => fb.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }));
      $('[data-act="hearfb"]', fb).addEventListener('click', () => playAside(o.feedback.clip, { mood: o.correct ? 'correct' : 'retry' }));
      const retry = $('[data-act="retry"]', fb);
      if (retry) retry.addEventListener('click', () => { sel.checked = false; check.disabled = true; fb.innerHTML = ''; $('input', dock).focus(); });
      const cont = $('[data-act="continue"]', dock); cont.disabled = false; cont.removeAttribute('aria-disabled');
      $('[data-note]', dock).textContent = o.correct ? 'Continue when you are ready.' : 'You can try another answer or continue.';
      announce((o.correct ? 'Correct. ' : 'Not quite. ') + o.feedback.text);
      renderChapters();
    });
    $('[data-act="hearq"]', dock).addEventListener('click', () => playAside(it.promptClip, {}));
    bindContinue(() => rec.tried.length > 0);
    setTimeout(() => { const f = $('input', dock); if (f && !overlay.hidden === false) f.focus({ preventScroll: true }); }, 80);
    return {};
  }

  function exploreActivity(it) {
    const L = store.L(); const seen = (L.explored[it.id] = L.explored[it.id] || []);
    dock.innerHTML = `<p class="eyebrow">Your turn · explore</p><h2>${esc(it.prompt)}</h2>
      <p class="ctx">Open each folder on the desk or in this list. For each, think of a question it can answer — and one it cannot.</p>
      <ul class="explore-list">${it.items.map((x) => `<li><button type="button" data-item="${esc(x.id)}" aria-pressed="false"><span>${esc(x.label)}</span><span class="v">${seen.includes(x.id) ? '✓ Opened' : ''}</span></button></li>`).join('')}</ul>
      <div class="item-detail" hidden aria-live="polite"></div>
      <div class="actions">${continueBtn(seen.length >= it.items.length)}<span class="progress-note" data-note></span></div>`;
    const note = $('[data-note]', dock);
    const upd = () => {
      note.textContent = `${seen.length} of ${it.items.length} folders opened` + (seen.length >= it.items.length ? ' — continue when you are ready.' : '.');
      $$('.folder', board).forEach((f) => f.classList.toggle('visited', seen.includes(f.getAttribute('data-item'))));
      const c = $('[data-act="continue"]', dock); if (seen.length >= it.items.length) { c.disabled = false; c.removeAttribute('aria-disabled'); }
    };
    function openItem(id) {
      const x = it.items.find((y) => y.id === id); if (!x) return;
      if (!seen.includes(id)) seen.push(id); store.save();
      $$('.explore-list button', dock).forEach((b) => { const on = b.getAttribute('data-item') === id; b.setAttribute('aria-pressed', on); if (seen.includes(b.getAttribute('data-item'))) $('.v', b).textContent = '✓ Opened'; });
      $$('.folder', board).forEach((f) => f.setAttribute('aria-pressed', f.getAttribute('data-item') === id));
      const [q, ...rest] = x.text.split('? ');
      const det = $('.item-detail', dock); det.hidden = false;
      det.innerHTML = `<h3>${esc(x.label)}</h3>${rest.length ? `<p class="q">${esc(q)}?</p><p>${esc(rest.join('? '))}</p>` : `<p>${esc(x.text)}</p>`}<p class="spoken">Emilia: “${esc(x.spoken)}”</p>`;
      playAside(x.clip, {});
      upd(); renderChapters();
    }
    $$('.explore-list button', dock).forEach((b) => b.addEventListener('click', () => openItem(b.getAttribute('data-item'))));
    bindContinue(() => seen.length >= it.items.length);
    upd();
    return { openItem };
  }

  function reflectActivity(it, scene) {
    const L = store.L();
    dock.innerHTML = `<p class="eyebrow">A moment for you · optional</p><h2>${esc(it.prompt)}</h2>
      <p class="ctx">Think it through silently, or jot a private note. Nothing is scored, sent or required.</p>
      <label for="refl" class="sr-only">Private note</label><textarea id="refl" class="note" placeholder="Optional private note…">${esc(L.reflections[it.id] || '')}</textarea>
      <p class="privacy">Stored only in this browser on this device. You can clear it in Settings.</p>
      <div class="actions"><button type="button" class="btn ghost small" data-act="model">Hear Emilia’s summary again</button>${continueBtn(true)}</div>`;
    $('#refl', dock).addEventListener('input', (e) => { L.reflections[it.id] = e.target.value; store.save(); });
    $('[data-act="model"]', dock).addEventListener('click', () => jumpTo(scene, 1, 0, true));
    bindContinue(() => true);
    return {};
  }

  /* ---------------- chapters nav ---------------- */
  function renderChapters() {
    const nav = $('#chapters'); const cur = steps[P.idx].chapter;
    nav.innerHTML = chapters.map((c, i) => `<button type="button" data-ch="${i}" class="${chapterDone(i) ? 'done' : ''}" ${i === cur ? 'aria-current="step"' : ''} aria-label="Chapter ${i + 1}: ${esc(c.title)}${chapterDone(i) ? ' (completed)' : ''}" title="${esc(c.title)}">${i + 1}</button>`).join('');
    $$('button', nav).forEach((b) => b.addEventListener('click', () => { if (!P.started) { P.started = true; store.L().started = true; } goto(chapters[+b.getAttribute('data-ch')].first, 0, true); }));
  }

  /* ---------------- drawers ---------------- */
  const drawer = $('#drawer'), dBody = $('#drawerBody'), dTitle = $('#drawerTitle');
  let drawerReturn = null;
  function openDrawer(kind, from) {
    drawerReturn = from || document.activeElement;
    const fill = { transcript: drawTranscript, notes: drawNotes, refs: drawRefs, settings: drawSettings, map: drawMap, review: drawReview, panel: drawPanel }[kind];
    fill(); drawer.hidden = false; drawer.dataset.kind = kind;
    setTimeout(() => { const cur = $('.tr-p.current', dBody); if (kind === 'transcript' && cur) { cur.scrollIntoView({ block: 'center' }); cur.focus(); } else $('#drawerClose').focus(); }, 40);
  }
  function closeDrawer() { drawer.hidden = true; if (drawerReturn && drawerReturn.focus) drawerReturn.focus(); }
  $('#drawerClose').addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
  drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeDrawer(); }
    if (e.key === 'Tab') { const f = $$('button, a[href], input, textarea, select', drawer).filter((x) => !x.disabled && x.offsetParent); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  $$('[data-drawer]').forEach((b) => b.addEventListener('click', () => openDrawer(b.getAttribute('data-drawer'), b)));
  // Escape closes an open panel even if focus has not reached it yet
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden && !drawer.contains(e.target)) { e.preventDefault(); closeDrawer(); } });

  function drawTranscript() {
    dTitle.textContent = 'Transcript';
    const L = store.L();
    let html = '<p class="meta">Select any paragraph to play the lesson from there. Emilia’s full narration is reproduced exactly.' + (Object.values(M).some((m) => m.pending) ? ' Paragraphs marked ⏳ have new wording whose narration is still being regenerated.' : '') + '</p>';
    chapters.forEach((c, ci) => {
      html += `<h3>Chapter ${ci + 1}</h3>`;
      c.scenes.forEach((sid) => {
        const sc = sceneById[sid];
        html += `<h4>${esc(sc.title)}</h4>`;
        sc.paras.forEach((p, pi) => {
          const i = steps.findIndex((s) => s.type === 'para' && s.scene === sid && s.p === pi + 1);
          html += `<button type="button" class="tr-p${i === P.idx ? ' current' : ''}" data-i="${i}">${L.heard[p.clip] ? '' : '<span class="sr-only">(not yet heard) </span>'}${isPending(p.clip) ? '<span title="Narration being regenerated">⏳ </span>' : ''}${esc(p.text)}</button>`;
        });
        const it = sc.interaction;
        if (it) {
          const i = steps.findIndex((s) => s.type === 'interaction' && s.scene === sid);
          html += `<div class="tr-int"><b>${it.type === 'single_choice' ? 'Practice question' : it.type === 'guided_exploration' ? 'Exploration' : 'Optional reflection'}:</b> ${esc(it.prompt)} <button type="button" class="mini" data-i="${i}">Go to activity</button>`;
          if (it.options.length) html += `<details><summary>All answer explanations</summary><ul>${it.options.map((o) => `<li><b>${o.correct ? 'Fits' : 'Does not fit'}:</b> ${esc(o.text)}<br><i>${esc(o.feedback.text)}</i></li>`).join('')}</ul></details>`;
          if (it.items.length) html += `<details><summary>Folder notes</summary><ul>${it.items.map((x) => `<li><b>${esc(x.label)}:</b> ${esc(x.text)}<br><i>${esc(x.spoken)}</i></li>`).join('')}</ul></details>`;
          html += '</div>';
        }
      });
    });
    dBody.innerHTML = html;
    $$('[data-i]', dBody).forEach((b) => b.addEventListener('click', () => { closeDrawer(); P.started = true; store.L().started = true; goto(+b.getAttribute('data-i'), 0, true); }));
  }
  /* ---------------- review panel (owner / expert feedback; local only, nothing is sent) ---------------- */
  function reviewRef() {
    const st = steps[P.idx] || steps[0], sc = sceneById[st.scene];
    const t = st.type === 'para' && P.mode === 'narration' ? audio.currentTime || 0 : 0;
    const where = st.type === 'para' ? `paragraph ${st.p} of ${sc.paras.length} at ${fmt(t)}` : st.type === 'interaction' ? `${st.it.type.replace('_', ' ')} ${st.it.id}` : st.type === 'activity' ? `activity ${st.act.id}` : st.type;
    const extra = { s: st.scene, step: st.type }; if (st.type === 'para') { extra.p = st.p; if (t >= 1) extra.t = Math.floor(t); }
    else if (st.type === 'interaction' || st.type === 'activity') extra.item = (st.it || st.act).id;
    const link = location.origin + location.pathname + lessonUrl(lesson.id, extra);
    const text = `[B1 review] ${lesson.id} “${lesson.learnerTitle || lesson.title}” · ${sc.id} “${sc.title}” · ${where} · script ${lesson.version} · build ${C.revision || ''}`;
    return { text, link, sc, st };
  }
  function copyText(s, done) {
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); done(ok); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(() => done(true), fallback); else fallback();
  }
  function drawReview() {
    dTitle.textContent = 'Review';
    const r = reviewRef();
    const notes = (store.data.review[lesson.id] = store.data.review[lesson.id] || {});
    dBody.innerHTML = `<p class="meta">For owner and expert review. Copy an exact reference to the moment you are commenting on. Notes stay in this browser only; nothing is sent.</p>
      <h3>Current position</h3>
      <p class="ref-line" id="revRef">${esc(r.text)}</p>
      <div class="row"><button type="button" class="btn small" id="revCopy">Copy reference</button><button type="button" class="btn ghost small" id="revLink">Copy review link</button><span class="meta" id="revDone" role="status"></span></div>
      ${(() => { const open = (C.expertOpen || []).filter((x) => x.scenes.includes(lesson.id + ' ' + r.sc.id)); return open.length ? `<h3>Open expert decisions on this scene</h3><ul class="refs">${open.map((x) => `<li><b>${esc(x.id)}</b> ${esc(x.title)} <span class="meta">— awaiting recognised-expert decision; proposed wording is not in the lesson</span></li>`).join('')}</ul>` : ''; })()}
      <label for="revNote"><h3>My draft note on “${esc(r.sc.title)}”</h3></label>
      <textarea id="revNote" class="note" placeholder="Optional note for this scene…">${esc(notes[r.sc.id] || '')}</textarea>
      <div class="row"><button type="button" class="btn ghost small" id="revAll">Copy all my notes for this lesson</button></div>
      <h3>Go to a scene</h3>
      <ol class="scene-index">${lesson.sequences.flat().map((sid) => { const sc = sceneById[sid]; const i = steps.findIndex((s) => s.scene === sid); return `<li><button type="button" class="tr-p${sid === r.sc.id ? ' current' : ''}" data-i="${i}"><b>${esc(sid)}</b> ${esc(sc.title)}${notes[sid] ? ' <span class="meta">· note</span>' : ''}</button></li>`; }).join('')}</ol>
      <h3>Other lessons</h3>
      <ul class="modules">${C.lessons.map((l, i) => `<li class="${l.id === lesson.id ? 'here' : ''}"><span class="id">${i + 1}</span>${l.id === lesson.id ? `<span>${esc(l.learnerTitle || l.title)}</span>` : `<a href="${esc(lessonUrl(l.id))}">${esc(l.learnerTitle || l.title)}</a>`}<span class="avail">${esc(l.id)}</span></li>`).join('')}</ul>`;
    const done = (msg) => (ok) => { $('#revDone').textContent = ok ? msg : 'Copy failed — select the text and copy it manually.'; };
    $('#revCopy').addEventListener('click', () => copyText(r.text + '\n' + r.link, done('Reference copied.')));
    $('#revLink').addEventListener('click', () => copyText(r.link, done('Link copied.')));
    $('#revNote').addEventListener('input', (e) => { notes[r.sc.id] = e.target.value; if (!e.target.value) delete notes[r.sc.id]; store.save(); });
    $('#revAll').addEventListener('click', () => {
      const out = Object.entries(notes).filter(([, v]) => v).map(([sid, v]) => `${lesson.id} ${sid} “${sceneById[sid] ? sceneById[sid].title : ''}”: ${v}`).join('\n\n');
      copyText(out || '(no notes yet)', done('Notes copied.'));
    });
    $$('[data-i]', dBody).forEach((b) => b.addEventListener('click', () => { closeDrawer(); P.started = true; store.L().started = true; goto(+b.getAttribute('data-i'), 0, steps[+b.getAttribute('data-i')].type === 'para'); }));
  }
  function drawPanel() {
    const sc = sceneById[stageScene]; const rp = sc && sc.refpanel;
    dTitle.textContent = 'Reference';
    dBody.innerHTML = rp ? `<h3>${esc(rp.title)}</h3><ul class="refpanel">${rp.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><p class="meta">Reference material for this scene. You do not need to memorise it; it helps you recognise when something is missing.</p>` : '<p class="meta">No reference panel for this scene.</p>';
  }
  function markTranscript() { if (!drawer.hidden && drawer.dataset.kind === 'transcript') $$('.tr-p', dBody).forEach((b) => b.classList.toggle('current', +b.getAttribute('data-i') === P.idx)); }
  function drawNotes() {
    dTitle.textContent = 'My notes';
    const L = store.L();
    dBody.innerHTML = `<p class="meta">Private notes for this lesson. Stored only in this browser on this device; nothing is sent anywhere.</p><label for="notesTa" class="sr-only">Notes</label><textarea id="notesTa" class="note" style="min-height:280px">${esc(L.notes || '')}</textarea>`;
    $('#notesTa').addEventListener('input', (e) => { L.notes = e.target.value; store.save(); });
  }
  function drawRefs() {
    dTitle.textContent = 'Sources and credits';
    const sc = sceneById[stageScene || lesson.sequences[0][0]];
    const claims = lesson.claims.filter((c) => sc.claims.includes(c.id));
    const srcTitle = (id) => { const s = lesson.sources.find((x) => x.id === id); return s ? s.title : id; };
    const cleanTitle = (t) => String(t).replace(/\s*\([^)]*\.(?:json|txt|md|html)\)/gi, '');
    const claimMeta = (c) => [c.sources.map(srcTitle).join('; '), c.anchors.join('; ')].filter(Boolean).map(esc).join(' · ');
    const pendingCount = Object.values(M).filter((m) => m.pending).length;
    dBody.innerHTML = `
      <h3>About this lesson</h3>
      <dl class="kv"><dt>Status</dt><dd>Draft lesson in a review build; recognised-expert review pending</dd><dt>Script version</dt><dd>${esc(lesson.version)}</dd><dt>Planned time</dt><dd>${lesson.minutes} minutes — an editorial estimate, not measured</dd><dt>Expert approval</dt><dd>Not yet given</dd><dt>Final examination</dt><dd>None in this module; practice questions are formative only</dd>${pendingCount ? `<dt>Narration</dt><dd>${pendingCount} clip${pendingCount === 1 ? '' : 's'} with revised wording await regeneration; the text is shown meanwhile.</dd>` : ''}</dl>
      <h3>Official and editorial sources</h3>
      <ul class="refs">${lesson.sources.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(cleanTitle(s.title))}</a>` : `${esc(cleanTitle(s.title))} <span class="meta">(internal editorial record, not linked)</span>`}${s.checked ? ` <span class="meta">checked ${esc(s.checked)}</span>` : ''}</li>`).join('')}</ul>
      <h3>Source notes for “${esc(sc.title)}”</h3>
      ${claims.length ? `<ul class="refs">${claims.map((c) => `<li>${esc(c.claim)}<br><span class="meta">${claimMeta(c)}</span></li>`).join('')}</ul>` : '<p class="meta">No legal claims are attached to this scene.</p>'}
      <h3>Photographs</h3>
      <ul class="refs">${Object.values(PHOTOS).map((p) => `<li>${esc(p.credit)} — <a href="${esc(p.sourcePage)}" target="_blank" rel="noopener noreferrer">source page</a>, <a href="${esc(p.licenceUrl)}" target="_blank" rel="noopener noreferrer">licence</a>.<br><span class="meta">Changes: ${esc(p.changes)} ${esc(p.note)}</span></li>`).join('')}</ul>
      <h3>Illustrations, voice and examples</h3>
      <ul class="refs">${ILLUSTRATIONS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
  }
  function drawSettings() {
    dTitle.textContent = 'Settings';
    dBody.innerHTML = `
      <div class="set-row"><label for="setCC">Captions</label><input type="checkbox" id="setCC" ${S.captions ? 'checked' : ''}></div>
      <div class="set-row"><label for="setCap">Larger captions</label><input type="checkbox" id="setCap" ${S.capLarge ? 'checked' : ''}></div>
      <div class="set-row"><label for="setMotion">Reduced motion</label><select id="setMotion"><option value="auto">Follow my device</option><option value="on">On</option><option value="off">Off</option></select></div>
      <h3>Progress</h3>
      <p class="meta">Progress, answers and notes are stored anonymously in this browser only.</p>
      <button type="button" class="btn danger" id="btnReset">Reset my progress in this lesson…</button>
      <h3>Keyboard</h3>
      <dl class="kv"><dt>Space / K</dt><dd>Play or pause</dd><dt>← / →</dt><dd>Back / forward 5 seconds</dd><dt>Shift + ← / →</dt><dd>Previous / next paragraph</dd><dt>M</dt><dd>Mute</dd><dt>C</dt><dd>Captions</dd><dt>T</dt><dd>Transcript</dd><dt>Esc</dt><dd>Close a panel</dd></dl>`;
    $('#setMotion').value = S.motion;
    $('#setCC').addEventListener('change', (e) => { S.captions = e.target.checked; store.save(); reflectSettings(); });
    $('#setCap').addEventListener('change', (e) => { S.capLarge = e.target.checked; store.save(); reflectSettings(); });
    $('#setMotion').addEventListener('change', (e) => { S.motion = e.target.value; store.save(); applyMotion(); });
    $('#btnReset').addEventListener('click', confirmReset);
  }
  function confirmReset() {
    const d = document.createElement('dialog'); d.className = 'confirm';
    d.innerHTML = `<h2 style="margin-top:0">Reset your progress in this lesson?</h2><p>This clears heard paragraphs, answers, explored folders, reflections and notes for this lesson on this device. It cannot be undone.</p><div class="row"><button class="btn danger" value="yes">Yes, reset</button><button class="btn ghost" value="no">Keep my progress</button></div>`;
    document.body.appendChild(d);
    $$('button', d).forEach((b) => b.addEventListener('click', () => {
      if (b.value === 'yes') { store.reset(); audio.pause(); P.started = false; closeDrawer(); announce('Progress for this lesson has been reset.'); go('home'); }
      d.close(); d.remove();
    }));
    d.showModal(); $('button[value="no"]', d).focus();
  }
  function drawMap() {
    dTitle.textContent = 'Course map';
    const mods = C.courseRoute || [];
    const sec = (name) => mods.filter((m) => m.section === name);
    const li = (m) => `<li class="${m.id === 'B1' ? 'here' : ''}"><span>${esc(m.title)}</span><span class="avail">${m.id === 'B1' ? 'This module' : 'Not yet available'}</span></li>`;
    dBody.innerHTML = `<p class="meta">Working module titles from the course blueprint, not statutory titles. This review build contains the first module.</p>
      <h3>Lessons in this module</h3><ul class="modules">${C.lessons.map((l, i) => `<li class="${l.id === lesson.id ? 'here' : ''}"><span class="id">${i + 1}</span>${playable(l.id) ? `<a href="${esc(lessonUrl(l.id))}">${esc(l.learnerTitle || l.title)}</a>` : `<span>${esc(l.learnerTitle || l.title)}</span>`}<span class="avail">${l.id === lesson.id ? 'Open now' : lessonState(l.id)}</span></li>`).join('')}</ul>
      <h3>Foundations</h3><ul class="modules">${sec('Basic theory').map(li).join('')}</ul>
      <h3>Working safely in class II practice</h3><ul class="modules">${sec('Additional class II theory').map(li).join('')}</ul>
      <p class="meta">The theoretical course is one part of preparing for a real role. Completing lessons does not appoint you to a function or authorise you to use equipment.</p>`;
  }
  function lessonState(id) {
    const l = C.lessons.find((x) => x.id === id), L = store.peek(id);
    if (!playable(id)) return 'Not yet available';
    if (!L || !L.started) return 'Not started';
    if (L.ended) return 'Completed on this device';
    const total = l.scenes.reduce((n, s) => n + s.paras.length, 0), heard = Object.keys(L.heard || {}).length;
    return Math.round((100 * heard) / Math.max(1, total)) + '% of narration heard';
  }
  function lessonPct(id) {
    const l = C.lessons.find((x) => x.id === id), L = store.peek(id);
    if (!L) return 0;
    const total = l.scenes.reduce((n, s) => n + s.paras.length, 0);
    return Math.round((100 * Object.keys(L.heard || {}).length) / Math.max(1, total));
  }
  function reflectSettings() {
    $('#btnCC').setAttribute('aria-pressed', S.captions); capBox.classList.toggle('large', S.capLarge); capBox.classList.toggle('off', !S.captions);
    $('#btnMute').setAttribute('aria-pressed', S.muted); $('#btnMute').setAttribute('aria-label', S.muted ? 'Unmute' : 'Mute');
    $('#volume').value = S.volume; $('#rate').value = String(S.rate);
  }

  /* ---------------- controls & keyboard ---------------- */
  $('#btnPlay').addEventListener('click', togglePlay);
  $('#btnPrev').addEventListener('click', () => stepPara(-1));
  $('#btnNext').addEventListener('click', () => { const i = steps.findIndex((s, k) => k > P.idx && s.type === 'para'); const nx = steps[P.idx + 1]; if (nx) goto(nx.type === 'para' ? P.idx + 1 : P.idx + 1, 0, true); });
  $('#btnReplay').addEventListener('click', () => { const st = steps[P.idx]; if (st.type === 'para') goto(P.idx, 0, true); else if (P.aside) playAside(P.aside.clip, P.aside); });
  $('#btnMute').addEventListener('click', () => { S.muted = !S.muted; audio.muted = S.muted; store.save(); reflectSettings(); });
  $('#volume').addEventListener('input', (e) => { S.volume = +e.target.value; audio.volume = S.volume; if (S.volume > 0 && S.muted) { S.muted = false; audio.muted = false; } store.save(); reflectSettings(); });
  $('#rate').addEventListener('change', (e) => { S.rate = +e.target.value; audio.playbackRate = S.rate; store.save(); });
  audio.addEventListener('loadedmetadata', () => { audio.playbackRate = S.rate; });
  $('#btnCC').addEventListener('click', () => { S.captions = !S.captions; store.save(); reflectSettings(); });
  document.addEventListener('keydown', (e) => {
    if (app.dataset.view !== 'lesson' || !drawer.hidden || document.querySelector('dialog[open]')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) && e.target.type !== 'range') return;
    const onButton = tag === 'button' || e.target.getAttribute('role') === 'button';
    if ((e.key === ' ' && !onButton) || e.key === 'k' || e.key === 'K') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowLeft' && e.shiftKey) { e.preventDefault(); stepPara(-1); }
    else if (e.key === 'ArrowRight' && e.shiftKey) { e.preventDefault(); $('#btnNext').click(); }
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && tag !== 'input') { e.preventDefault(); nudge(e.key === 'ArrowLeft' ? -5 : 5); }
    else if (e.key === 'm' || e.key === 'M') $('#btnMute').click();
    else if (e.key === 'c' || e.key === 'C') $('#btnCC').click();
    else if (e.key === 't' || e.key === 'T') openDrawer('transcript');
  });
  function nudge(sec) {
    const st = steps[P.idx]; if (st.type !== 'para') return;
    const t = (audio.currentTime || 0) + sec;
    if (t < 0) { const pv = steps[P.idx - 1]; if (pv && pv.type === 'para') goto(P.idx - 1, Math.max(0, dur(pv.clip) + t), P.playing); else audio.currentTime = 0; }
    else if (t > dur(st.clip)) { const nx = steps[P.idx + 1]; if (nx && nx.type === 'para') goto(P.idx + 1, t - dur(st.clip), P.playing); }
    else audio.currentTime = t;
    P.scrubUntil = performance.now() + 200;
  }
  window.addEventListener('resize', () => setShot(lastShotFor(), true));
  new ResizeObserver(() => { setShot(lastShotFor(), true); updateMore(); }).observe(screen);

  /* ---------------- home ---------------- */
  let homeRig = null, homePerf = null;
  function renderHome() {
    const cur = store.peek(lesson.id);
    const home = $('#home');
    const anyStarted = C.lessons.some((l) => (store.peek(l.id) || {}).started);
    home.innerHTML = `<div class="hero"><div class="hero-copy"><p class="kicker">Radiation protection in Belgian industry</p>
      <h1 id="homeTitle">Belgian framework and your responsibilities</h1>
      <p class="lead">A theoretical course for people who work with sources and radiation-generating devices in Belgian class II industry. Six lessons take you from who is who to how the framework works on an ordinary working day.</p>
      <div class="row"><button class="btn" data-open="${esc(lesson.id)}">${anyStarted ? `Continue lesson ${lessonNo}` : 'Start the first lesson'}</button><button class="btn ghost" data-drawer="map">Course map</button></div>
      <p class="meta">Local review build · draft lessons awaiting recognised-expert review · no tracking: progress stays in this browser.</p></div>
      <div class="hero-visual"><div class="emilia-home" id="homeEmilia"></div><div class="who"><b>Emilia</b>Head of a physical control service. Your guide through this module.</div></div></div>
      <h2 style="margin:34px 0 4px;font:600 20px/1.3 var(--font-d)">Lessons in this module</h2>
      <div class="lessons">${C.lessons.map((l, i) => {
        const on = playable(l.id), L = store.peek(l.id) || {};
        return `<article class="lcard ${on ? '' : 'locked'}${l.id === lesson.id && cur && cur.started ? ' current' : ''}"><span class="num">LESSON ${i + 1}</span><h3>${esc(l.learnerTitle || l.title)}</h3>
          ${on ? `<div class="bar" aria-hidden="true"><i style="width:${lessonPct(l.id)}%"></i></div><span class="state">${lessonState(l.id)}</span><div class="row"><button class="btn small" data-open="${esc(l.id)}" aria-label="${L.started ? 'Continue' : 'Start'} lesson ${i + 1}: ${esc(l.learnerTitle || l.title)}">${L.ended ? 'Revisit' : L.started ? 'Continue' : 'Start'}</button></div>`
            : '<span class="state">Not yet available.</span>'}</article>`;
      }).join('')}</div>
      <p class="notice"><button type="button" class="linkbtn" data-drawer="refs">Sources and credits</button></p>`;
    $$('[data-open]', home).forEach((b) => b.addEventListener('click', () => { const id = b.getAttribute('data-open'); if (id === lesson.id) go('lesson'); else location.href = lessonUrl(id); }));
    $$('[data-drawer]', home).forEach((b) => b.addEventListener('click', () => openDrawer(b.getAttribute('data-drawer'), b)));
    if (!homeRig) { homeRig = window.EmiliaRig.create($('#homeEmilia')); homePerf = window.Performer.create(homeRig); }
    else $('#homeEmilia').appendChild(homeRig.canvas);
  }

  function go(view) {
    if (view === 'lesson') {
      app.dataset.view = 'lesson'; $('#home').hidden = true; $('#player').hidden = false;
      $('#lhKicker').textContent = 'Lesson ' + lessonNo + ' of ' + C.lessons.length; $('#lhTitle').textContent = lesson.learnerTitle || lesson.title;
      document.title = 'Radiation / In Context — ' + (lesson.learnerTitle || lesson.title);
      history.replaceState(null, '', (deepLink ? location.search : lessonUrl(lesson.id).split('#')[0]) + '#lesson');
      renderChapters(); reflectSettings();
      requestAnimationFrame(() => { setShot(lastShotFor(), true); if (!P.started) showStart(); });
      $('#main').focus({ preventScroll: true });
    } else {
      audio.pause(); P.playing = false; clearGap(); reflectPlay();
      app.dataset.view = 'home'; $('#player').hidden = true; $('#home').hidden = false; renderHome();
      history.replaceState(null, '', location.pathname + '#home');
    }
  }
  $('[data-action="home"]').addEventListener('click', (e) => { e.preventDefault(); go('home'); });

  /* boot */
  applyMotion(); mq.addEventListener && mq.addEventListener('change', applyMotion);
  window.B1App = { steps, chapters, P, goto, store, audio, sceneById, resolveCue, togglePlay, rig, go, CAPTURE, playAside, isPending, openDrawer, closeDrawer };
  go(location.hash === '#lesson' ? 'lesson' : 'home');
  requestAnimationFrame(frame);
})();
