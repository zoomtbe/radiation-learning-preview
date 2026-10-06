/* Production activity layer (full-B1 build 2026-10-05): sort, match and order activities.
 * Content comes from src/activities/B1_ACTIVITIES.json, each activity mapped to reviewed source scenes/claims.
 * Every action has three equivalent routes:
 *   drag  - pointer drag of an item onto a group (mouse, pen, touch)
 *   click - select an item, then press "Place here" on a group
 *   keys  - Tab to an item, Enter/Space to select, Tab to a group's "Place here", Enter; order lists use Move up/down
 * Check gives an explanation for every placement; Try again returns only misplaced items; Reset clears all.
 * State is stored locally (progress object supplied by the player). No scoring is sent anywhere. */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r) => r.querySelector(s);
  const $$ = (s, r) => Array.from(r.querySelectorAll(s));
  const reason = (x, target) => x.feedbackByPlacement[String(target)];
  // 2D revision: in-lesson practice (the five reflection replacements and the pilot tasks) needs one check before Continue;
  // it is not scored and never requires every card to be right. Production practice from the earlier build stays optional.
  const noteText = (api, st) => (!api.required ? 'Optional practice — you can continue at any time.' : (st.tries || 0) > 0 ? 'Continue when you are ready — you can try again as often as you like.' : 'Place every card, then check your placements to continue.');
  const hear = (clip, label) => `<button type="button" class="mini" data-listen="${esc(clip)}" aria-label="${esc(label)}">Hear Emilia</button>`;
  function wireSpeech(dock, api) {
    if (dock.__speechClick) dock.removeEventListener('click', dock.__speechClick);
    dock.__speechClick = (e) => { const b = e.target.closest('[data-listen]'); if (b && dock.contains(b)) api.speak(b.dataset.listen); };
    dock.addEventListener('click', dock.__speechClick);
  }

  function render(dock, act, api) {
    const st = api.state();
    if (act.kind === 'order') return renderOrder(dock, act, api, st);
    return renderSort(dock, act, api, st);
  }

  /* ---------------- sort / match ---------------- */
  function renderSort(dock, act, api, st) {
    let selected = null;
    const groups = act.categories;
    const itemById = Object.fromEntries(act.items.map((x) => [x.id, x]));
    const groupLabel = (id) => (groups.find((g) => g.id === id) || {}).label || '';
    dock.innerHTML = `<p class="eyebrow">Your turn · ${act.kind === 'match' ? 'match' : 'sort'}</p><h2>${esc(act.title)}</h2>
      <p class="ctx">${esc(act.prompt)}</p>${hear(act.promptClip, 'Hear the practice question')}
      <p class="how" id="how-${esc(act.id)}">Drag each card onto a group, or select a card and then choose <b>Place here</b>. Keyboard: Tab to a card, press Enter, then Tab to a group and press Enter.</p>
      <div class="act act-sort" data-act-id="${esc(act.id)}">
        <div class="pool" role="group" aria-label="Cards to place"><h3>Cards</h3><div class="chips" data-zone="pool"></div></div>
        <div class="groups${groups.length % 2 ? ' odd' : ''}">${groups.map((g) => `<section class="grp" data-zone="${esc(g.id)}" aria-label="${esc(g.label)}"><header><h3>${esc(g.label)}</h3>${g.hint ? `<p>${esc(g.hint)}</p>` : ''}</header><div class="chips"></div><button type="button" class="mini place" data-place="${esc(g.id)}" disabled>Place here</button></section>`).join('')}</div>
      </div>
      <div class="actions"><button type="button" class="btn" data-a="check" disabled>Check my placements</button><button type="button" class="btn ghost small" data-a="retry" hidden>Try again</button><button type="button" class="btn ghost small" data-a="reset">Reset</button></div>
      <div class="act-result" aria-live="polite"></div>
      <div class="actions">${api.continueHtml(!api.required || (st.tries || 0) > 0)}<span class="progress-note" data-note>${noteText(api, st)}</span></div>`;
    const root = $('.act', dock), result = $('.act-result', dock);
    wireSpeech(dock, api);
    const zoneEl = (z) => (z === 'pool' ? $('[data-zone="pool"]', root) : $(`[data-zone="${CSS.escape(z)}"] .chips`, root));

    function chip(x) {
      const placed = st.placed[x.id];
      const verdict = st.checked && placed ? (placed === x.answer ? 'ok' : 'no') : '';
      const feedback = verdict ? reason(x, placed) : null;
      return `<div class="chipwrap ${verdict}" data-item="${esc(x.id)}"><button type="button" class="chip" data-item="${esc(x.id)}" aria-pressed="${selected === x.id}" aria-describedby="how-${esc(act.id)}">${verdict ? `<span class="mark" aria-hidden="true">${verdict === 'ok' ? '✓' : '✕'}</span>` : ''}<span>${esc(x.text)}</span>${verdict ? `<span class="sr-only">${verdict === 'ok' ? ' — placed correctly' : ' — not this group'}</span>` : ''}</button>${feedback ? `<p class="why">${esc(feedback.text)}</p>${hear(feedback.clip, 'Hear the explanation for ' + x.text)}` : ''}</div>`;
    }
    function draw() {
      $$('.chips', root).forEach((c) => { c.innerHTML = ''; });
      act.items.forEach((x) => { zoneEl(st.placed[x.id] || 'pool').insertAdjacentHTML('beforeend', chip(x)); });
      const poolEmpty = act.items.every((x) => st.placed[x.id]);
      $('[data-zone="pool"]', root).closest('.pool').classList.toggle('empty', poolEmpty);
      $$('.place', root).forEach((b) => { b.disabled = !selected; b.setAttribute('aria-label', selected ? `Place “${itemById[selected].text}” in ${groupLabel(b.dataset.place)}` : `Place here: ${groupLabel(b.dataset.place)} (select a card first)`); });
      $('[data-a="check"]', dock).disabled = !poolEmpty || st.checked;
      $('[data-a="retry"]', dock).hidden = !(st.checked && act.items.some((x) => st.placed[x.id] !== x.answer));
      wireChips();
    }
    function select(id) {
      if (st.checked) return;
      selected = selected === id ? null : id; draw();
      if (selected) { api.announce(`Selected: ${itemById[id].text}. Now choose a group.`); const b = $(`.chip[data-item="${CSS.escape(id)}"]`, root); if (b) b.focus(); }
    }
    function place(id, zone) {
      if (st.checked || !id) return;
      if (zone === 'pool') delete st.placed[id]; else st.placed[id] = zone;
      selected = null; api.save(); draw();
      api.announce(zone === 'pool' ? `${itemById[id].text} returned to the cards.` : `${itemById[id].text} placed in ${groupLabel(zone)}.`);
      const next = $(`[data-zone="pool"] .chip`, root); if (next) next.focus({ preventScroll: true });
      else { const c = $('[data-a="check"]', dock); if (!c.disabled) c.focus({ preventScroll: true }); }
    }
    function wireChips() {
      $$('.chip', root).forEach((b) => {
        b.addEventListener('click', () => { if (!b.__dragged) select(b.dataset.item); b.__dragged = false; });
        enableDrag(b, root, (zone) => place(b.dataset.item, zone));
      });
    }
    $$('.place', root).forEach((b) => b.addEventListener('click', () => place(selected, b.dataset.place)));
    $('[data-a="check"]', dock).addEventListener('click', () => {
      st.checked = true; st.tries = (st.tries || 0) + 1; api.save();
      const ok = act.items.filter((x) => st.placed[x.id] === x.answer).length;
      result.innerHTML = `<div class="feedback ${ok === act.items.length ? 'ok' : 'no'}" tabindex="-1"><div class="fb-head"><span class="fb-icon" aria-hidden="true">${ok === act.items.length ? '✓' : '!'}</span>${ok} of ${act.items.length} placed as explained</div>${ok === act.items.length ? (act.summary ? `<p class="fb-text">${esc(act.summary)}</p>` : '<p class="fb-text">Every card is placed as explained. Each card keeps its explanation.</p>') : '<p class="fb-text">Read the explanation under each card marked ✕, then try again — correctly placed cards stay where they are.</p>'}</div>`;
      draw(); api.onReady(); const nt = $('[data-note]', dock); if (nt) nt.textContent = noteText(api, st); api.announce(`${ok} of ${act.items.length} placed as explained.`);
      if (ok === act.items.length && act.summaryClip) result.insertAdjacentHTML('beforeend', hear(act.summaryClip, 'Hear the practice summary'));
      $('.feedback', result).focus({ preventScroll: true }); result.scrollIntoView({ block: 'nearest', behavior: api.reduced() ? 'auto' : 'smooth' });
    });
    $('[data-a="retry"]', dock).addEventListener('click', () => {
      act.items.forEach((x) => { if (st.placed[x.id] !== x.answer) delete st.placed[x.id]; });
      st.checked = false; result.innerHTML = ''; api.save(); draw();
      const f = $('[data-zone="pool"] .chip', root); if (f) f.focus();
    });
    $('[data-a="reset"]', dock).addEventListener('click', () => { st.placed = {}; st.checked = false; selected = null; result.innerHTML = ''; api.save(); draw(); const f = $('.chip', root); if (f) f.focus(); });
    if (st.checked) { const ok = act.items.filter((x) => st.placed[x.id] === x.answer).length; result.innerHTML = `<div class="feedback ${ok === act.items.length ? 'ok' : 'no'}"><div class="fb-head">${ok} of ${act.items.length} placed as explained</div>${ok === act.items.length && act.summary ? `<p class="fb-text">${esc(act.summary)}</p>` : ''}</div>`; }
    draw();
    return { kind: 'sort' };
  }

  /* while dragging near the top/bottom edge of the scrolling panel (or the window), scroll it */
  function scrollParent(el) { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight) return p; } return null; }
  function autoScroller(el) {
    const sp = scrollParent(el); let vy = 0, raf = 0;
    const tick = () => { if (!vy) { raf = 0; return; } if (sp) sp.scrollTop += vy; else window.scrollBy(0, vy); raf = requestAnimationFrame(tick); };
    return {
      at(y) {
        const r = sp ? sp.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
        const edge = 56; vy = y < r.top + edge ? -Math.ceil((r.top + edge - y) / 4) : y > r.bottom - edge ? Math.ceil((y - (r.bottom - edge)) / 4) : 0;
        if (vy && !raf) raf = requestAnimationFrame(tick);
      },
      stop() { vy = 0; },
    };
  }
  /* pointer drag with a floating copy; drop target = group under the pointer (or the card pool) */
  function enableDrag(btn, root, onDrop) {
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || btn.closest('.act').classList.contains('locked')) return;
      const sx = e.clientX, sy = e.clientY; let ghost = null, over = null; const auto = autoScroller(btn);
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        auto.at(ev.clientY);
        if (!ghost) { ghost = btn.cloneNode(true); ghost.classList.add('ghost'); ghost.setAttribute('aria-hidden', 'true'); document.body.appendChild(ghost); btn.classList.add('dragging'); btn.__dragged = true; }
        ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
        ghost.hidden = true; const t = document.elementFromPoint(ev.clientX, ev.clientY); ghost.hidden = false;
        const z = t && t.closest('[data-zone]'); const zone = z && root.contains(z) ? z : null;
        if (over && over !== zone) over.classList.remove('over'); over = zone; if (over) over.classList.add('over');
        ev.preventDefault();
      };
      const up = (ev) => {
        auto.stop();
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); document.removeEventListener('keydown', cancelKey);
        if (ghost) { ghost.remove(); btn.classList.remove('dragging'); if (over) { over.classList.remove('over'); if (ev.type === 'pointerup') onDrop(over.dataset.zone); } }
      };
      const cancelKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); up(ev); } };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
      document.addEventListener('keydown', cancelKey);
    });
  }

  /* ---------------- order ---------------- */
  function renderOrder(dock, act, api, st) {
    // start order: authored scramble (never the answer order), stored so the learner's arrangement persists
    if (!st.order || st.order.length !== act.items.length) st.order = (act.start || act.items.map((x) => x.id).reverse()).slice();
    const byId = Object.fromEntries(act.items.map((x) => [x.id, x]));
    dock.innerHTML = `<p class="eyebrow">Your turn · put in order</p><h2>${esc(act.title)}</h2>
      <p class="ctx">${esc(act.prompt)}</p>${hear(act.promptClip, 'Hear the practice question')}
      <p class="how" id="how-${esc(act.id)}">Drag a card up or down, or use its Move up / Move down buttons.</p>
      <ol class="act act-order" data-act-id="${esc(act.id)}"></ol>
      <div class="actions"><button type="button" class="btn" data-a="check">Check the order</button><button type="button" class="btn ghost small" data-a="retry" hidden>Try again</button><button type="button" class="btn ghost small" data-a="reset">Reset</button></div>
      <div class="act-result" aria-live="polite"></div>
      <div class="actions">${api.continueHtml(!api.required || (st.tries || 0) > 0)}<span class="progress-note" data-note>${noteText(api, st)}</span></div>`;
    const list = $('.act-order', dock), result = $('.act-result', dock);
    wireSpeech(dock, api);
    function draw(focusId, focusDir) {
      list.innerHTML = st.order.map((id, i) => {
        const x = byId[id]; const v = st.checked ? (x.answer === i ? 'ok' : 'no') : '';
        const feedback = v ? reason(x, i) : null;
        return `<li class="orow ${v}" data-item="${esc(id)}"><span class="onum" aria-hidden="true">${i + 1}</span><div class="otxt"><span>${v ? `<span class="mark" aria-hidden="true">${v === 'ok' ? '✓' : '✕'}</span>` : ''}${esc(x.text)}</span>${feedback ? `<p class="why">${esc(feedback.text)}</p>${hear(feedback.clip, 'Hear the explanation for ' + x.text)}` : ''}</div>
          <div class="omove"><button type="button" class="mini" data-dir="-1" ${i === 0 || st.checked ? 'disabled' : ''} aria-label="Move up: ${esc(x.text)}">↑</button><button type="button" class="mini" data-dir="1" ${i === st.order.length - 1 || st.checked ? 'disabled' : ''} aria-label="Move down: ${esc(x.text)}">↓</button></div></li>`;
      }).join('');
      $$('.omove button', list).forEach((b) => b.addEventListener('click', () => move(b.closest('li').dataset.item, +b.dataset.dir)));
      $$('.orow', list).forEach((li) => enableRowDrag(li, list, (id, to) => { const from = st.order.indexOf(id); st.order.splice(from, 1); st.order.splice(to, 0, id); api.save(); draw(); }));
      $('[data-a="check"]', dock).disabled = !!st.checked;
      $('[data-a="retry"]', dock).hidden = !(st.checked && st.order.some((id, i) => byId[id].answer !== i));
      if (focusId) { const b = $(`li[data-item="${CSS.escape(focusId)}"] [data-dir="${focusDir}"]:not([disabled])`, list) || $(`li[data-item="${CSS.escape(focusId)}"] button:not([disabled])`, list); if (b) b.focus(); }
    }
    function move(id, dir) {
      if (st.checked) return;
      const i = st.order.indexOf(id), j = i + dir; if (j < 0 || j >= st.order.length) return;
      st.order.splice(i, 1); st.order.splice(j, 0, id); api.save(); draw(id, dir);
      api.announce(`${byId[id].text} moved to position ${j + 1} of ${st.order.length}.`);
    }
    $('[data-a="check"]', dock).addEventListener('click', () => {
      st.checked = true; st.tries = (st.tries || 0) + 1; api.save();
      const ok = st.order.filter((id, i) => byId[id].answer === i).length;
      result.innerHTML = `<div class="feedback ${ok === st.order.length ? 'ok' : 'no'}" tabindex="-1"><div class="fb-head"><span class="fb-icon" aria-hidden="true">${ok === st.order.length ? '✓' : '!'}</span>${ok} of ${st.order.length} in the explained position</div>${ok === st.order.length ? `<p class="fb-text">${esc(act.summary)}</p>` : '<p class="fb-text">Read the note under each card marked ✕, then try again.</p>'}</div>`;
      draw(); api.onReady(); const nt = $('[data-note]', dock); if (nt) nt.textContent = noteText(api, st); api.announce(`${ok} of ${st.order.length} in the explained position.`);
      if (ok === st.order.length && act.summaryClip) result.insertAdjacentHTML('beforeend', hear(act.summaryClip, 'Hear the practice summary'));
      $('.feedback', result).focus({ preventScroll: true });
    });
    $('[data-a="retry"]', dock).addEventListener('click', () => { st.checked = false; result.innerHTML = ''; api.save(); draw(); const b = $('.omove button:not([disabled])', list); if (b) b.focus(); });
    $('[data-a="reset"]', dock).addEventListener('click', () => { st.order = (act.start || act.items.map((x) => x.id).reverse()).slice(); st.checked = false; result.innerHTML = ''; api.save(); draw(); });
    draw();
    return { kind: 'order' };
  }
  function enableRowDrag(li, list, onDrop) {
    li.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || li.closest('.act-order').querySelector('.orow.ok, .orow.no')) return;
      const sy = e.clientY; let dragging = false, target = -1;
      const rows = () => Array.from(list.children);
      const move = (ev) => {
        if (!dragging && Math.abs(ev.clientY - sy) < 6) return;
        dragging = true; li.classList.add('dragging');
        target = rows().findIndex((r) => { const b = r.getBoundingClientRect(); return ev.clientY < b.top + b.height / 2; });
        if (target < 0) target = rows().length; // below every row: move to the end
        rows().forEach((r, i) => r.classList.toggle('drop-before', i === target && r !== li));
        ev.preventDefault();
      };
      const up = (ev) => {
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); document.removeEventListener('keydown', cancelKey);
        rows().forEach((r) => r.classList.remove('drop-before')); li.classList.remove('dragging');
        if (ev.type === 'pointerup' && dragging && target >= 0) { const from = rows().indexOf(li); onDrop(li.dataset.item, target > from ? target - 1 : target); }
      };
      const cancelKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); up(ev); } };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
      document.addEventListener('keydown', cancelKey);
    });
  }

  window.Activities = { render };
})();
