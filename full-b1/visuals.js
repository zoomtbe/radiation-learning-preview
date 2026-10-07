/* Scene composition for the owner reset. Approved raster art stays unchanged.
   Narrated scenes use one visual focus, with document detail in an intentional reader. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = $('visual'), stage = $('stage'), cast = $('cast');
  const family = {
    'B1.1': ['intro','route','org','letters','document','principles','document','site','site','thresholds','site','folders','site','hold','recap'],
    'B1.2': ['people','messages','org','document','revision','training','document','roles','hold','hold','document','security','appointments','recap'],
    'B1.3': ['bunker','document','timeline','timeline','bunker','bunker','factors','hold','hold','document','document','map','recap'],
    'B1.4': ['people','people','document','handover','document','document','document','assignment','document','document','recap'],
    'B1.5': ['lanes','bunker','lanes','hold','document','org','criteria','criteria','document','document','criteria','security','timeline','document','recap'],
    'B1.6': ['planner','document','document','site','site','site','document','equipment','recap']
  };
  const documentFallback = {
    'B1.1': {4:'DOC-REG-EXTRACT',5:'DOC-REQ',7:'DOC-TECH-JUST',12:'DOC-LICENCE',14:'DOC-HOLD-CARD'},
    'B1.2': {4:'DOC-PROCEDURE-RECORD',5:'DOC-CHECK-SHEET',7:'DOC-CERT-AGENT',11:'DOC-EVENT-RECORD'},
    'B1.3': {2:'DOC-LICENCE',10:'DOC-CHANGE-REGISTER',11:'DOC-CHANGE-REGISTER'},
    'B1.4': {3:'DOC-EXT-WORKER-FILE',4:'DOC-EXT-WORKER-FILE',5:'DOC-AGREEMENT',6:'DOC-AGREEMENT',7:'DOC-AGREEMENT',8:'DOC-INSTRUCTION-RECORD',9:'DOC-AGREEMENT',10:'DOC-EXT-WORKER-FILE'},
    'B1.5': {5:'DOC-EVENT-RECORD',9:'DOC-EVENT-RECORD',10:'DOC-NOTIFICATION',14:'DOC-EVENT-RECORD'},
    'B1.6': {2:'DOC-REQ',3:'DOC-PLANNING',7:'DOC-LOC-JUST'}
  };
  const conciseFields = {
    'DOC-REQ': [['Job','TS-V2 · teaching sample'],['Examination day','Thursday'],['Client contact','Bram · maintenance manager'],['Component / welds','Vessel V-2 · W-07 and W-08'],['Material','Carbon steel'],['Dimensions','12 mm · 1 200 mm (sample)'],['Extent','100% of both welds'],['Method','RT'],['Technique','ISO 17636-2:2022'],['Acceptance','ISO 10675-1:2021 · project criteria'],['Personnel certification','ISO 9712:2021 · project specification'],['Attachments','Drawing V2-GA rev C · justifications'],['Confirmation','Responsible role · placeholder']],
    'DOC-TECH-JUST': [['Assignment','Repair of vessel V-2 shell welds'],['3a · Recognised standard requiring RT','None identified'],['3b · Project requirement','Fictional PS-V2 rev C §6.3 · 100% RT'],['3c · Risk analysis','Attached · RT selected for these welds'],['Prepared by','Client’s competent welding/NDT engineer'],['Attachments','Risk analysis · project specification']],
    'DOC-LOC-JUST': [['Workpiece','Installed vessel on saddles'],['Bunker assessed','Dismantling and transport assessed; reasons recorded'],['Infrastructure assessed','Fixed shielding assessed; reasons recorded'],['Conclusion','Hall, after both risk analyses'],['Client information','Occupancy · walkways · store · crane'],['Attachments','Assessment and supporting evidence']],
    'DOC-EXT-WORKER-FILE': [['Sending employer','Identity fields · placeholders'],['Worker','Clara · visiting radiographer'],['Five calendar years','Provided, for each year'],['Last twelve rolling months','NOT PROVIDED · monitoring period missing'],['Other exposures','None declared'],['Assignment abroad','Not applicable'],['Instruction scope','Bunker · bunker X-ray set']],
    'DOC-AGREEMENT': [['Parties','External undertaking / operator'],['A · Dosimetric monitoring','External undertaking'],['B · Personal protective equipment','External undertaking'],['C · Specific task instruction','Operator'],['Signatures','Illustrative placeholders']],
    'DOC-CONTROL-TEST-PROGRAMME': [['Safety device','Door interlock'],['Record columns','Result · date · tested by'],['Previous month','Satisfactory · placeholders'],['This month','— · — · —']],
    'DOC-EVENT-RECORD': [['Observed','What happened · time · place'],['Work and protection','Actual status and actions'],['Contacted','Who · when · contact successful?'],['Not established','Cause · dose, unless assessed']],
    'DOC-INSTRUCTION-RECORD': [['Worker','Clara'],['Area','Company bunker'],['Equipment','Bunker X-ray set'],['Task','Radiography of castings'],['Instruction','Role / date · placeholders']],
    'DOC-ASSIGNMENT-SLIP': [['Worker','Clara'],['New area','Hall two'],['Equipment','Gamma projector'],['Task','Gamma exposures this afternoon'],['Requested by','Responsible role']],
    'DOC-NOTIFICATION': [['Event','What · where · when · discovery'],['Equipment / sources','Identified equipment'],['Consequences','Dose under assessment'],['Causes','Suspected only, if known'],['Urgent measures','Actual measures taken'],['Event management','Responsible role'],['Follow-up','Physician / INES where applicable'],['Notifier','Responsible role']],
    'DOC-LICENCE': [['Authorised practice','Industrial radiography'],['Installations','Company bunker / clients’ sites'],['Equipment','Scope and inventory · placeholders'],['Sources','Scope · placeholders'],['Conditions','Applicable conditions'],['Acceptance evidence','Required evidence · placeholders']],
    'DOC-CERT-BUNKER': [['Bunker','Description and location'],['Permitted sources','Isotopes / maximum activity · placeholders'],['X-ray parameters','Maximum voltage / current · placeholders'],['Configurations','Permitted working configurations'],['Safety logic','Electrical diagram referenced'],['Validity','Maximum ten years'],['Drawn up by','Recognised expert in physical control']],
    'DOC-REG-EXTRACT': [['Regulatory reference','ARBIS / RGPRI · Article 20.1.1'],['Principles','Justification · optimisation · dose limits'],['Role of this document','Requirements that apply']],
    'DOC-PROCEDURE-RECORD': [['Procedure','Title / version · placeholders'],['Approval','Recognised expert · role only'],['Method','Approved way of working'],['Record','What was checked · result · date · by whom']],
    'DOC-PLANNING': [['Worksite','Client’s hall · Thursday'],['Team','Daniel / Clara · conditions apply'],['Designated agent','Company decision recorded'],['Equipment','Equipment for this assignment'],['Client contact','Bram']],
    'DOC-HOLD-CARD': [['Status','BUNKER USE ON HOLD'],['Reason','This month’s interlock result not established'],['Reporting','Informed roles recorded']]
  };
  function rows(id) {
    const c=current?.p.cue||'';
    if(id==='DOC-CERT-AGENT'&&c.startsWith('B1.4'))return [['Holder','Clara'],['Theoretical training','Knowledge test passed'],['Training body','Illustrative placeholder'],['Date','Illustrative placeholder']];
    if(id==='DOC-PLANNING'&&c==='B1.2-S02-P1')return [['Worksite','Assignment planning'],['Radiographer','Daniel'],['Designated agent','Not yet entered'],['Required action','Company designation for this worksite']];
    if(id==='DOC-CONTROL-TEST-PROGRAMME'&&c.startsWith('B1.1-S14'))return [['Safety device','Bunker safety checks'],['Record columns','Result · date · checked by'],['This morning','— · — · —'],['Evidence status','Check not established'],['Follow-up','Resolve the missing record under the procedure']];
    if(id==='DOC-EVENT-RECORD'&&c.startsWith('B1.2-S11'))return [['Observed','Survey meter failed its pre-use function check'],['Done','Exposure held; no exposure made'],['Contacted','Supervisor and client contact informed; service called'],['Expert','Service contacting the expert'],['Cause',c.endsWith('P3')?'Draft: The battery must be faulty.':'Not established']];
    if(id==='DOC-EVENT-RECORD'&&c.startsWith('B1.5'))return [['When / where','Tuesday 10:12 · company bunker'],['Observed','Door opened; interlock did not cut exposure'],['Done','Daniel stopped exposure; bunker out of use'],['Contacted',c.includes('S14')?'Agency: successful direct contact at 10:40':'Actual contact status recorded'],['Dose',c==='B1.5-S14-P1'?'DRAFT — zero':'Not established · under assessment'],['Cause','Not established']];
    if(id==='DOC-EVENT-RECORD'&&c.startsWith('B1.6-S06'))return [['Observed','Workers crossed the perimeter; contact person away'],['Done','Radiography held; no exposure started'],['Contacted','Luc and Emilia informed; Bram called back'],['Open','Can the access route be kept closed?'],['Next','Client controls access; team verifies before resuming']];
    return conciseFields[id] || (COURSE.documents[id]?.fields || []).map(f => {
      const bits = f.split(/ — |: /); return [bits.shift(), bits.join(' · ') || 'Teaching excerpt'];
    });
  }
  function paper(id, idx = -1, page = 1) {
    const doc = COURSE.documents[id] || {title:id,pages:1};
    const wrap=(text,max)=>{const lines=[''];String(text).split(/\s+/).forEach(w=>{if((lines.at(-1)+' '+w).length>max&&lines.at(-1))lines.push(w);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+w;});return lines;};
    const title=wrap(doc.title.replace(/ \(teaching sample\)| — teaching excerpt| \(teaching reader\)/gi,''),36);
    const rr=rows(id), y0=128+title.length*15, lineHeight=Math.min(70,(730-y0)/rr.length);
    const heading=title.map((line,j)=>`<text x="35" y="${73+j*27}" font-size="23" font-weight="600">${esc(line)}</text>`).join('');
    const fields=rr.map((r,i)=>{const y=y0+i*lineHeight,lines=wrap(r[1],47);return `<g ${i===idx?'class="paper-selected"':''}><rect x="30" y="${y-16}" width="535" height="${lineHeight-3}" fill="${i===idx?'#e7efdb':'transparent'}"/><text x="40" y="${y}" font-size="13" font-weight="600">${esc(r[0])}</text>${lines.map((line,j)=>`<text x="40" y="${y+17+j*15}" font-size="13" fill="#4a6058">${esc(line)}</text>`).join('')}<path d="M35 ${y+lineHeight-19}H560" stroke="#deded3"/></g>`;}).join('');
    return `<div class="paper" data-document="${esc(id)}"><svg viewBox="0 0 595 842" role="img" aria-label="${esc(doc.title)}; full-page overview"><rect width="595" height="842" fill="#fffefa"/><g font-family="Segoe UI,sans-serif" fill="#26453d"><text x="35" y="35" font-size="12" letter-spacing="2">TRAINING DOCUMENT</text>${heading}<path d="M35 ${91+(title.length-1)*27}H560" stroke="#294d45" stroke-width="2"/><text x="35" y="${112+(title.length-1)*27}" font-size="10" fill="#7d887e">ILLUSTRATIVE · NO REAL CLIENT RECORD</text>${fields}<path d="M35 795H560" stroke="#d5d8cc"/><text x="35" y="817" font-size="11" fill="#788d7c">Sample / role placeholders</text><text x="555" y="817" text-anchor="end" font-size="11">${page} / ${doc.pages}</text></g></svg></div>`;
  }
  function documentView(id, hint, label, beat = 0) {
    const rr = rows(id), words = (hint || '').toLowerCase().match(/[a-z]{4,}/g) || [];
    let idx = Math.min(beat, rr.length-1), best = 0;
    rr.forEach((r,i)=>{const score = words.reduce((s,w)=>s+(r.join(' ').toLowerCase().includes(w)?1:0),0);if(score>best){idx=i;best=score;}});
    if (/twelve|12 rolling|not provided/i.test(hint)) idx = id==='DOC-EXT-WORKER-FILE'?3:idx;
    else if(id==='DOC-EXT-WORKER-FILE'&&/five.year|five calendar/i.test(hint))idx=2;
    const r = rr[idx] || ['', ''];
    // The close-up is the selected field's value, not a quotation from the case.
    const display = r[1];
    return `<div class="page-layout">${paper(id,idx,id==='DOC-EXT-WORKER-FILE'&&idx>1?2:1)}<div class="evidence-focus"><div class="eyebrow">One field in focus</div><h3>${esc(r[0])}</h3><p>${esc(display || r[1])}</p><button class="page-view-link" data-open-doc="${esc(id)}">Open document</button></div></div>`;
  }
  function sprite(name, poseIndex = 0, anchor = 'right', height = .77) {
    const data = CAST.people[name]; if(!data || name==='tom')return null;
    const p = Object.values(data.poses)[poseIndex] || Object.values(data.poses)[0];
    const d = document.createElement('div'); d.className='person';d.dataset.person=name;d.dataset.pose=Object.keys(data.poses)[poseIndex]||Object.keys(data.poses)[0];
    d.setAttribute('role','img');d.setAttribute('aria-label',data.name);
    const h = stage.clientHeight*height, scale = h/(p.bounds[3]-p.bounds[1]);
    const width=(p.bounds[2]-p.bounds[0]+12)*scale;
    Object.assign(d.style,{height:`${h+12*scale}px`,width:`${width}px`,backgroundImage:`url('${data.src}')`,backgroundSize:`${data.size[0]*scale}px ${data.size[1]*scale}px`,backgroundPosition:`${-(p.bounds[0]-6)*scale}px ${-(p.bounds[1]-6)*scale}px`});
    if(anchor==='right')d.style.right='3%'; else if(anchor==='left')d.style.left='5%';else d.style.left=anchor;
    d.innerHTML=`<span class="person-name">${esc(data.name)}</span>`;cast.append(d);return d;
  }
  const labelHTML = text => text?`<div class="figure-caption"><span>${esc(text)}</span></div>`:'';
  function welcomePrinciples(guide = false) {
    return `<figure class="welcome-principles" aria-label="Welcome to radiation protection training: justification, optimisation and dose limitation.">
      <header class="welcome-heading"><span class="eyebrow">${guide?'Your course guide':'Welcome to your training'}</span><h2>${guide?'Emilia':'Radiation protection starts here.'}</h2><p>${guide?'Head of the physical control service':'Protecting you and the people around you.'}</p></header>
      <svg class="welcome-drawing" viewBox="0 0 810 285" role="img" aria-label="A radiation symbol connects a balance, a shield reducing exposure, and a dial with a marked boundary.">
        <defs>
          <linearGradient id="welcome-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#70948c"/><stop offset=".5" stop-color="#376e68"/><stop offset="1" stop-color="#214f4e"/></linearGradient>
          <linearGradient id="welcome-gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#f3d675"/><stop offset="1" stop-color="#d8a43e"/></linearGradient>
          <linearGradient id="welcome-ivory" x2="0" y2="1"><stop stop-color="#fffef7"/><stop offset="1" stop-color="#e5e6db"/></linearGradient>
          <filter id="welcome-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#254c46" flood-opacity=".13"/></filter>
          <g id="welcome-trefoil"><circle r="34" fill="url(#welcome-gold)" stroke="#514629" stroke-width="2"/><g fill="#283b37" transform="rotate(-30)"><path d="M-9-5L-25-14.4A29 29 0 0 1 0-29V-10A10 10 0 0 0-9-5Z"/><path d="M-9-5L-25-14.4A29 29 0 0 1 0-29V-10A10 10 0 0 0-9-5Z" transform="rotate(120)"/><path d="M-9-5L-25-14.4A29 29 0 0 1 0-29V-10A10 10 0 0 0-9-5Z" transform="rotate(240)"/><circle r="6"/></g></g>
        </defs>
        <path class="welcome-connection" d="M405 88V104M405 104H139Q135 104 135 110V122M405 104V126M405 104H671Q675 104 675 110V122" fill="none" stroke="#b9c9bd" stroke-width="2"/>
        <circle cx="405" cy="104" r="4" fill="#679084"/>
        <g transform="translate(405 49)" filter="url(#welcome-shadow)"><circle r="42" fill="#fffdf5"/><use href="#welcome-trefoil"/></g>
        <ellipse cx="135" cy="264" rx="90" ry="9" fill="#c9d2c2" opacity=".42"/>
        <ellipse cx="405" cy="264" rx="90" ry="9" fill="#c9d2c2" opacity=".42"/>
        <ellipse cx="675" cy="264" rx="90" ry="9" fill="#c9d2c2" opacity=".42"/>
        <g filter="url(#welcome-shadow)">
          <path d="M91 257L106 248H164L179 257V263H91Z" fill="url(#welcome-metal)"/>
          <path d="M131 150H139V250H131Z" fill="url(#welcome-gold)" stroke="#aa8741"/>
          <g class="welcome-balance">
            <path d="M58 163L135 147L212 163" fill="none" stroke="#376960" stroke-width="7" stroke-linecap="round"/>
            <path d="M64 164L43 221M64 164L85 221M206 164L185 221M206 164L227 221" fill="none" stroke="#ba994e" stroke-width="2"/>
            <path d="M39 221H89Q86 237 64 237Q42 237 39 221M181 221H231Q228 237 206 237Q184 237 181 221" fill="url(#welcome-gold)" stroke="#b39450" stroke-width="1.5"/>
            <circle cx="64" cy="204" r="16" fill="#e6eee6" stroke="#6e998b" stroke-width="2"/>
            <path d="M57 204L62 209L71 198" fill="none" stroke="#467c6d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="206" cy="204" r="16" fill="#eee5c8" stroke="#bda76c" stroke-width="2"/>
            <path d="M206 196V205M206 211V212" stroke="#8e743b" stroke-width="3" stroke-linecap="round"/>
          </g>
          <circle cx="135" cy="150" r="7" fill="#ead39a" stroke="#b69757"/>
        </g>
        <g class="welcome-exposure" fill="none" stroke-linecap="round">
          <path d="M316 174H360M310 194H360M316 214H360" stroke="#d8b258" stroke-width="4"/>
          <path class="welcome-beam" d="M319 174H338M313 194H332M319 214H338" stroke="#f5dfa3" stroke-width="4"/>
          <path d="M447 184H469M447 204H465" stroke="#96b2a2" stroke-width="2" stroke-dasharray="3 8"/>
        </g>
        <g filter="url(#welcome-shadow)">
          <path d="M405 133Q425 149 444 151V189Q442 225 405 245Q368 225 366 189V151Q387 149 405 133Z" fill="url(#welcome-metal)" stroke="#305e57" stroke-width="2"/>
          <path d="M405 145Q419 156 434 159V189Q432 216 405 233Q378 216 376 189V159Q392 156 405 145Z" fill="none" stroke="#b2c9b5" stroke-opacity=".65"/>
          <g stroke="#dfeddb" stroke-width="3" stroke-linecap="round"><path d="M387 177H423M387 193H423M387 209H423"/><circle cx="398" cy="177" r="4" fill="#d6b85f"/><circle cx="414" cy="193" r="4" fill="#d6b85f"/><circle cx="395" cy="209" r="4" fill="#d6b85f"/></g>
        </g>
        <g filter="url(#welcome-shadow)">
          <path d="M602 253V211A73 73 0 0 1 748 211V253Z" fill="url(#welcome-metal)" stroke="#315f5a" stroke-width="2"/>
          <path d="M614 249V211A61 61 0 0 1 736 211V249Z" fill="url(#welcome-ivory)"/>
          <path d="M625 222a51 51 0 0 1 76-54" fill="none" stroke="#87aa96" stroke-width="11"/>
          <path d="M701 168a51 51 0 0 1 25 54" fill="none" stroke="#d4bb72" stroke-width="11"/>
          <path d="M703 154L694 178" stroke="#b56e48" stroke-width="4" stroke-linecap="round"/>
          <g class="welcome-needle"><path d="M675 219L652 180" stroke="#2b5752" stroke-width="4" stroke-linecap="round"/><circle cx="675" cy="219" r="8" fill="#2f635d"/><circle cx="675" cy="219" r="3" fill="#d4bc7c"/></g>
          <path d="M651 239H699" stroke="#ccd5ca" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
      <figcaption class="welcome-principle-labels"><div><h3>Justification</h3><p>Why this use of radiation?</p></div><div><h3>Optimisation</h3><p>How can exposure be reduced?</p></div><div><h3>Dose limitation</h3><p>Are the applicable limits respected?</p></div></figcaption>
    </figure>`;
  }
  function photo(which, label) { return `<div class="visual-frame"><div class="image-wrap"><img class="visual-image equipment-photo" src="${which}.png" alt="${esc({gamma:'Gamma projector',xray:'Portable X-ray generator','detector-control':'Digital detector and control unit',workplace:'Radiography equipment in a workplace'}[which])}"></div>${labelHTML(label)}</div>`; }
  function route(labels, active=0) {return `<div class="route">${labels.map((l,i)=>`<div class="route-stop ${i===active?'active':''}"><div class="number">${i+1}</div><h3>${esc(l)}</h3></div>`).join('')}</div>`;}
  function timeline(items, active=0) {return `<div class="map-box"><div class="step-vertical">${items.map((s,i)=>`<div class="${i===active?'active':''}"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div></div>`;}
  function org(label) {return `<div class="visual-frame"><div class="org-layout"><div class="org-block"><img src="fanc.png" alt="FANC — Federal Agency for Nuclear Control"><strong>The regulator</strong><small>Outside the company</small></div><div class="org-company"><h3>NDT company</h3><div><strong>Physical control service</strong><span>Head of the service</span></div><div><strong>Radiographers</strong><span>Designated agent on each worksite</span></div></div><div class="org-block"><strong>Recognised organisation</strong><small>Recognised expert in physical control</small></div></div>${labelHTML(label)}</div>`;}
  function bunker(label, hint) {
    const parts={roof:/roof/,gate:/gate|vehicle/,door:/door|access/,lamp:/visual|lamp|light signal/,post:/control post/,estop_in:/emergency stop.*inside|stop button/,estop_post:/stop.*post/,sounder:/sound|bell|audible/,emlight:/emergency light/,walk:/walk.?round/,cert:/certificat/};
    const key=Object.keys(parts).find(k=>parts[k].test(hint.toLowerCase()));
    const cutaway=/inside|interior|evacuation|walk.?round|emergency stop/i.test(hint);
    el.innerHTML=`<div class="bunker-frame ${cutaway?'cutaway':''}">${BunkerArt.svg.company}${labelHTML(label)}</div>`;
    if(key)el.querySelectorAll(`[data-part="${key}"]`).forEach(n=>n.classList.add('focused'));
  }
  function site(label, held, settled) {return `<div class="site-plan ${held?'held':''} ${settled?'settled':''}"><svg viewBox="0 0 900 520" role="img" aria-label="Conceptual hall plan, vessel and protection perimeter. No distances specified."><defs><pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 9L9 0" stroke="#c7cabb"/></pattern><linearGradient id="vessel" x2="0" y2="1"><stop stop-color="#a2afab"/><stop offset=".4" stop-color="#ebede5"/><stop offset="1" stop-color="#70877f"/></linearGradient></defs><path d="M50 45H850V440H50Z" fill="#f7f7ed" stroke="#839488" stroke-width="9"/><path d="M50 100H180V320H50" fill="url(#hatch)" stroke="#8a9a8f" stroke-width="3"/><text x="83" y="195">Store</text><rect class="perimeter" x="275" y="115" width="440" height="250" rx="22"/><rect x="360" y="175" width="265" height="120" rx="55" fill="url(#vessel)" stroke="#536c62" stroke-width="3"/><path d="M425 177V293M555 177V293" stroke="#849b8b" stroke-width="4"/><text x="455" y="245">V-2</text><path class="route-line" d="${settled?'M90 405H775V70':held?'M790 410L645 310L660 110L770 65':'M785 410V80'}"/><text x="685" y="42">Walkway</text><path d="M734 410H836" stroke="${held?'#bd3a2b':'#477464'}" stroke-width="12"/><g transform="translate(293 343)"><path d="M0 0L-22 -38H22Z" fill="#edcc3c" stroke="#353c31"/><text x="0" y="-13" text-anchor="middle" style="font-size:24px;fill:#30372e">☢</text></g><text x="55" y="488" style="font-size:13px">Conceptual plan · no exclusion distances shown</text>${held?'<rect x="309" y="67" width="365" height="43" rx="6" fill="#a53e2d"/><text x="490" y="95" text-anchor="middle" style="fill:white;font-weight:600">EXPOSURE ON HOLD</text>':''}</svg>${labelHTML(label)}</div>`;}
  function two(a,b,ap,bp) {return `<div class="compare"><section><h3>${esc(a)}</h3><p>${esc(ap)}</p></section><section><h3>${esc(b)}</h3><p>${esc(bp)}</p></section></div>`;}
  function workerLanes(label){return `<div class="worker-lanes"><div class="lane-head"><span>Sending employer</span><span>Workplace operator</span></div><div class="worker-lane"><div>Our company</div><span>Daniel →</span><div>The plant</div></div><div class="worker-lane"><div>Clara’s employer</div><span>Clara →</span><div>Our company</div></div><p>${esc(label||'Equivalent protection for the assignment')}</p></div>`;}
  function labelAt(p, beat) {
    const focusLabels={
      'B1.3-S05-P2':['Sounder while the gate closes','Lamp on only while radiation is present','Access locked while emitting','Exit opens by hand from inside','Alarm meanings at the entrance','Emergency lighting','Safety walk-round before exposure','Emergency stops inside and at the control post'],
      'B1.5-S02-P1':['EXPOSURE RUNNING · room shown empty','Door-open indication at the control post','Interlock did not cut the exposure','EXPOSURE STOPPED · BUNKER OUT OF USE']
    };
    if(focusLabels[p.cue]&&beat>=0)return focusLabels[p.cue][beat]||focusLabels[p.cue].at(-1);
    const explicit=p.beats[beat]?.screen;
    if(explicit)return explicit;
    const labels=p.screen_text||[];
    return labels[Math.min(Math.max(beat,0),labels.length-1)]||'';
  }
  function chooseDoc(p, scene, lid, hint, b) {
    const docs=p.documents||scene.paragraphs.flatMap(q=>q.documents||[]);
    const exact=hint.match(/DOC-[A-Z-]+/);if(exact&&COURSE.documents[exact[0]])return exact[0];
    // A beat number is not a document index. Keep the evidence being discussed
    // on screen until the authored cue actually calls for another document.
    const cueDocs={
      'B1.3-S02-P1':['DOC-REG-EXTRACT','DOC-LICENCE'],
      'B1.3-S05-P5':['DOC-CERT-BUNKER','DOC-LOC-JUST'],
      'B1.3-S08-P4':['DOC-CONTROL-TEST-PROGRAMME','DOC-CONTROL-TEST-PROGRAMME','DOC-CONTROL-TEST-PROGRAMME','DOC-HOLD-CARD'],
      'B1.4-S04-P1':['DOC-EXT-WORKER-FILE'],
      'B1.4-S05-P2':['DOC-INSTRUCTION-RECORD','DOC-INSTRUCTION-RECORD','DOC-INSTRUCTION-RECORD','DOC-EXT-WORKER-FILE','DOC-PLANNING'],
      'B1.4-S08-P1':['DOC-INSTRUCTION-RECORD','DOC-ASSIGNMENT-SLIP']
    };
    if(cueDocs[p.cue])return cueDocs[p.cue][Math.min(b,cueDocs[p.cue].length-1)];
    const keywords=[['technique','DOC-TECH-JUST'],['location|bunker block|infrastructure block','DOC-LOC-JUST'],['licence|authorised practice','DOC-LICENCE'],['request','DOC-REQ'],['instruction record','DOC-INSTRUCTION-RECORD'],['assignment slip','DOC-ASSIGNMENT-SLIP'],['test programme|this month|previous month','DOC-CONTROL-TEST-PROGRAMME'],['approval line|procedure page','DOC-PROCEDURE-RECORD']];
    const matched=keywords.find(([rx,id])=>new RegExp(rx,'i').test(hint)&&docs.includes(id));
    return matched?.[1]||docs[0]||documentFallback[lid]?.[+scene.id.slice(1)]||'DOC-EVENT-RECORD';
  }
  let current = null, renderKey='';
  function render(lid,scene,p,beat=-1) {
    current={lid,scene,p,beat};renderKey=`${p.cue}:${beat}`;
    stage.dataset.cue=p.cue;stage.dataset.beat=beat;stage.dataset.scene=`${lid}-${scene.id}`;
    cast.replaceChildren();stage.classList.remove('without-presenter','has-participant','handover-scene','handover-offer');
    if(lid==='B1.2'){
      el.dataset.family='reviewed-b12';el.classList.add('reviewed-visual');
      el.innerHTML=B12Reviewed.render(p.cue,beat);$('status-controls').replaceChildren();
      return;
    }
    const b=Math.max(beat,0), n=+scene.id.slice(1), pn=+p.cue.split('-P')[1];
    let mode=family[lid][n-1], label=labelAt(p,beat), hint=beat<0?p.start_visual:(p.beats[beat]?.show||p.start_visual);
    hint=hint||'';
    if(lid==='B1.1'&&n===1&&pn>=3) mode=pn===3?'route':'boundary';
    if(lid==='B1.1'&&n===2)mode='course-journey';
    if(lid==='B1.1'&&(n===3||n===4))mode='protection-roles';
    if(lid==='B1.1'&&n===14)mode=pn===1&&beat<1?'bunker':pn===1?'document':'evidence-gap';
    if(lid==='B1.1'&&n===15)mode=pn===1?(beat<1?'org':'principles'):pn===2?'folders':'recap';
    if(lid==='B1.2'&&n===1)mode=pn===1?'org':'document';
    if(lid==='B1.2'&&n===2)mode='document';
    if(lid==='B1.2'&&n===12)mode=pn===2?'equipment-pair':pn===1?'protection-security':'security';
    if(lid==='B1.2'&&n===14)mode=pn===1?'document':pn===2?'org':'bunker';
    if(lid==='B1.4'&&(n===2||n===9||n===11&&pn===1||n===5&&pn===3))mode='worker-lanes';
    if(lid==='B1.4'&&n===11&&pn===2)mode='bunker';
    if(lid==='B1.5'&&n===6)mode='notifier';
    if(lid==='B1.5'&&n===9)mode='contact-log';
    if(lid==='B1.5'&&n===12)mode=pn===1?'source-security':pn===2?'security-route':'security-criterion';
    if(lid==='B1.5'&&n===15)mode=pn===1?'lanes':'planner';
    if(lid==='B1.1'&&n===5)mode='bram-request';
    if(lid==='B1.1'&&n===6)mode='protection-principles';
    
    if(lid==='B1.1'&&n===7)mode='justification-path';
    if(lid==='B1.1'&&n===8)mode='optimisation-hall';

    if(lid==='B1.1'&&n===15&&pn===3)mode='recap';
    if(lid==='B1.3'&&n===5&&/certificate|DOC-CERT/i.test(hint))mode='document';
    if(lid==='B1.3'&&n===5&&pn===3)mode='document';
    if(lid==='B1.3'&&n===5&&pn===4)mode='location-tiers';
    if(lid==='B1.3'&&n===5&&pn===5)mode='document';
    if(lid==='B1.5'&&n===11)mode='ines';
    if(lid==='B1.3'&&n===8&&pn===2)mode='document';
    if(lid==='B1.3'&&n===8&&pn===4&&beat>=2)mode='document';
    if(lid==='B1.5'&&n===2&&pn===2)mode='known-unknown';
    if(lid==='B1.5'&&n===2&&pn===3)mode='document';

    if(lid==='B1.2'&&n===6&&pn===3&&beat>=0)mode='equipment-pair';
    if((lid==='B1.3'&&n===1&&pn===1)||(lid==='B1.5'&&n===1&&pn===1))mode='control-unit';
    
    if(lid==='B1.6'&&n===6&&pn===1)mode='document';
    if(lid==='B1.6'&&n===6&&pn===2)mode='site';
    if(lid==='B1.6'&&n===2&&pn===1)mode='planner';
    if(lid==='B1.4'&&n===8&&/EQ-GAMMA/i.test(hint))mode='equipment';
    if(lid==='B1.1'&&n>=9&&n<=15)mode='b1-followup';
    stage.classList.toggle('bram-workshop-scene',mode==='bram-request'&&pn<=2);
    const doc=chooseDoc(p,scene,lid,hint,b);
    const resumed=lid==='B1.6'&&n===6&&pn===2&&beat>=3;
    const isHeld=!resumed&&/HELD|ON HOLD|NOT STARTED|not started|on hold|use held/i.test(label+' '+hint);
    const lastPhrase = p.beats[beat]?.at || '';
    let person=(p.characters||[]).find(s=>s!=='Emilia'&&s!=='Tom')?.toLowerCase();
    const named=hint.match(/\b(Daniel|Clara|Bram|Luc|Sofia)\b/);if(named)person=named[1].toLowerCase();
    if(mode==='org'||mode==='protection-roles')person=null;
    if(mode==='protection-principles'||mode==='justification-path'||mode==='optimisation-hall'||mode==='b1-followup')person=null;
    if(mode==='bram-request')person=[1,2,3,5,8].includes(pn)?'bram':null;
    if(mode==='protection-roles'&&n===3&&(pn===8||pn===9))person='daniel';
    if(mode==='protection-roles'&&n===4&&pn===2)person=null;
    // Intro previews are intentionally one person at a time, never a row of cut-outs.
    if(lid==='B1.1'&&n===1&&pn===2){mode=beat<0?'guide-intro':'people';person=beat<0?null:beat===1?'clara':beat===2?'bram':'daniel';if(beat>=3){person=null;mode='equipment';}}
    if(mode==='handover'&&pn===1&&beat<1){
      if(beat>=0)stage.classList.add('handover-offer');
      stage.classList.add('without-presenter','handover-scene');sprite('emilia_poses',2,'12%',.85);sprite('clara',beat<0?0:1,beat<0?'right':'33%',.85);
      el.innerHTML=`<div class="handover-copy"><div class="eyebrow">Clara arrives</div><h2>Her file comes with her.</h2><p>Information for the receiving company.</p></div>`;
    } else {
      switch(mode) {
        case'intro': el.innerHTML=welcomePrinciples();break;
        case'guide-intro': el.innerHTML=welcomePrinciples(true);break;
        case'b1-followup':el.innerHTML=B1Followup.render(p.cue,beat);break;
        case'optimisation-hall':el.innerHTML=OptimisationHall.render(p.cue,beat);break;
        case'justification-path':el.innerHTML=JustificationPath.render(p.cue,beat);break;
        case'protection-principles':el.innerHTML=ProtectionPrinciples.render(p.cue,beat);break;
        case'bram-request':el.innerHTML=BramRequest.render(p.cue,beat);break;
        case'protection-roles':el.innerHTML=ProtectionRoles.render(p.cue,beat);break;
        case'course-journey':el.innerHTML=CourseJourney.render(p.cue,beat);break;
        case'workplace':el.innerHTML=photo('workplace',label);break;
        case'control-unit':el.innerHTML=photo('detector-control','Digital detector and control unit');break;
        case'equipment-pair':el.innerHTML=`<div class="visual-frame equipment-pair"><figure><img src="xray.png" alt="Supplied X-ray generator reference"><figcaption>X-ray generator</figcaption></figure><figure><img src="gamma.png" alt="Supplied gamma projector reference"><figcaption>Gamma projector</figcaption></figure>${labelHTML(label)}</div>`;break;
        case'equipment': {
          let which=/GAMMA|gamma projector/i.test(hint)||p.equipment?.[0]==='EQ-GAMMA-PROJECTOR'?'gamma':/DETECTOR|digital detector/i.test(hint)?'detector-control':'xray';
          if(lid==='B1.6'&&n===8&&pn===1)which=(beat===1||beat===2)?'gamma':'xray';
          el.innerHTML=photo(which,label);break;
        }
        case'route': el.innerHTML=route(['Framework and people','Radiation science','Applied situations'],Math.min(b,2));break;
        case'learning-rhythm':el.innerHTML=route(['Explanation and example','Your decision','Feedback'],Math.min(b,2));break;
        case'worker-lanes':el.innerHTML=workerLanes(label);break;
        case'evidence-gap':el.innerHTML=two('Missing record','Procedure on the shelf','Does not establish a failed device','Does not establish that the check happened');break;
        case'contact-log':el.innerHTML=two('Attempt 1 · voicemail','Successful direct contact','Unsuccessful · keep calling','Not yet established');break;
        case'notifier':el.innerHTML=`<div class="notifier"><img src="fanc.png" alt="FANC"><h2>Head of the establishment</h2><p>Notifies the Agency</p><small>Emilia prepares the facts with him.</small>${labelHTML(label)}</div>`;break;
        case'protection-security':el.innerHTML=`<div class="security-pair"><section><img src="workplace.png" alt="Radiography worksite"><h3>Radiation protection</h3><p>Control exposure.</p></section><section><img src="gamma.png" alt="Gamma projector containing a sealed source"><h3>Radiological security</h3><p>Prevent removal, malicious acts and misuse.</p></section></div>`;break;
        case'source-security':el.innerHTML=photo('gamma','Different example · sealed source missing from locked storage');break;
        case'security-route':el.innerHTML=timeline([['Observed','Inform the operator or ARB immediately'],['Operator / ARB','Contact the police'],['Also','Inform the Agency of incidents reported to police'],['Follow-up','Evaluation report']],Math.min(b,3));break;
        case'security-criterion':el.innerHTML=two('Criterion 1bis.2','Source security','Theft / threat / attempt: immediately','Loss reported to police: immediately · INES yes');break;
        case'boundary':el.innerHTML=two('Here','At your workplace','Theoretical training for class II industry','Practical instruction and designation');break;
        case'org': el.innerHTML=org(label);break;
        case'letters':el.innerHTML=two('Expert’s visit','FANC inspection','Recognised expert in physical control','Federal regulator');break;
        case'principles':el.innerHTML=`<div class="principles">${[['Why this use?','Justification'],['How to reduce exposure?','Optimisation'],['Within the limits?','Dose limitation']].map((x,i)=>`<section class="principle ${b===i?'active-evidence':''}"><div class="number">0${i+1}</div><strong>${x[0]}</strong><p>${x[1]}</p></section>`).join('')}</div>`;break;
        case'thresholds':el.innerHTML=timeline([['Limit','The applicable dose limit'],['Constraint','Used in planning optimisation'],['Alarm','An operational signal; follow the instructions']],b%3);break;
        case'document':case'handover':el.innerHTML=documentView(doc,mode==='handover'&&beat>=2?'twelve rolling months NOT PROVIDED':hint,label,b);break;
        case'folders':el.innerHTML=pn===2?documentView(beat===1?'DOC-LICENCE':beat>=2?'DOC-PROCEDURE-RECORD':'DOC-REG-EXTRACT',hint,label,b):`<div class="document-overviews">${['DOC-REG-EXTRACT','DOC-LICENCE','DOC-PROCEDURE-RECORD'].map(id=>`<button data-open-doc="${id}">${paper(id)}</button>`).join('')}</div>`;break;
        case'revision':el.innerHTML=two('Current form','Proposed revision','Still in use','Examination and approval still needed');break;
        case'assignment':el.innerHTML=two('Instruction record','New assignment','Bunker · X-ray set · casting radiography','Hall two · gamma exposures · this afternoon');break;
        case'appointments':el.innerHTML=two('Agent on the worksite','Radiological security delegate','Company designation for this worksite','Separate appointment and Agency approval');break;
        case'roles':el.innerHTML=two('Daniel','Emilia','Radiographer · designated agent for this worksite','Quality and safety manager · formally appointed head of service');break;
        case'training':el.innerHTML=timeline([['Instruction','Before radiography employment'],['Information','Health risks and safe practice'],['Workstation','For the actual equipment and task'],['Agent course','Passed knowledge test'],['Designation','Company decision for a worksite']],Math.min(b,4));break;
        case'location-tiers':el.innerHTML=timeline([['Always','Movable, within 1 m³ and under 500 kg: bunker'],['Preferred','For larger or heavier workpieces: bunker'],['Then','Irradiation infrastructure on the client’s site'],['Only if neither','Another place, after the required risk analyses']],Math.min(b,3));break;
        case'messages':el.innerHTML=timeline([['Radiographer','Reports what was observed'],['Service','Coordinates the response'],['Expert','Examines and approves where required']],Math.min(b,2));break;
        case'bunker':bunker(label,hint);break;
        case'site':el.innerHTML=site(resumed?'Access controlled · verified · radiography resumes':label,isHeld||lid==='B1.6'&&n===5,resumed);break;
        case'hold':{
          const meter=lid==='B1.2';
          const failed=lid==='B1.5'||lid==='B1.3'&&n===8&&pn===1;
          el.innerHTML=`<div class="hold-scene"><div class="eyebrow">${meter?'Worksite · before exposure':'Company bunker'}</div><h2>⏸ ${meter?'EXPOSURE ON HOLD':failed?'BUNKER OUT OF USE':'BUNKER USE ON HOLD'}</h2><p>${meter?'Survey meter: function check failed':failed?'Interlock failed to stop the exposure sequence':'This month’s interlock result is not established'}</p><small>${meter?'Cause still unknown':failed?'Until the deficiency is corrected · reported immediately':'A missing record does not establish a failed device'}</small></div>`;
          break;}
        case'known-unknown':el.innerHTML=two('Established observations','Not established','Door opened · exposure not interrupted by interlock · Daniel stopped it','Why the interlock failed · Tom’s dose');break;
        case'security':el.innerHTML=two('Radiation protection','Security of radioactive substances','Control exposure · radiographers, service and recognised expert','Prevent unauthorised removal, malicious acts and misuse · operator and ARB');break;
        case'criteria':el.innerHTML=timeline([['Criterion 1.5','Direct contact by the next working day'],['Criterion 1.4','Direct contact immediately'],['Written','Within 48 hours when a criterion is met']],Math.min(b,2));break;
        case'ines':el.innerHTML=pn===1?two('Criterion 1.22','Written notification','No direct contact required · no INES evaluation','Still within 48 hours'):two('INES assessment','Return to use','Expert proposes · Agency approves','A low rating is not permission to restart');break;
        case'lanes':el.innerHTML=timeline([['Protect','Apply the protective action in the instructions'],['Inform','Give the internal report'],['Notify','The statutory route to the Agency']],Math.min(b,2));break;
        case'timeline':{
          const items=lid==='B1.3'?(n===3?[['Before','Class III declaration'],['Decision','Authorisation granted'],['Then','Use under the applicable conditions']]:[['Licence','Establishment and operating licence'],['Build','Construction / installation'],['Acceptance','Required acceptance'],['Use','Only when conditions are met']]):[['Within 48 h','Initial written notification'],['Investigate','Establish causes and consequences'],['Two months','Final report · calendar months'],['Separate','Return-to-use decision after correction and checks']];
          el.innerHTML=timeline(items,Math.min(b,items.length-1));break;}
        case'planner':el.innerHTML=timeline([['Tuesday','Request · written justifications · job details'],['Wednesday','Company risk analysis and planning'],['Thursday','Worksite · V-2 · W-07 and W-08']],pn===1?Math.min(b,2):2);break;
        case'factors':el.innerHTML=timeline([['Distance','Protection perimeter'],['Source shielding','Container and collimator'],['Screens','Bunker walls, roof and door'],['Contamination','Sealed sources and inventory'],['Time','Working time and organisation']],Math.min(b,4));break;
        case'map':el.innerHTML=two('The physics','The framework','Radiation behaves the same','Apply the rules of the country where the work takes place');break;
        case'people':{
          const who=person||'daniel';
          const role={daniel:'Industrial radiographer',clara:'Visiting radiographer',bram:'Client contact',luc:'Team leader',sofia:'Radiography technician'}[who];
          el.innerHTML=`<div class="intro-copy"><div class="eyebrow">Meet ${esc(CAST.people[who]?.name||who)}</div><h2 class="overview-title">${esc(role)}</h2><p>${esc(label.length<120?label:'Information, equipment and the job in front of us.')}</p></div>`;
          person=who;break;}
        case'recap':{
          if(/science/i.test(label)) el.innerHTML=route(['Framework and people','Radiation science','Applied situations'],1);
          else if(p.documents?.length)el.innerHTML=documentView(doc,hint,label,b);
          else el.innerHTML=`<div class="closing-focus"><div class="eyebrow">Bring it back to the job</div><h2>${esc(label||scene.title)}</h2><img src="workplace.png" alt="Radiography equipment prepared for a job"></div>`;
          break;}
      }
      // Named participants occupy a reserved strip, never cover the document or controls.
      if(person&&CAST.people[person]&&person!=='tom') {
        stage.classList.add('has-participant');
        const pose=mode==='bram-request'?(pn===2?2:pn===5?1:0):mode==='protection-roles'?0:person==='daniel'?(/phone|call|telephone/i.test(hint+' '+p.text)&&mode!=='people'?2:/check.*meter/i.test(hint)?1:0):person==='clara'?(/hand.?over|offers/i.test(hint)?1:/listen/i.test(hint)?2:0):person==='bram'?(/point|field/i.test(hint)?1:0):0;
        sprite(person,pose,'right',.74);
      }
    }
    el.dataset.family=mode;
    $('status-controls').innerHTML='';
    let status=[];
    if((isHeld&&['site','bunker','document'].includes(mode))||mode==='hold')status.push(['held','⏸','Held','Work is held',label||'The work remains held under the procedure.']);
    if(/not established|unknown|not provided|missing record/i.test(label+' '+hint))status.push(['unknown','?','Not established','Information still missing',label||'The missing information has not been established; no result is assumed.']);
    if(/fact badge|FACT:/i.test(hint))status.push(['fact','ⓘ','Fact','Established observation',label]);
    if(scene.status_badges?.length){
      status=scene.status_badges.filter(s=>{
        if(lid==='B1.3'&&n===8)return pn===1?s.kind==='fact':s.kind!=='fact';
        if(lid==='B1.5'&&n===2&&pn===1)return beat>=3?s.kind==='held':beat>=2?s.kind==='fact':false;
        return true;
      }).map(s=>{const cl=s.kind==='not_established'?'unknown':s.kind;return [cl,cl==='fact'?'ⓘ':cl==='held'?'⏸':'?',cl==='unknown'?'Not established':cl==='fact'?'Fact':'Held',s.label,s.explanation];});
    }
    if(resumed)status=status.filter(s=>s[0]!=='held');
    status.forEach(([cl,icon,text,title,body])=>{const btn=document.createElement('button');btn.className='status-'+cl;btn.textContent=`${icon} ${text}`;btn.setAttribute('aria-label',`${text}: open explanation`);btn.onclick=()=>window.Player?.reader(title,`<p>${esc(body)}</p><p>${esc(cl==='unknown'?'An unknown is kept open until evidence establishes it.':cl==='held'?'This is the work status. It is not a conclusion about the cause.':'This records an observed fact. It does not establish an unobserved cause.')}</p>`);$('status-controls').append(btn);});
    if(lid==='B1.1'){
      const reviewed=B11Reviewed.render(p.cue,beat);
      if(reviewed!==null)el.innerHTML=reviewed;
      el.classList.add('reviewed-visual');
      B11Reviewed.bind(el);
    }else el.classList.remove('reviewed-visual');
    B1Followup.bind(el);
    el.querySelectorAll('[data-oh-source]').forEach(btn=>btn.onclick=()=>OptimisationHall.openSource());
    el.querySelectorAll('[data-jp-source]').forEach(btn=>btn.onclick=()=>JustificationPath.openSource(btn.dataset.jpSource));
    el.querySelectorAll('[data-open-doc]').forEach(btn=>btn.onclick=()=>window.Player.document(btn.dataset.openDoc));
  }
  function renderCurrent(){if(current)render(current.lid,current.scene,current.p,current.beat);}
  window.addEventListener('resize',renderCurrent);
  window.Visuals={render,renderCurrent,rows,paper,documentView,esc,sprite};
})();

