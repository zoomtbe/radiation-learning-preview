/* Owner point 3: teach each relationship before applying it to an expert visit. */
(() => {
  'use strict';
  const logo='<img class="pr-logo" src="fanc.png" alt="FANC — Federal Agency for Nuclear Control">';
  const drawing=(kind)=>{
    const paths={
      company:'<path d="M25 113V53l37 17V46l37 20V33h20v80Z"/><path d="M20 114h108M40 82h10v12H40zm25 0h10v12H65zm25 0h10v12H90zM69 113v-13h19v13"/>',
      expert:'<circle cx="62" cy="39" r="15"/><path d="M33 103V79c0-14 13-22 29-22s29 8 29 22v24M45 78v25m34-25v25"/><rect x="83" y="78" width="35" height="27" rx="4"/><path d="m90 90 6 6 13-12"/>',
      organisation:'<path d="M28 111V30h81v81M20 112h98M42 45h15v13H42zm37 0h15v13H79zM42 72h15v13H42zm37 0h15v13H79zM58 111V94h24v17"/>',
      review:'<path d="M37 19h59l19 19v85H37ZM95 19v21h20M50 51h34m-34 14h28m-28 14h22"/><circle cx="87" cy="90" r="17"/><path d="m100 102 16 16m-39-29 7 7 13-14"/>',
      report:'<path d="M33 23h76v99H33zM53 23v-7h35v15H53zM47 51h10m14 0h22M47 73h10m14 0h22M47 95h10m14 0h22"/><path d="M47 49v4m1 20h8m-8 22h8"/>',
      action:'<circle cx="73" cy="70" r="40"/><path d="m50 71 15 16 31-34M28 25l9 10m72 69 9 10M20 70h10m86 0h10M73 17v10m0 86v10"/>',
      people:'<circle cx="70" cy="38" r="12"/><circle cx="36" cy="54" r="10"/><circle cx="105" cy="54" r="10"/><path d="M48 106V75c0-23 45-23 45 0v31M18 106V83c0-18 27-23 30-8m45 0c4-15 29-10 29 8v23"/>'
    };
    return `<svg class="pr-drawing" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="66" fill="#eaf0e5" stroke="none"/><g fill="none" stroke="#3d786e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${paths[kind]||paths.review}</g></svg>`;
  };
  const head=(kicker,title)=>`<header class="pr-heading"><span class="eyebrow">${kicker}</span><h2>${title}</h2></header>`;
  const shell=(title,body,cls='')=>`<section class="protection-roles ${cls}" aria-label="${title}">${body}</section>`;
  const note=t=>`<p class="pr-note">${t}</p>`;
  const active=(index,at)=>index===at?' current':'';

  function authority(b){
    const line=b===1?'Protecting workers, the public and the environment.':b>=2?'Authorisation and inspection are regulatory functions.':'Belgium’s public authority for nuclear safety and radiation protection.';
    return shell('FANC, the regulator',head('Start with the regulator','What is FANC?')+`<div class="pr-authority"><div class="pr-agency">${logo}<h3>Federal Agency<br>for Nuclear Control</h3><span class="pr-tag">Public authority</span></div><div class="pr-supervision"><span>Authorises &amp; supervises</span><i aria-hidden="true">→</i></div><div class="pr-company-intro">${drawing('company')}<h3>Our company</h3><p>Organises its own<br>radiation protection</p></div></div>`+note(line));
  }
  function company(b,emilia=false){
    return shell('Inside our company',head('Inside our company',emilia?'Emilia leads the service':'The company is the operator')+`<div class="pr-service"><div class="pr-service-owner">${drawing('company')}<div><h3>Our company</h3><p>Holds the licence · remains responsible</p></div></div><div class="pr-service-inner"><span class="pr-tag">Internal function</span><h3>Physical control service</h3><p>${emilia?'Emilia coordinates and organises the work.':'People, checks and procedures that control exposure.'}</p><div class="pr-connection">${emilia?'Emilia ↔ Company management':'Company → Organises its service'}</div></div></div>`+note(emilia?(b>=2?'Head of the service and recognised expert are different functions.':'Emilia has direct access to the head of the company.'):'“Physical control” means radiation protection, not a medical examination.'));
  }
  function contract(b){
    return shell('Our recognised organisation',head('Our arrangement · external expert','Why we contract a recognised organisation')+`<div class="pr-contract"><div class="pr-contract-company">${drawing('company')}<h3>Our company</h3><p>No recognised expert<br>on our own staff</p></div><div class="pr-contract-link"><span>Contract</span><i aria-hidden="true">↔</i><small>Required expert tasks</small></div><div class="pr-provider">${drawing('organisation')}<h3>Recognised physical-control organisation</h3><p>Specialist service provider</p><span class="pr-tag">Recognised by FANC</span></div></div>`+note(b>=2?'For our company: provides expert support under contract.':'FANC recognises the organisation. Our company contracts its services.'));
  }
  function expert(b){
    return shell('The individual expert',head('Organisation ≠ person','Who is the recognised expert?')+`<div class="pr-expert-layout"><div class="pr-person-card"><span class="pr-tag">Employed by the organisation</span>${drawing('expert')}<h3>Recognised expert<br>in physical control</h3><p>Individual recognition by FANC<br>for a defined scope</p></div><div class="pr-expert-task">${drawing('review')}<h3>Examines &amp; approves</h3><div>Radiation-protection<br>risk analysis</div><div>Working procedures</div></div></div>`+note(b>=3?'Emilia coordinates the service. The expert performs the specified expert tasks.':'The organisation provides the service; the recognised expert performs the expert tasks.'));
  }
  function visit(b,example=false){
    const current=example?(b<1?0:b===1?0:b===2?1:2):(b<2?0:b===2?1:2);
    const items=example?
      [['review','Expert examines','Bunker checks','One test result is missing.'],['report','Expert reports','Deficiency + deadline','The gap must be resolved.'],['action','Company acts','Emilia coordinates','Follow-up within our company.']]:
      [['review','Expert evaluates','Protection in practice','Installation · working methods · check results'],['report','Expert reports','Findings & deficiencies','Report to company and head of service · deadlines'],['action','Company follows up','Corrective action','Our responsibility continues.']];
    return shell(example?'A visit to our company':'Why the expert visits',head(example?'Workplace example · periodic expert visit':'Periodic expert visit',example?'A missing test record':'From evaluation to follow-up')+`<ol class="pr-visit">${items.map((it,j)=>`<li class="${active(current,j)}">${drawing(it[0])}<span class="pr-verb">${it[1]}</span><h3>${it[2]}</h3><p>${it[3]}</p></li>`).join('')}</ol>`+note(example?'Missing record ≠ proven failure of the safety device.':'Part of our physical-control arrangement. FANC inspections remain separate.'));
  }
  function field(pn,b){
    return shell('The worksite agent',head('Our own people',pn===5?'Daniel, industrial radiographer':'One designated agent on each worksite')+`<div class="pr-field"><span class="pr-tag">Radiographer · trained as agent</span><h3>${pn===5?'Required training before operating gamma or X-ray equipment':'Frequent, systematic checks'}</h3><p>${pn===5?'The agent role is carried out by a trained radiographer.':'Work procedures · protective equipment · instruments · dosimeters'}</p>${pn===6?'<div class="pr-connection">Checks → Reports to Emilia and the expert</div>':''}</div>`+note(pn===5?'Training and worksite designation are distinct.':'Checks follow expert-approved instructions and procedures.'));
  }
  function visitScope(b){
    const items=[['company','Equipment & safety devices'],['review','Dosimetry'],['people','Staff training'],['report','Procedures & work']];
    return shell('What the expert evaluates',head('Periodic evaluation visit','Does protection work in practice?')+`<div class="pr-scope">${items.map((it,j)=>`<div class="${(b===1&&j===0||b===2&&(j===1||j===2)||b===3&&j===3)?'current':''}">${drawing(it[0])}<h3>${it[1]}</h3></div>`).join('')}</div>`+note('At our premises and on worksites · the scope depends on the visit and activities.'));
  }
  function visitReport(b){
    return shell('Report and company follow-up',head('After the evaluation visit','Findings must lead to action')+`<div class="pr-report-layout"><div class="pr-report"><span class="eyebrow">Evaluation visit · action 04</span><h3>Evaluation report</h3><dl><div><dt>Finding</dt><dd>Set-up procedure needs revision</dd></div><div><dt>Action</dt><dd>Revise, examine and approve</dd></div><div><dt>Follow-up</dt><dd>Severity &amp; deadline recorded</dd></div><div><dt>Status</dt><dd><span class="pr-open">OPEN</span> → CLOSED after resolution</dd></div></dl></div><div class="pr-followup"><span class="pr-tag">Company follow-up</span><ol><li><span>1</span><div><strong>Read</strong><small>Understand the finding</small></div></li><li><span>2</span><div><strong>Act</strong><small>Carry out the required action</small></div></li><li><span>3</span><div><strong>Communicate</strong><small>Tell the expert what was done</small></div></li></ol></div></div>`+note(b>=3?'The organisation also has reporting duties to FANC, including repeated missed deadlines.':'The company follows up. The expert’s visit does not replace FANC’s supervision.'));
  }
  function map(b){
    return shell('Connected responsibilities',head('Keep the responsibilities connected','One protection system, different roles')+`<div class="pr-map"><div class="pr-map-regulator${active(b,0)}">${logo}<div><h3>FANC</h3><p>Regulatory supervision</p></div></div><div class="pr-map-work"><div class="pr-map-company${active(b,1)}"><h3>Our company</h3><p>Organises · remains responsible</p><div class="pr-map-person${active(b,2)}"><strong>Emilia</strong><span>Coordinates the service</span></div><div class="pr-map-person${active(b,4)}"><strong>Designated agent</strong><span>Checks and reports</span></div></div><div class="pr-map-link"><span>Contract</span><i aria-hidden="true">↔</i></div><div class="pr-map-provider${active(b,3)}"><h3>Recognised organisation</h3><p>Provides the expert</p><div class="pr-map-person"><strong>Recognised expert</strong><span>Evaluates protection<br>Examines and approves</span></div></div></div></div>`+note('The expert contract does not replace company responsibility or FANC supervision.'));
  }
  function render(cue,beat){
    const pn=+cue.split('-P')[1];
    if(cue.startsWith('B1.1-S04'))return pn===1?visit(beat<0?0:beat,true):shell('Daniel considers the visit',head('Daniel sees the expert at work','How does this visitor fit in?')+`<div class="pr-field">${drawing('expert')}<h3>A recognised expert visits our bunker.</h3><p>The expert reviews the checks and reports a missing test result.</p><div class="pr-connection">Emilia coordinates the follow-up.</div></div>`+note('Use the roles you have just explored to explain this visit.'));
    switch(pn){
      case 1:return authority(beat);
      case 2:return company(beat);
      case 3:return company(beat,true);
      case 4:return contract(beat);
      case 8:return expert(beat);
      case 9:return visitScope(beat);
      case 10:return visitReport(beat);
      case 5:case 6:return field(pn,beat);
      default:return map(beat);
    }
  }
  window.ProtectionRoles={render};
})();
