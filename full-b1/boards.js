/* Board components: the teaching visuals that share the stage with Emilia.
 * Any element with data-at="<cue>" is revealed when narration reaches the cue;
 * data-focus="<cue>-><cue>" highlights it in that interval. Cue syntax (resolved by stage.js):
 *   p2            start of paragraph 2 of the scene
 *   p2:word       first spoken token in p2 starting with "word" (#n for nth occurrence)
 *   p2+40%        40% through paragraph 2
 *   end           after the scene's narration (decision point)
 * All text shown here is authored teaching content from the scene's visual direction.
 */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const at = (o) => (o && o.at ? ` data-at="${esc(o.at)}"` : '') + (o && o.until ? ` data-until="${esc(o.until)}"` : '') + (o && o.focus ? ` data-focus="${esc(o.focus)}"` : '');
  const STATUS = {
    ok: { icon: '✓', label: 'Established' }, gap: { icon: '○', label: 'Not established' }, pending: { icon: '◔', label: 'Pending' },
    held: { icon: '❚❚', label: 'Held' }, open: { icon: '…', label: 'Open' }, info: { icon: 'i', label: '' }, no: { icon: '✕', label: 'Not this' },
  };
  function status(s, text) {
    if (!s) return '';
    const d = STATUS[s] || STATUS.info;
    return `<span class="st st-${s}"><span class="st-i" aria-hidden="true">${d.icon}</span><span>${esc(text || d.label)}</span></span>`;
  }
  function lines(list) {
    return (list || []).map((l) => `<li class="ln"${at(l)}>${l.label ? `<span class="ln-l">${esc(l.label)}</span>` : ''}<span class="ln-v">${esc(l.text)}</span>${status(l.status, l.statusText)}</li>`).join('');
  }
  function card(c) {
    const kind = c.kind || 'doc';
    const head = `${c.tag ? `<span class="tag tag-${esc(c.tagKind || 'plain')}">${esc(c.tag)}</span>` : ''}${c.from ? `<span class="from">${esc(c.from)}</span>` : ''}${c.title ? `<h4>${esc(c.title)}</h4>` : ''}`;
    const body = `${c.text ? `<p class="tx">${esc(c.text)}</p>` : ''}${c.lines ? `<ul class="lns">${lines(c.lines)}</ul>` : ''}${c.note ? `<p class="note">${esc(c.note)}</p>` : ''}${c.statusLine ? `<p class="stline">${status(c.statusLine.status, c.statusLine.text)}</p>` : ''}`;
    const icon = c.icon ? `<div class="cicon" aria-hidden="true">${ICONS[c.icon] || ''}</div>` : '';
    const seek = c.seek ? ` data-seek="${esc(c.seek)}" role="button" tabindex="0" aria-label="Hear Emilia on: ${esc(c.text)}"` : '';
    return `<article class="card card-${esc(kind)}${c.cross ? ' crossed' : ''}${c.strong ? ' strong' : ''}${c.seek ? ' selectable' : ''}"${at(c)}${seek}${c.id ? ` data-id="${esc(c.id)}"` : ''}>${icon}<div class="cbody">${head}${body}</div>${c.cross ? `<span class="crossmark" aria-hidden="true"></span><span class="sr-only">Misconception, crossed out</span>` : ''}</article>`;
  }

  const ICONS = {
    scale: '<svg viewBox="0 0 48 48"><path d="M24 6v34M10 40h28M12 14h24M12 14l-6 12h12zM36 14l-6 12h12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    tune: '<svg viewBox="0 0 48 48"><path d="M10 12h28M10 24h28M10 36h28" stroke="currentColor" stroke-width="2.4"/><circle cx="18" cy="12" r="4" fill="var(--paper)" stroke="currentColor" stroke-width="2.4"/><circle cx="30" cy="24" r="4" fill="var(--paper)" stroke="currentColor" stroke-width="2.4"/><circle cx="22" cy="36" r="4" fill="var(--paper)" stroke="currentColor" stroke-width="2.4"/></svg>',
    limit: '<svg viewBox="0 0 48 48"><path d="M8 36h32" stroke="currentColor" stroke-width="2.4"/><path d="M8 14h32" stroke="currentColor" stroke-width="2.4" stroke-dasharray="4 3"/><path d="M12 36c6-6 10-14 14-14s8 6 14 4" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    folder: '<svg viewBox="0 0 48 48"><path d="M6 14h14l4 4h18v20H6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    doc: '<svg viewBox="0 0 48 48"><path d="M12 6h18l8 8v28H12z M30 6v8h8 M17 24h14 M17 30h14 M17 36h9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 48 48"><path d="M8 10h32v22H20l-8 7v-7H8z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    key: '<svg viewBox="0 0 48 48"><circle cx="16" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M24 24h18M36 24v6M41 24v5" stroke="currentColor" stroke-width="2.4"/></svg>',
    shield: '<svg viewBox="0 0 48 48"><path d="M24 6l15 6v10c0 10-7 17-15 20C16 39 9 32 9 22V12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 48 48"><path d="M14 6h8l3 9-5 4c2 5 5 8 10 10l4-5 9 3v8c0 3-2 5-5 5C21 40 8 27 8 11c0-3 3-5 6-5z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    person: '<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M10 42c0-9 6-15 14-15s14 6 14 15" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    clock: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M24 13v11l8 5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    search: '<svg viewBox="0 0 48 48"><circle cx="21" cy="21" r="12" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M30 30l10 10" stroke="currentColor" stroke-width="2.4"/></svg>',
    route: '<svg viewBox="0 0 48 48"><circle cx="10" cy="38" r="4" fill="currentColor"/><circle cx="38" cy="10" r="4" fill="currentColor"/><path d="M10 34c0-12 28-8 28-20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="4 4"/></svg>',
    question: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 19c0-4 3-6 6-6s6 2 6 6c0 5-6 5-6 10M24 34v1" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    gear: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M11 37l4-4M33 15l4-4" stroke="currentColor" stroke-width="2.4"/></svg>',
  };

  /* ---------------- component types ---------------- */
  const T = {};

  T.title = (b) => `<div class="b-title"${at(b)}>${b.kicker ? `<p class="kicker">${esc(b.kicker)}</p>` : ''}<h2>${esc(b.title)}</h2>${b.sub ? `<p class="sub">${esc(b.sub)}</p>` : ''}</div>`;

  T.cards = (b) => `<div class="b-cards lay-${esc(b.layout || 'stack')}">${b.heading ? `<h3 class="b-h"${at(b.headingAt ? { at: b.headingAt } : null)}>${esc(b.heading)}</h3>` : ''}<div class="cards">${(b.items || []).map(card).join('')}</div>${b.caption ? `<p class="b-cap"${at(b.captionAt ? { at: b.captionAt } : null)}>${esc(b.caption)}</p>` : ''}</div>`;

  T.compare = (b) => `<div class="b-compare">${b.heading ? `<h3 class="b-h">${esc(b.heading)}</h3>` : ''}<div class="cols">${(b.columns || []).map((c) => `<section class="col${c.tone ? ' tone-' + esc(c.tone) : ''}"${at(c)}>${c.tag ? `<span class="tag tag-${esc(c.tagKind || 'plain')}">${esc(c.tag)}</span>` : ''}<h4>${esc(c.title)}</h4>${c.text ? `<p class="tx">${esc(c.text)}</p>` : ''}<ul class="lns">${lines(c.lines)}</ul>${c.foot ? `<p class="foot">${esc(c.foot)}</p>` : ''}</section>`).join('')}</div>${b.caption ? `<p class="b-cap">${esc(b.caption)}</p>` : ''}</div>`;

  T.lanes = (b) => `<div class="b-lanes">${b.heading ? `<h3 class="b-h">${esc(b.heading)}</h3>` : ''}${(b.lanes || []).map((l, i) => `<section class="lane lane-${i}"${at(l)}><div class="lane-h"><span class="lane-n" aria-hidden="true">${ICONS[l.icon] || ''}</span><h4>${esc(l.title)}</h4></div><p class="tx">${esc(l.text || '')}</p>${l.status ? `<p class="lane-st">${status(l.status, l.statusText)}</p>` : ''}</section>`).join('')}${b.caption ? `<p class="b-cap"${at(b.captionAt ? { at: b.captionAt } : null)}>${esc(b.caption)}</p>` : ''}</div>`;

  T.principles = (b) => `<div class="b-principles">${(b.items || []).map((p, i) => `<section class="pr pr-${i}"${at(p)}><div class="pr-ic" aria-hidden="true">${ICONS[p.icon] || ''}</div><h4>${esc(p.title)}</h4><p class="q">${esc(p.question)}</p>${p.replay ? `<button type="button" class="mini replay-cue" data-cue="${esc(p.replay)}" aria-label="Replay Emilia's explanation of ${esc(p.title)}">↺ Replay</button>` : ''}</section>`).join('')}${b.caption ? `<p class="b-cap"${at(b.captionAt ? { at: b.captionAt } : null)}>${esc(b.caption)}</p>` : ''}</div>`;

  T.quote = (b) => {
    let html = esc(b.text);
    (b.highlights || []).forEach((h) => { html = html.replace(esc(h.phrase), `<mark class="hl hl-${esc(h.kind || 'a')}"${at(h)}>${esc(h.phrase)}</mark>`); });
    return `<figure class="b-quote"${at(b)}>${b.title ? `<figcaption>${esc(b.title)}</figcaption>` : ''}<blockquote>${html}</blockquote>${b.legend ? `<ul class="legend">${b.legend.map((l) => `<li${at(l)}><mark class="hl hl-${esc(l.kind)}">${esc(l.label)}</mark></li>`).join('')}</ul>` : ''}</figure>`;
  };

  T.photo = (b) => `<figure class="b-photo${b.fit ? ' fit-' + esc(b.fit) : ''}"${at(b)}><div class="ph-frame"><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">${(b.labels || []).map((l) => `<span class="ph-label" style="left:${l.x}%;top:${l.y}%"${at(l)}>${esc(l.text)}</span>`).join('')}${b.badge ? `<span class="ph-badge">${esc(b.badge)}</span>` : ''}</div><figcaption>${esc(b.caption || '')} <span class="credit">${esc(b.credit || '')}</span></figcaption></figure>`;

  T.stack = (b, s, ctx) => `<div class="b-stack">${(b.parts || []).map((p) => (T[p.type] ? `<div class="part part-${esc(p.type)}"${at({ at: p.at, until: p.until })}>${T[p.type](Object.assign({}, p, { at: null, until: null }), s, ctx)}</div>` : '')).join('')}</div>`;

  T.split = (b, s, ctx) => `<div class="b-split${b.ratio ? ' r-' + esc(b.ratio) : ''}">${(b.parts || []).map((p) => `<div class="part part-${esc(p.type)}"${at({ at: p.at, until: p.until })}>${T[p.type](Object.assign({}, p, { at: null, until: null }), s, ctx)}</div>`).join('')}</div>`;

  T.refcard = (b, scene) => {
    const rc = b.card || (scene && scene.refcard);
    if (!rc) return '';
    return `<article class="b-ref"${at(b)}><header><span class="tag tag-ref">Reference card</span><h3>${esc(rc.title)}</h3><p class="scope">${esc(rc.scope)}</p></header><dl>${rc.rows.map((r, i) => `<div class="row${(b.focusRows || []).includes(i) ? ' keyrow' : ''}"${at((b.rowAt || [])[i] ? { at: b.rowAt[i] } : null)}><dt>${esc(r.label)}</dt><dd>${esc(r.text)}</dd></div>`).join('')}</dl><footer>${esc(rc.source_note)}</footer></article>`;
  };

  /* Role map (B1.1 S03/S04): separate kinds of responsibility, not a single chain of command */
  T.rolemap = (b) => {
    const N = {
      fanc: { x: 30, y: 30, w: 330, h: 112, t: 'FANC', s: ['Federal Agency for Nuclear Control', 'Regulator — outside the company'] },
      operator: { x: 400, y: 214, w: 380, h: 104, t: 'Operator', s: ['Responsible for the establishment;', 'organises physical control'] },
      head: { x: 390, y: 372, w: 430, h: 104, t: 'Head of physical control service', s: ['Coordinates the service — Emilia,', 'in our fictional company'] },
      agents: { x: 312, y: 540, w: 338, h: 104, t: 'Radiation protection agents', s: ['Designated for assigned', 'checks and actions'] },
      techs: { x: 664, y: 540, w: 262, h: 104, t: 'RT technicians', s: ['Radiographic work;', 'task-specific duties'] },
      org: { x: 955, y: 226, w: 312, h: 104, t: 'Recognised organisation', s: ['External physical-control', 'organisation, under contract'] },
      expert: { x: 955, y: 398, w: 312, h: 104, t: 'Recognised expert', s: ['Recognised individual: specified', 'examinations and approvals'] },
    };
    const reveal = b.reveal || {}, focus = b.focus || {};
    const node = (k) => { const n = N[k]; return `<g class="rm-node rm-${k}"${at({ at: reveal[k], focus: focus[k] })}><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="16"/><text x="${n.x + 20}" y="${n.y + 38}" class="rm-t">${esc(n.t)}</text>${n.s.map((line, i) => `<text x="${n.x + 20}" y="${n.y + 66 + i * 23}" class="rm-s">${esc(line)}</text>`).join('')}</g>`; };
    const edge = (id, d, label, lx, ly, anchor) => `<g class="rm-edge"${at({ at: reveal[id] })}><path d="${d}" marker-end="url(#rmArrow)"/><text x="${lx}" y="${ly}" class="rm-l"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(label)}</text></g>`;
    return `<div class="b-rolemap"><svg viewBox="0 0 1290 690" role="img" aria-labelledby="rmT rmD"><title id="rmT">Belgian responsibilities map for our fictional class II example</title><desc id="rmD">FANC sits outside the company as the regulator and provides oversight. Inside the fictional company, the operator organises the physical control service, headed by Emilia, with designated radiation protection agents and RT technicians; a technician may also be designated as an agent. Outside, a recognised physical-control organisation under contract and its recognised expert support the arrangement through specified examinations and approvals. Roles may overlap where qualifications and appointments allow; this map describes the example, not every company.</desc>
      <defs><marker id="rmArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#6f7f84"/></marker></defs>
      <g class="rm-zone rm-company"${at({ at: reveal.company })}><rect x="296" y="172" width="644" height="500" rx="28"/><text x="324" y="202" class="rm-z">Fictional class II company</text></g>
      <g class="rm-zone rm-external"${at({ at: reveal.org })}><rect x="945" y="172" width="330" height="352" rx="28"/><text x="965" y="202" class="rm-z">External support (this example)</text></g>
      ${edge('e_oversight', 'M195,142 C195,230 300,262 396,266', 'Oversight', 206, 214)}
      ${edge('e_organises', 'M590,318 L590,368', 'Organises', 604, 350)}
      ${edge('e_duties', 'M520,476 C500,500 480,512 470,536', 'Assigned physical-control duties', 330, 520)}
      ${edge('e_contract', 'M952,272 C900,272 830,268 784,266', 'Contract', 870, 256, 'middle')}
      ${edge('e_expert', 'M952,450 C900,450 860,436 824,428', 'Expert examinations / approvals', 936, 512, 'end')}
      ${['fanc', 'operator', 'head', 'agents', 'techs', 'org', 'expert'].map(node).join('')}
      <g class="rm-overlap"${at({ at: reveal.overlap })}><path d="M600,646 C620,664 650,664 668,646"/><text x="634" y="664" class="rm-l" text-anchor="middle" dy="0">One person may hold both functions</text></g>
    </svg><p class="b-cap"${at({ at: reveal.marginal })}>Roles may overlap where qualifications and appointments allow. This map describes our fictional example, not every company.</p></div>`;
  };
  /* Course route (B1.1 S02) */
  T.route = (b) => {
    const r = b.reveal || {};
    const stop = (x, y, label, a) => `<g class="rt-stop"${at({ at: a })}><circle cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y + 44}" text-anchor="middle">${esc(label)}</text></g>`;
    return `<div class="b-route"><svg viewBox="0 0 1440 640" role="img" aria-labelledby="rtT rtD"><title id="rtT">Course route</title><desc id="rtD">One continuous route with two regions: the Foundations modules B1 to B6 and the class II application modules A1 to A6, followed by the separate final assessment and the practical preparation for a real role.</desc>
      <path class="rt-path" d="M80,470 C240,470 260,250 420,250 S620,430 760,430 S980,190 1120,200 S1320,360 1380,330"${at({ at: r.path })}/>
      <g class="rt-region rt-found"${at({ at: r.foundations })}><rect x="40" y="90" width="700" height="500" rx="30"/><text x="70" y="140" class="rt-h">Foundations · B1–B6</text><text x="70" y="178" class="rt-s">Framework · radiation and quantities · shielding and exposure</text><text x="70" y="204" class="rt-s">effects and dosimetry · instruments · sources and routines</text></g>
      <g class="rt-region rt-apply"${at({ at: r.application })}><rect x="760" y="60" width="640" height="530" rx="30"/><text x="790" y="110" class="rt-h">Class II application · A1–A6</text><text x="790" y="148" class="rt-s">Authorised activity · equipment and safety systems · sources</text><text x="790" y="174" class="rt-s">measurements · worksite and transport · response</text></g>
      ${stop(80, 470, 'B1 — today', r.b1)}${['B2', 'B3', 'B4', 'B5', 'B6'].map((m, i) => stop([240, 420, 560, 660, 730][i], [400, 250, 330, 420, 440][i], m, r.bmods)).join('')}
      ${['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((m, i) => stop([820, 930, 1040, 1150, 1260, 1370][i], [380, 290, 215, 220, 300, 335][i], m, r.amods)).join('')}
      <g class="rt-note"${at({ at: r.practice })}><rect x="300" y="526" width="880" height="80" rx="14"/><text x="740" y="558" text-anchor="middle">Practice questions help you learn; the final assessment is separate.</text><text x="740" y="586" text-anchor="middle">Practical preparation and your actual appointment still matter.</text></g>
    </svg></div>`;
  };

  /* Preparation table animation (B1.1 S08) */
  T.prep = (b) => `<div class="b-prep"${at(b)}><div class="prep-cols"><section class="prep-col"><h4>Planning stage</h4><p class="hint">Resolved before the work begins</p><div class="slots">${(b.tasks || []).map((t, i) => `<div class="task task-plan"${at({ at: t.at })}>${ICONS[t.icon] || ''}<span>${esc(t.text)}</span></div>`).join('')}</div></section><section class="prep-col prep-active"><h4>Active work</h4><p class="hint">Not the moment for avoidable preparation questions</p><div class="slots">${(b.tasks || []).map((t) => `<div class="task task-active"${at({ at: t.at, focus: null })} data-leave="${esc(t.at)}">${ICONS[t.icon] || ''}<span>${esc(t.text)}</span></div>`).join('')}</div></section></div><p class="b-cap">${esc(b.caption || '')}</p></div>`;

  /* Site sketch (B1.1 S13) */
  T.sketch = (b) => `<figure class="b-sketch"${at(b)}><svg viewBox="0 0 800 460" role="img" aria-labelledby="skT"><title id="skT">${esc(b.alt)}</title>
    <rect x="10" y="10" width="780" height="440" rx="18" class="sk-bg"/>
    <rect x="120" y="70" width="210" height="150" rx="8" class="sk-bld"/><text x="225" y="150" text-anchor="middle" class="sk-t">Workshop</text>
    <rect x="520" y="250" width="200" height="140" rx="8" class="sk-bld"/><text x="620" y="325" text-anchor="middle" class="sk-t">Stores</text>
    <ellipse cx="420" cy="250" rx="120" ry="80" class="sk-area"/><text x="420" y="246" text-anchor="middle" class="sk-t">Area kept clear</text><text x="420" y="272" text-anchor="middle" class="sk-s">during exposures (no distances shown)</text>
    <path d="M60,400 C200,380 260,330 300,300 S420,180 560,140 S720,110 760,100" class="sk-old"${at({ at: b.oldAt })}/><text x="600" y="98" class="sk-s"${at({ at: b.oldAt })}>Route on the agreed plan</text>
    <path d="M60,420 C180,360 300,300 380,250 S520,190 760,200" class="sk-new"${at({ at: b.newAt })}/><text x="560" y="222" class="sk-new-t"${at({ at: b.newAt })}>Walkway route since this morning</text>
    </svg><figcaption>Conceptual planning sketch — no exclusion distances</figcaption></figure>`;

  /* Procedure flowing into a record (B1.2 S04) */
  T.flow = (b) => `<div class="b-flow"><section class="fl-side fl-agent"${at({ at: b.agentAt })}><span class="tag">Agent</span><h4>Carrying out an assigned check</h4><p>Uses the approved procedure and records what was observed.</p></section><div class="fl-mid"><div class="fl-doc fl-proc"${at({ at: b.procAt })}>${ICONS.doc}<span>Approved procedure</span></div><div class="fl-arrow"${at({ at: b.recAt })} aria-hidden="true"></div><div class="fl-doc fl-rec"${at({ at: b.recAt })}>${ICONS.doc}<span>Check record</span></div></div><section class="fl-side fl-expert"${at({ at: b.expertAt })}><span class="tag">Recognised expert</span><h4>Examining and approving the relevant procedure</h4><p>Specified examination and approval duties, including risk analysis and procedures.</p></section></div>`;

  /* One person, two functions (B1.2 S08) */
  T.figure = (b) => `<div class="b-figure"><div class="fig-sil" aria-hidden="true">${ICONS.person}</div><div class="fig-labels">${(b.labels || []).map((l) => `<span class="fig-l"${at(l)}>${esc(l.text)}</span>`).join('')}</div><p class="b-cap">${esc(b.caption || '')}</p></div>`;

  /* Call status (B1.5 S09) */
  T.callstatus = (b) => `<div class="b-call"><section class="call-panel"${at({ at: b.panelAt })}><header>${ICONS.phone}<h4>Direct-contact attempt</h4></header><ol class="call-steps">${(b.steps || []).map((s) => `<li${at(s)}>${status(s.status, s.statusText)}<span>${esc(s.text)}</span></li>`).join('')}</ol><p class="call-state">${status('open', 'Direct contact not yet successful')}</p></section><aside class="call-def"${at({ at: b.defAt })}><h4>Successful direct contact</h4><p>${esc(b.definition)}</p><p class="not">${esc(b.notText)}</p></aside><aside class="call-lane"${at({ at: b.laneAt })}><h4>Meanwhile</h4><p>${esc(b.laneText)}</p></aside></div>`;

  /* Folders for the guided exploration (B1.1 S12) — buttons are wired by interactions.js */
  T.folders = (b) => `<div class="b-folders" role="group" aria-label="Three folders on Emilia's desk">${(b.items || []).map((f, i) => `<button type="button" class="folder f-${i}" data-item="${esc(f.id)}"${at(f)}><span class="f-tab" aria-hidden="true"></span><span class="f-label">${esc(f.label)}</span><span class="f-hint">${esc(f.hint || 'Open folder')}</span><span class="f-visited" aria-hidden="true">✓ Visited</span></button>`).join('')}</div>`;

  /* Limit diagram (B1.1 S10) */
  T.limit = (b) => `<div class="b-limit"><svg viewBox="0 0 700 360" role="img" aria-labelledby="lmT"><title id="lmT">A generic, unnumbered limit diagram</title><rect x="20" y="20" width="660" height="320" rx="18" class="lm-bg"/><line x1="70" y1="90" x2="640" y2="90" class="lm-limit"/><text x="76" y="76" class="lm-t">Applicable limit (no values shown)</text><path d="M70,300 C160,290 220,250 300,232 S460,214 640,206" class="lm-line"/><path d="M320,226 L320,96" class="lm-gap"${at({ at: b.gapAt })}/></svg><div class="lm-false"${at({ at: b.falseAt })}><span class="lm-cap">Unused dose to spend</span><span class="crossmark" aria-hidden="true"></span><span class="sr-only">This caption is a misconception and is crossed out.</span></div><p class="lm-true"${at({ at: b.trueAt })}>${esc(b.trueText)}</p></div>`;

  /* Two documents + one message (generic chat) */
  T.message = (b) => `<div class="b-msg${b.big ? ' big' : ''}"${at(b)}><div class="bubble"><span class="from">${esc(b.from)}</span>${(b.paras || [b.text]).map((p) => `<p>${esc(p)}</p>`).join('')}</div>${b.after ? `<div class="bubble bubble-2${b.after.kind ? ' bubble-' + esc(b.after.kind) : ''}"${at({ at: b.after.at })}><span class="from">${esc(b.after.from)}</span><p>${esc(b.after.text)}</p></div>` : ''}</div>`;

  /* ---- B1.1 additions ---- */
  // Genuine photographs come from the credited registry (ctx.photos). Nothing is written on stage:
  // attribution, licence and change notices are shown in the Sources and credits view.
  T.photo = (b, s, ctx) => {
    const ph = (ctx.photos || {})[b.photo];
    if (!ph) return '';
    return `<figure class="b-photo${b.fit ? ' fit-' + esc(b.fit) : ''}"${at(b)}><div class="ph-frame"><img src="${esc(ph.src)}" alt="${esc(b.alt)}">${(b.labels || []).map((l) => `<span class="ph-label" style="left:${l.x}%;top:${l.y}%"${at(l)}>${esc(l.text)}</span>`).join('')}</div></figure>`;
  };

  // Original illustrated close-up of a butt-welded pipe joint (no faces, logos or radiation equipment).
  T.weld = (b) => `<figure class="b-weld${b.compact ? ' compact' : ''}"${at(b)}><div class="wframe"><svg viewBox="0 0 800 420" role="img" aria-labelledby="wdT"><title id="wdT">Illustration: close-up of a circumferential weld joining two steel pipe sections.</title>
    <defs>
      <linearGradient id="wdPipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6469"/><stop offset=".18" stop-color="#b9c0c4"/><stop offset=".34" stop-color="#e3e7e9"/><stop offset=".55" stop-color="#9ea6ab"/><stop offset=".85" stop-color="#5b6267"/><stop offset="1" stop-color="#3f4549"/></linearGradient>
      <linearGradient id="wdBead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4338"/><stop offset=".2" stop-color="#a99a83"/><stop offset=".36" stop-color="#d8cdb9"/><stop offset=".58" stop-color="#8d7f6a"/><stop offset=".86" stop-color="#4a4236"/><stop offset="1" stop-color="#2f2a23"/></linearGradient>
      <linearGradient id="wdTint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98a4e" stop-opacity="0"/><stop offset=".4" stop-color="#8f6aa6" stop-opacity=".22"/><stop offset=".5" stop-color="#c49a55" stop-opacity=".35"/><stop offset=".6" stop-color="#6f86b4" stop-opacity=".22"/><stop offset="1" stop-color="#b98a4e" stop-opacity="0"/></linearGradient>
      <radialGradient id="wdBg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#d9d4cb"/><stop offset="1" stop-color="#a59f95"/></radialGradient>
      <pattern id="wdRip" width="16" height="200" patternUnits="userSpaceOnUse"><path d="M2,0 C14,40 14,160 2,200" fill="none" stroke="#3a3328" stroke-opacity=".35" stroke-width="2"/></pattern>
    </defs>
    <rect width="800" height="420" fill="url(#wdBg)"/>
    <rect x="0" y="105" width="800" height="210" fill="url(#wdPipe)"/>
    <rect x="300" y="105" width="200" height="210" fill="url(#wdTint)"/>
    <path d="M362,98 C352,160 352,260 362,322 L438,322 C448,260 448,160 438,98 Z" fill="url(#wdBead)"/>
    <rect x="362" y="104" width="76" height="212" fill="url(#wdRip)"/>
    <path d="M0,150 L800,150" stroke="#fff" stroke-opacity=".35" stroke-width="5"/>
    <ellipse cx="400" cy="372" rx="330" ry="18" fill="#000" opacity=".12"/>
  </svg>${(b.labels || []).map((l) => `<span class="ph-label" style="left:${l.x}%;top:${l.y}%"${at(l)}>${esc(l.text)}</span>`).join('')}<span class="ph-badge">Illustration</span></div><figcaption>Original illustration of a pipe weld, the object of our fictional inspection. A licensed close-up photograph has not yet been sourced.</figcaption></figure>`;

  T.recap = (b) => `<div class="b-recap"><div class="recap-labels">${(b.labels || []).map((l) => `<span${at(l)}>${esc(l.text)}</span>`).join('')}</div><p class="recap-q"${at({ at: b.questionAt })}>${esc(b.question)}</p></div>`;


  /* ---- Fable 5.1 revision (2026-10-04): learner-facing components without module codes ---- */

  /* Course overview (S02): three stages with short English names; no codes, no timing curve. */
  T.overview = (b) => {
    const r = b.reveal || {};
    const li = (items, a) => `<ul class="ov-list"${at({ at: a })}>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<div class="b-overview" role="group" aria-label="Course overview">
      <ol class="ov-stages">
        <li class="ov-stage ov-now"${at({ at: r.start })}><span class="ov-k">Now</span><h4>Getting started</h4><p>This lesson: who is who, and the three questions behind every job.</p></li>
        <li class="ov-stage"${at({ at: r.foundations })}><span class="ov-k">Then</span><h4>Foundations</h4><p>The Belgian framework and the physics behind protection.</p>${li(['Framework and responsibilities', 'Radiation and quantities', 'Shielding and exposure', 'Effects and dosimetry', 'Instruments and checks', 'Sources and routines'], r.foundationsList)}</li>
        <li class="ov-stage"${at({ at: r.application })}><span class="ov-k">Later</span><h4>Working safely in class II practice</h4><p>From the authorised activity to the response when something unusual happens.</p>${li(['Authorised activity', 'Equipment and safety systems', 'Radioactive sources', 'Measurements', 'Worksite and transport', 'Abnormal situations'], r.applicationList)}</li>
      </ol>
      <p class="ov-note"${at({ at: r.practice })}>Practice questions help you learn; the final assessment is separate.</p>
      <p class="ov-note"${at({ at: r.boundary })}>Practical preparation and your actual appointment still matter.</p>
      ${b.mapButton ? `<button type="button" class="mini map-open" data-drawer="map">Open the course map</button>` : ''}
    </div>`;
  };

  /* Roles picture (S03/S04): kinds of responsibility, built progressively, few labels at a time.
   * Icons are original line drawings; the technician is an original animated-style cutout
   * (app/rt-technician-640.png, credited in Sources and credits). */
  const RICON = {
    office: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="18" y="30" width="84" height="74" rx="6"/><path d="M12 30h96M34 30V18h52v12"/><path d="M34 48h12M54 48h12M74 48h12M34 64h12M54 64h12M74 64h12M34 80h12M74 80h12M54 80v24h12V80"/></svg>',
    company: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M14 104h92"/><rect x="22" y="40" width="46" height="64" rx="4"/><path d="M68 60h30v44H68"/><path d="M22 40l23-16 23 16"/><path d="M34 56h8M48 56h8M34 72h8M48 72h8M34 88h8M48 88h8M78 72h10M78 88h10"/></svg>',
    org: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 16l40 18v12H20V34z"/><path d="M28 46v40M44 46v40M60 46v40M76 46v40M92 46v40M18 86h84v12H18z"/></svg>',
    expert: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="38" r="16"/><path d="M28 104c0-20 14-32 32-32s32 12 32 32"/><path d="M78 20l6-6 6 6-6 6z"/><path d="M50 72l10 10 10-10"/></svg>',
    check: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="24" y="16" width="72" height="88" rx="8"/><path d="M40 44l10 10 20-22M40 74h40M40 88h26"/></svg>',
  };
  T.roles = (b) => {
    const r = b.reveal || {}, f = b.focus || {};
    // rel: the link as a short line inside the card, shown only on narrow stages where connectors are hidden
    const node = (k, cls, title, sub, icon, rel) => `<div class="rl-node rl-${k}${cls ? ' ' + cls : ''}"${at({ at: r[k], focus: f[k] })}><div class="rl-ic">${RICON[icon] || ''}</div><h4>${esc(title)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}${rel ? `<p class="rl-rel">${esc(rel)}</p>` : ''}</div>`;
    const edge = (k, cls, label) => `<div class="rl-edge rl-e-${k}${cls ? ' ' + cls : ''}"${at({ at: r[k] })}><span>${esc(label)}</span></div>`;
    return `<div class="b-roles${b.compact ? ' compact' : ''}" role="img" aria-labelledby="rlT rlD"><span class="sr-only" id="rlT">Belgian responsibilities picture</span><span class="sr-only" id="rlD">FANC, the regulator, sits outside the company and supervises. The NDT company holds the licence and organises a physical control service, headed by the head of service. Because the company has no recognised expert on staff, a recognised physical-control organisation and its expert carry out specified expert tasks under contract. Every industrial radiographer follows the radiation protection agent training; on each worksite the company designates one trained radiographer as the agent, who checks and reports to the service.</span>
      <div class="rl-grid">
        ${node('fanc', 'rl-reg', 'FANC', 'Regulator — outside the company', 'office', 'Supervises the company')}
        ${edge('e_supervises', '', 'supervises')}
        ${node('company', 'rl-co', 'NDT company', 'Licence holder — the operator', 'company')}
        ${node('service', 'rl-co rl-sub', 'Physical control service', 'Organised by the company', 'check')}
        ${edge('e_organises', '', 'organises')}
        ${node('head', 'rl-co rl-sub', 'Head of the service', 'Coordinates · direct access to management', 'check')}
        ${edge('e_contract', '', 'contract')}
        ${node('org', 'rl-ext', 'Recognised organisation', 'External physical-control organisation', 'org', 'Works for the company under contract')}
        ${node('expert', 'rl-ext rl-sub', 'Recognised expert', 'Specified examinations and approvals', 'expert')}
        <div class="rl-tech"${at({ at: r.tech, focus: f.tech })}><img src="rt-technician-640.png" alt="" aria-hidden="true"><div class="rl-techlabel"><h4>Industrial radiographer</h4><p${at({ at: r.training })}>Trained as radiation protection agent — required before operating equipment</p></div></div>
        ${edge('e_designates', '', 'designates on each worksite')}
        ${node('agent', 'rl-co rl-agent', 'Radiation protection agent', 'One trained radiographer per worksite · checks and reports to the service', 'check')}
        <ul class="rl-tasks"${at({ at: r.tasks })}><li>Rules and procedures followed?</li><li>Protective equipment, instruments, dosimeters available and working?</li><li>Abnormal situation → head of service and expert</li></ul>
      </div>
      <p class="rl-summary"${at({ at: r.summary })}>Regulator supervises · company organises · head coordinates · expert approves · agent checks and reports</p>
    </div>`;
  };

  /* Equipment picture (S01): three original drawings of current-style field equipment, each with
   * its own HTML label so text wraps instead of clipping. No manufacturer, model or settings;
   * provenance is stated in Sources and credits (code-technical revision 2026-10-04). */
  function trefoil(cx, cy, R) {
    const p = (a, r) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy - r * Math.sin(a)).toFixed(2)}`;
    const r1 = R * 0.3, r2 = R;
    const blade = (c) => { const a = (c - 30) * Math.PI / 180, b2 = (c + 30) * Math.PI / 180; return `M${p(a, r1)}L${p(a, r2)}A${r2},${r2} 0 0 0 ${p(b2, r2)}L${p(b2, r1)}A${r1},${r1} 0 0 1 ${p(a, r1)}Z`; };
    return `<path d="${[90, 210, 330].map(blade).join('')}" fill="#1f2326"/><circle cx="${cx}" cy="${cy}" r="${(R * 0.2).toFixed(2)}" fill="#1f2326"/>`;
  }
  const EQ_DEFS = `<defs>
    <linearGradient id="eqYel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84a"/><stop offset=".45" stop-color="#f2bf1d"/><stop offset="1" stop-color="#b98a07"/></linearGradient>
    <linearGradient id="eqSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6268"/><stop offset=".22" stop-color="#c9cfd3"/><stop offset=".4" stop-color="#eef1f2"/><stop offset=".62" stop-color="#9aa2a8"/><stop offset="1" stop-color="#4a5055"/></linearGradient>
    <linearGradient id="eqDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5257"/><stop offset="1" stop-color="#22272a"/></linearGradient>
    <linearGradient id="eqHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d868c"/><stop offset=".3" stop-color="#d6dbde"/><stop offset=".55" stop-color="#a7afb4"/><stop offset="1" stop-color="#4c5358"/></linearGradient>
    <linearGradient id="eqBead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5045"/><stop offset=".35" stop-color="#cfc2ab"/><stop offset=".6" stop-color="#8d7f6a"/><stop offset="1" stop-color="#3f382f"/></linearGradient>
    <linearGradient id="eqImg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1f21"/><stop offset=".3" stop-color="#6a7074"/><stop offset=".5" stop-color="#a9afb2"/><stop offset=".7" stop-color="#6a7074"/><stop offset="1" stop-color="#1c1f21"/></linearGradient>
    <radialGradient id="eqBg" cx=".5" cy=".35" r=".85"><stop offset="0" stop-color="#fbf8f2"/><stop offset="1" stop-color="#e7e0d4"/></radialGradient>
    <pattern id="eqStripe" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#22272a"/></pattern>
  </defs>`;
  const EQ_ART = {
    gamma: `<svg viewBox="0 0 400 250" aria-hidden="true" focusable="false">
      <rect width="400" height="250" fill="url(#eqBg)"/>
      <ellipse cx="200" cy="228" rx="190" ry="12" fill="#000" opacity=".08"/>
      <rect x="236" y="40" width="164" height="44" fill="url(#eqSteel)"/>
      <path d="M318,36 C312,52 312,72 318,88 L338,88 C344,72 344,52 338,36 Z" fill="url(#eqBead)"/>
      <path d="M328,84 V174" stroke="#2c3134" stroke-width="5"/>
      <path d="M328,172 L304,226 M328,172 L352,226 M328,172 L328,228" stroke="#2c3134" stroke-width="5" stroke-linecap="round"/>
      <rect x="314" y="92" width="28" height="30" rx="5" fill="url(#eqDark)" stroke="#16191b" stroke-width="2"/>
      <rect x="320" y="88" width="16" height="6" rx="2" fill="#16191b"/>
      <path d="M244,178 C278,180 292,206 312,190 C326,178 326,150 328,124" fill="none" stroke="#f2bf1d" stroke-width="9" stroke-linecap="round"/>
      <path d="M244,178 C278,180 292,206 312,190 C326,178 326,150 328,124" fill="none" stroke="#22272a" stroke-width="9" stroke-dasharray="3 9"/>
      <path d="M104,180 C70,182 76,214 52,214" fill="none" stroke="#22272a" stroke-width="6" stroke-linecap="round"/>
      <rect x="10" y="196" width="50" height="30" rx="6" fill="url(#eqDark)" stroke="#16191b" stroke-width="2"/>
      <circle cx="35" cy="196" r="13" fill="none" stroke="#3a4145" stroke-width="5"/>
      <path d="M35,196 L46,186" stroke="#3a4145" stroke-width="4" stroke-linecap="round"/><circle cx="47" cy="185" r="4" fill="#f2bf1d"/>
      <path d="M112,128 H236 L248,150 V206 L236,214 H112 L100,206 V150 Z" fill="none" stroke="#2a2f33" stroke-width="7" stroke-linejoin="round"/>
      <path d="M140,128 V112 H208 V128" fill="none" stroke="#2a2f33" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      <rect x="114" y="140" width="120" height="66" rx="16" fill="url(#eqYel)" stroke="#8a6a06" stroke-width="2"/>
      <rect x="120" y="146" width="108" height="8" rx="4" fill="#fff" opacity=".35"/>
      <circle cx="174" cy="173" r="20" fill="#ffe680" stroke="#8a6a06" stroke-width="1.5"/>
      ${trefoil(174, 173, 16)}
      <rect x="234" y="168" width="16" height="20" rx="3" fill="url(#eqSteel)" stroke="#3a4145" stroke-width="1.5"/>
      <rect x="98" y="168" width="16" height="20" rx="3" fill="url(#eqSteel)" stroke="#3a4145" stroke-width="1.5"/>
      <circle cx="126" cy="218" r="10" fill="#22272a"/><circle cx="126" cy="218" r="4" fill="#8b9399"/>
      <circle cx="222" cy="218" r="10" fill="#22272a"/><circle cx="222" cy="218" r="4" fill="#8b9399"/>
    </svg>`,
    xray: `<svg viewBox="0 0 400 250" aria-hidden="true" focusable="false">
      <rect width="400" height="250" fill="url(#eqBg)"/>
      <ellipse cx="190" cy="226" rx="185" ry="12" fill="#000" opacity=".08"/>
      <path d="M96,160 L82,214 M236,160 L250,214" stroke="#2c3134" stroke-width="7" stroke-linecap="round"/>
      <path d="M70,214 H100 M232,214 H262" stroke="#2c3134" stroke-width="6" stroke-linecap="round"/>
      <path d="M112,96 C112,70 148,70 148,96 M200,96 C200,70 236,70 236,96" fill="none" stroke="#2a2f33" stroke-width="7" stroke-linecap="round"/>
      <rect x="54" y="92" width="226" height="74" rx="20" fill="url(#eqHead)" stroke="#33393d" stroke-width="2"/>
      <rect x="54" y="92" width="34" height="74" rx="14" fill="url(#eqYel)" stroke="#8a6a06" stroke-width="2"/>
      ${[100, 112, 124, 136, 148, 160].map((x) => `<rect x="${x}" y="94" width="6" height="70" rx="2" fill="#5b6268" opacity=".55"/>`).join('')}
      <rect x="182" y="110" width="60" height="38" rx="6" fill="url(#eqYel)" stroke="#8a6a06" stroke-width="1.5"/>
      ${trefoil(212, 129, 13)}
      <path d="M280,104 L304,114 V144 L280,154 Z" fill="url(#eqDark)" stroke="#16191b" stroke-width="2"/>
      <rect x="302" y="120" width="8" height="18" rx="2" fill="#16191b"/>
      <path d="M58,150 C24,160 24,206 70,226 C150,246 270,238 300,214" fill="none" stroke="#22272a" stroke-width="5" stroke-linecap="round"/>
      <rect x="296" y="168" width="94" height="58" rx="9" fill="url(#eqDark)" stroke="#16191b" stroke-width="2"/>
      <rect x="306" y="178" width="50" height="26" rx="3" fill="#3f7d80"/>
      <path d="M312,186 h22 M312,194 h34" stroke="#d9f0ee" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="372" cy="186" r="6" fill="#c7d0d4"/><circle cx="372" cy="206" r="6" fill="#c7d0d4"/>
      <rect x="306" y="210" width="50" height="8" rx="3" fill="#5b6268"/>
      <path d="M364,168 V156" stroke="#22272a" stroke-width="4"/>
      <path d="M356,156 h16 l-2,-14 h-12 z" fill="#f29a1d" stroke="#8a5207" stroke-width="1.5"/>
    </svg>`,
    detector: `<svg viewBox="0 0 400 250" aria-hidden="true" focusable="false">
      <rect width="400" height="250" fill="url(#eqBg)"/>
      <ellipse cx="200" cy="230" rx="190" ry="11" fill="#000" opacity=".08"/>
      <rect x="78" y="34" width="128" height="140" rx="10" fill="url(#eqDark)" stroke="#16191b" stroke-width="2"/>
      <rect x="78" y="34" width="18" height="18" rx="6" fill="#f2bf1d"/><rect x="188" y="34" width="18" height="18" rx="6" fill="#f2bf1d"/>
      <rect x="78" y="156" width="18" height="18" rx="6" fill="#f2bf1d"/><rect x="188" y="156" width="18" height="18" rx="6" fill="#f2bf1d"/>
      <rect x="118" y="40" width="48" height="8" rx="4" fill="#16191b"/>
      <circle cx="194" cy="66" r="3.5" fill="#57c17a"/>
      <rect x="0" y="80" width="300" height="50" fill="url(#eqSteel)"/>
      <path d="M130,74 C124,92 124,118 130,136 L152,136 C158,118 158,92 152,74 Z" fill="url(#eqBead)"/>
      <rect x="92" y="78" width="10" height="54" fill="#f2bf1d" opacity=".9"/><rect x="182" y="78" width="10" height="54" fill="#f2bf1d" opacity=".9"/>
      <path d="M142,174 C142,206 200,214 238,200" fill="none" stroke="#22272a" stroke-width="5" stroke-linecap="round"/>
      <rect x="232" y="124" width="158" height="102" rx="12" fill="url(#eqDark)" stroke="#16191b" stroke-width="2"/>
      <rect x="244" y="134" width="134" height="80" rx="4" fill="url(#eqImg)"/>
      <path d="M302,134 C298,158 298,190 302,214 L320,214 C324,190 324,158 320,134 Z" fill="#d7dcde" opacity=".55"/>
      <rect x="244" y="134" width="134" height="80" rx="4" fill="none" stroke="#0e1011" stroke-width="2"/>
    </svg>`,
  };
  T.equipment = (b) => {
    const r = b.reveal || {};
    const item = (k, title, text) => `<section class="eq-card eq-${k}"${at({ at: r[k] })}><div class="eq-art">${EQ_ART[k]}</div><div class="eq-txt"><h4>${esc(title)}</h4><p>${esc(text)}</p></div></section>`;
    return `<figure class="b-equip"${at(b)} role="group" aria-label="Industrial radiography equipment"><svg class="eq-defs" width="0" height="0" aria-hidden="true" focusable="false">${EQ_DEFS}</svg>
      <div class="eq-grid">
        ${item('gamma', 'Gamma projector', 'A shielded container for a sealed radioactive source. The source is wound out through a guide tube by remote control, and back in afterwards.')}
        ${item('xray', 'X-ray generator', 'Produces radiation only while it is switched on. It is operated from a separate control unit at a distance.')}
        ${item('detector', 'Digital detector', 'Records the image digitally, as an alternative to film. It can be used with X-ray or gamma radiation.')}
      </div>
    </figure>`;
  };

  /* ---- full-B1 build 2026-10-05: clearer diagrams and the components lessons 2-6 need ---- */

  /* A limit is a boundary, not a target (replaces the decorative rising line). Schematic: no axis, no values. */
  T.limitview = (b) => `<figure class="b-limitv" role="img" aria-label="Schematic: the legal dose limit is a boundary that may not be exceeded. The space below it is not unused dose to spend. Being below the limit does not complete the reasoning: justification and optimisation still apply, and a comparison needs the same quantity, the same person or group and the same period. No values are shown.">
    <div class="lv-col">
      <div class="lv-limit"${at({ at: b.limitAt })}><span class="lv-k">Legal dose limit</span><span>The boundary that may not be exceeded</span></div>
      <div class="lv-gap"${at({ at: b.gapAt })}><span class="lv-arrow" aria-hidden="true"></span><span class="lv-false"${at({ at: b.falseAt })}><s>Unused dose to spend</s><b>Not an allowance to use up</b></span></div>
      <div class="lv-plan"${at({ at: b.planAt })}><span class="lv-k">The job's recorded or expected dose</span><span>Below the limit — and the reasoning is not finished yet</span></div>
    </div>
    <div class="lv-side">
      <div class="lv-box"${at({ at: b.stillAt })}><h4>Still needed</h4><ul><li>Justification</li><li>Optimisation</li></ul></div>
      <div class="lv-box"${at({ at: b.matchAt })}><h4>To compare, these must match</h4><ul><li>Quantity</li><li>Person or group</li><li>Period</li></ul></div>
    </div>
    <figcaption>Schematic — no dose values are shown or implied.</figcaption></figure>`;

  /* Changed access route: large, before/after, the conflict highlighted (replaces the small cluttered sketch). */
  T.routeplan = (b) => `<figure class="b-routeplan"${at(b)}><svg viewBox="0 0 900 470" role="img" aria-labelledby="rpT"><title id="rpT">Conceptual planning sketch. The area kept clear during exposures lies between the workshop and the stores. On the agreed plan the walkway route passes around it. Since this morning the walkway route runs straight through it. No distances are shown.</title>
      <defs><pattern id="rpHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#f3e3d3"/><rect width="5" height="14" fill="#e9cdb2"/></pattern>
      <marker id="rpArrO" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="30" markerHeight="30" orient="auto"><path d="M0 0L10 5L0 10z" fill="#c2541f"/></marker>
      <marker id="rpArrG" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="24" markerHeight="24" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7b8a8f"/></marker></defs>
      <rect x="4" y="4" width="892" height="462" rx="20" fill="#f7f4ee" stroke="#ddd4c6" stroke-width="2"/>
      <rect x="40" y="40" width="230" height="150" rx="10" fill="#e3ddd2" stroke="#b9ae9c" stroke-width="2"/><text x="155" y="124" text-anchor="middle" class="rp-b">Workshop</text>
      <rect x="640" y="290" width="220" height="140" rx="10" fill="#e3ddd2" stroke="#b9ae9c" stroke-width="2"/><text x="750" y="368" text-anchor="middle" class="rp-b">Stores</text>
      <g${at({ at: b.areaAt })}><ellipse cx="450" cy="245" rx="175" ry="112" fill="url(#rpHatch)" stroke="#c99a6b" stroke-width="3" stroke-dasharray="10 7"/><text x="450" y="182" text-anchor="middle" class="rp-a">Area kept clear</text><text x="450" y="212" text-anchor="middle" class="rp-a">during exposures</text></g>
      <g class="rp-old"${at({ at: b.oldAt })}><path d="M270,150 C330,60 560,40 660,110 C720,150 760,220 750,290" fill="none" stroke="#7b8a8f" stroke-width="7" stroke-dasharray="16 11" stroke-linecap="round" marker-end="url(#rpArrG)"/><g class="rp-pill"><rect x="388" y="16" width="320" height="42" rx="21" fill="#fff" stroke="#9aa5aa" stroke-width="2"/><text x="548" y="44" text-anchor="middle" class="rp-l">Route on the agreed plan</text></g></g>
      <g class="rp-new"${at({ at: b.newAt })}><path d="M205,190 C260,230 320,250 450,248 C580,246 640,262 690,290" fill="none" stroke="#c2541f" stroke-width="11" stroke-linecap="round" marker-end="url(#rpArrO)"/><g class="rp-pill"><rect x="50" y="392" width="420" height="46" rx="23" fill="#c2541f"/><text x="260" y="422" text-anchor="middle" class="rp-n">Walkway route since this morning</text></g></g>
      <g class="rp-hit"${at({ at: b.hitAt })}><circle cx="450" cy="300" r="26" fill="#fff" stroke="#c2541f" stroke-width="5"/><text x="450" y="313" text-anchor="middle" class="rp-x">!</text><g class="rp-pill"><rect x="486" y="282" width="330" height="40" rx="10" fill="#fff" stroke="#c2541f" stroke-width="2.5"/><text x="651" y="309" text-anchor="middle" class="rp-w">Now crosses the clear area</text></g></g>
    </svg><ul class="rp-legend" aria-hidden="true"><li class="old"${at({ at: b.oldAt })}>Route on the agreed plan</li><li class="new"${at({ at: b.newAt })}>Walkway route since this morning</li><li class="hit"${at({ at: b.hitAt })}>Now crosses the clear area</li></ul><figcaption>Conceptual planning sketch — no exclusion distances.</figcaption></figure>`;

  /* Timeline / step sequence: steps revealed one by one; an optional gate step is set apart. */
  T.timeline = (b) => `<div class="b-timeline">${b.heading ? `<h3 class="b-h">${esc(b.heading)}</h3>` : ''}<ol class="tl-steps">${(b.steps || []).map((s, i) => `<li class="tl-step${s.gate ? ' gate' : ''}${s.strong ? ' strong' : ''}"${at(s)}><span class="tl-dot" aria-hidden="true">${s.gate ? '◆' : i + 1}</span><div><h4>${esc(s.title)}</h4>${s.when ? `<p class="tl-when">${esc(s.when)}</p>` : ''}${s.text ? `<p>${esc(s.text)}</p>` : ''}</div></li>`).join('')}</ol>${b.caption ? `<p class="b-cap"${at(b.captionAt ? { at: b.captionAt } : null)}>${esc(b.caption)}</p>` : ''}</div>`;

  /* Reference table with highlighted rows (e.g. a dated extract of notification criteria). */
  T.table = (b) => `<figure class="b-table"${at(b)}>${b.title ? `<figcaption class="tb-t">${esc(b.title)}</figcaption>` : ''}<table><thead><tr>${b.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr class="${(b.highlight || []).includes(r.id) ? 'hl' : ''}"${at(r)}>${r.cells.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table>${b.foot ? `<p class="tb-f">${esc(b.foot)}</p>` : ''}</figure>`;

  /* Original cutaway of a radiography bunker: enclosure, lockable door, warning light, control post outside. */
  T.bunker = (b) => {
    const r = b.reveal || {};
    return `<figure class="b-bunker"><svg viewBox="0 0 820 400" role="img" aria-labelledby="bkT"><title id="bkT">Original cutaway illustration of a radiography bunker: shielding walls and roof, a lockable door${b.doorOpen ? ' standing ajar' : ''}, a warning light above the door, and the control post outside with the remote control.</title>
      <rect x="0" y="0" width="820" height="400" rx="18" fill="#f3efe7"/>
      <rect x="0" y="340" width="820" height="60" fill="#e2dbcf"/>
      <g${at({ at: r.walls })}><path d="M60,340 V110 H520 V340" fill="none" stroke="#8d969b" stroke-width="34" stroke-linejoin="round"/><rect x="77" y="127" width="426" height="213" fill="#e7e3dc"/><text x="290" y="232" text-anchor="middle" class="bk-l">Shielding enclosure</text></g>
      <g${at({ at: r.work })}><rect x="210" y="290" width="160" height="50" rx="6" fill="#b9a487"/><circle cx="290" cy="270" r="18" fill="#6d7479"/><text x="290" y="324" text-anchor="middle" class="bk-s">workpiece</text></g>
      <g${at({ at: r.door })}><rect x="503" y="210" width="${b.doorOpen ? 12 : 34}" height="130" fill="#5f686d"/>${b.doorOpen ? '<path d="M515,210 L575,232 L575,352 L515,340 Z" fill="#7b858a" stroke="#4b5257" stroke-width="2"/>' : ''}<text x="512" y="380" class="bk-s">${b.doorOpen ? 'door ajar' : 'lockable door'}</text></g>
      <g${at({ at: r.light })}><rect x="506" y="160" width="28" height="22" rx="4" fill="#3b4246"/><circle cx="520" cy="171" r="7" fill="${b.lightOn ? '#f29a1d' : '#9aa2a6'}"/>${b.lightOn ? '<circle cx="520" cy="171" r="14" fill="#f29a1d" opacity=".25"/>' : ''}<text x="548" y="176" class="bk-s">warning light${b.lightOn ? ' on' : ''}</text></g>
      <g${at({ at: r.post })}><rect x="640" y="250" width="130" height="90" rx="10" fill="#2f3539"/><rect x="654" y="264" width="62" height="34" rx="3" fill="#3f7d80"/><circle cx="740" cy="280" r="8" fill="#c7d0d4"/><rect x="654" y="308" width="102" height="10" rx="4" fill="#5b6268"/><text x="705" y="236" text-anchor="middle" class="bk-l">Control post</text></g>
      ${b.time ? `<g${at({ at: r.time })}><rect x="40" y="20" width="150" height="54" rx="12" fill="#fff" stroke="#c9bfae" stroke-width="2"/><text x="115" y="56" text-anchor="middle" class="bk-t">${esc(b.time)}</text></g>` : ''}
    </svg><figcaption>Original illustration — not a real installation.</figcaption></figure>`;
  };

  /* Two directions across a company line (external workers). */
  T.twoway = (b) => `<div class="b-twoway"${at(b)}>
      <div class="tw-side tw-us"><h4>${esc(b.left || 'Our company')}</h4><p>${esc(b.leftSub || '')}</p></div>
      <div class="tw-mid"><div class="tw-arrow out"${at({ at: b.outAt })}><span>${esc(b.out)}</span></div><div class="tw-line" aria-hidden="true"></div><div class="tw-arrow in"${at({ at: b.inAt })}><span>${esc(b.in)}</span></div></div>
      <div class="tw-side tw-them"><h4>${esc(b.right || 'Other undertakings')}</h4><p>${esc(b.rightSub || '')}</p></div>
      ${b.caption ? `<p class="b-cap"${at(b.captionAt ? { at: b.captionAt } : null)}>${esc(b.caption)}</p>` : ''}</div>`;

  /* Two versions of a form side by side (no real procedure text). */
  T.formpair = (b) => `<div class="b-formpair">${(b.forms || []).map((f) => `<section class="fp-form ${f.tone ? 'tone-' + esc(f.tone) : ''}"${at(f)}><span class="tag">${esc(f.tag)}</span><div class="fp-lines" aria-hidden="true"><i></i><i></i><i class="${f.mark ? 'mark' : ''}"></i><i></i></div><p>${esc(f.text)}</p>${f.status ? `<p class="stline">${status(f.status, f.statusText)}</p>` : ''}</section>`).join('')}${b.caption ? `<p class="b-cap"${at(b.captionAt ? { at: b.captionAt } : null)}>${esc(b.caption)}</p>` : ''}</div>`;

  const baseCards = T.cards;
  T.cards = (b, s, ctx) => baseCards(b, s, ctx) + (b.sourcesButton ? `<button type="button" class="mini" data-drawer="refs">Open sources for this lesson</button>` : '');

  function render(spec, scene, ctx) {
    const fn = T[spec.type];
    if (!fn) return `<p class="b-missing">Missing component: ${esc(spec.type)}</p>`;
    return fn(spec, scene, ctx || {});
  }
  window.Boards = { render, ICONS, esc, status };
})();
