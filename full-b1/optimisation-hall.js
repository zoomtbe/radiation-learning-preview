/* S08 only. A conceptual arrangement, never a shielding or distance calculation. */
(() => {
 'use strict';
 const law='https://www.jurion.fanc.fgov.be/jurdb-consult/plainWettekstServlet?lang=nl&wettekstId=32765';
 const arbis='https://www.jurion.fanc.fgov.be/jurdb-consult/plainWettekstServlet?lang=nl&wettekstId=11565';
 const titles=['Plan the job around people','Shielding: reduce what reaches people','Distance: choose the control position','Access: close and supervise the route','Time: prepare well, avoid repeat exposures','Verify the actual arrangement'];
 const notes=[
  ['Bram’s hall · location already justified','Optimisation goes beyond meeting a limit.','Daniel + Sofia · plan before producing radiation.','Positions, shielding and access agreed in advance.'],
  ['Beam direction + restriction','Lead screen added between work and controls','Scattered radiation also matters','Shielding supports the perimeter; it never replaces it.'],
  ['Daniel operates outside the perimeter.','Distance + shielding · no fixed metres from this sketch','Sofia supervises the other approach.','Keep contact; add supervision if access cannot be covered.'],
  ['Normal pedestrian route · no exposure yet','Route closed; nearby work stopped for exposure','Both approaches supervised','Access unresolved? Do not start.'],
  ['Prepare: welds, detector, equipment and exposure plan','Expose: remain at the assessed positions','Verify: radiation checks before approaching','Avoid unnecessary repeats; never sacrifice inspection quality.'],
  ['Check the actual hall · last-minute risk assessment','Measure at the boundary during the first / test exposure','Verify shielding and occupied positions under the procedure','Conditions changed? STOP and reassess.']
 ];
 function person(name,x,y,h,pose=0){
  const d=CAST.people[name],p=Object.values(d.poses)[pose],bb=name==='sofia'?[78,0,803,1536]:p.bounds;
  const src=name==='sofia'?'sofia-workshop-ppe-v1.png':d.src;
  const w=(bb[2]-bb[0])*h/(bb[3]-bb[1]);
  return `<g class="oh-person" data-team="${name}" role="img" aria-label="${name==='daniel'?'Daniel':'Sofia'}, wearing a safety helmet, workwear and safety boots, outside the perimeter"><ellipse cx="${x}" cy="${y}" rx="${w*.46}" ry="5" fill="#3b4b4930"/><svg x="${x-w/2}" y="${y-h}" width="${w}" height="${h}" viewBox="${bb[0]} ${bb[1]} ${bb[2]-bb[0]} ${bb[3]-bb[1]}" overflow="hidden"><image href="${src}" width="${d.size[0]}" height="${d.size[1]}"/></svg></g>`;
 }
 const label=(x,y,w,text,kind='')=>`<g class="oh-map-label ${kind}"><rect x="${x}" y="${y}" width="${w}" height="30" rx="6"/><text x="${x+w/2}" y="${y+21}" text-anchor="middle">${text}</text></g>`;
 function hall(p,b){
  const shield=p>2||(p===2&&b>=1),closed=p!==4||b>=1;
  const measuring=p===6&&b>=1&&b<3,stopped=p===6&&b>=3||p===4&&b>=3;
  const danX=p===3&&b>=1?221:260;
  return `<svg class="oh-hall" viewBox="0 0 1000 470" role="img" aria-label="Havenmeer workshop, installed vessel and welds, a protection perimeter, Daniel at the remote controls, Sofia at the other entrance, a lead screen and a pedestrian route. Conceptual positions, not to scale.">
   <defs>
    <linearGradient id="oh-floor" x2=".4" y2="1"><stop stop-color="#e6e8dd"/><stop offset="1" stop-color="#f8f6eb"/></linearGradient>
    <linearGradient id="oh-steel" x2="0" y2="1"><stop stop-color="#68858b"/><stop offset=".35" stop-color="#e4eeeb"/><stop offset=".55" stop-color="#bccfd0"/><stop offset="1" stop-color="#698084"/></linearGradient>
    <linearGradient id="oh-wall" x2="0" y2="1"><stop stop-color="#f8f7ef"/><stop offset="1" stop-color="#d7ded6"/></linearGradient>
    <pattern id="oh-tape" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="20" height="20" fill="#e4bd52"/><rect width="8" height="20" fill="#545b50"/></pattern>
    <marker id="oh-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#437e78"/></marker>
    <filter id="oh-shadow"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#2f4845" flood-opacity=".14"/></filter>
   </defs>
   <path d="M78 96H914L968 425H28Z" fill="url(#oh-floor)" stroke="#a8b9ad" stroke-width="2"/>
   <path d="M78 96V27H914V96Z" fill="url(#oh-wall)" stroke="#a8b9ad" stroke-width="2"/>
   <path d="M78 27 28 352V425L78 96Z" fill="#dce2d8" stroke="#a8b9ad" stroke-width="2"/>
   <path d="M914 27 968 352V425L914 96Z" fill="#c5d1c5" stroke="#9eafa1" stroke-width="2"/>
   <g stroke="#8c9d9055" stroke-width="1"><path d="M70 147H923M59 216H936M47 293H948M36 367H959M245 96 215 425M423 96 414 425M602 96 614 425M781 96 815 425"/></g>
   <g fill="#8c9d8d"><path d="M95 27h11v69H95m273-69h11v69h-11m277-69h11v69h-11m224-69h11v69h-11"/></g>
   <g fill="#d4e2df" stroke="#a2b4b0" stroke-width="2"><path d="M130 39h193v36H130Z M398 39h204v36H398Z M690 39h174v36H690Z"/></g>
   <g class="oh-benches" filter="url(#oh-shadow)"><path d="M119 112h128v18H119Z" fill="#778d87"/><path d="M127 130v24m110-24v24" stroke="#697b71" stroke-width="8"/><path d="M760 108h112v17H760Z" fill="#778d87"/><path d="M769 125v26m94-26v26" stroke="#697b71" stroke-width="7"/><g fill="#a3b7a9"><rect x="134" y="92" width="27" height="20" rx="3"/><rect x="191" y="97" width="38" height="15" rx="3"/><rect x="779" y="88" width="39" height="20" rx="3"/></g></g>
   <text x="175" y="183" class="oh-room-label" text-anchor="middle">Workbenches</text>
   <path d="M742 130V401" class="oh-walk ${closed?'is-closed':''}"/>
   <path d="M722 162l20-19 20 19m-40 128 20-19 20 19" fill="none" stroke="#99ad9a" stroke-width="4" opacity="${closed?.3:1}"/>
   <rect x="347" y="165" width="439" height="200" rx="25" fill="#e6c35710" stroke="url(#oh-tape)" stroke-width="6"/>
   <g filter="url(#oh-shadow)"><ellipse cx="565" cy="301" rx="156" ry="15" fill="#6a7e7525"/><path d="M490 263v39h30v-39m111 0v39h29v-39" fill="#728b83"/><rect x="430" y="204" width="265" height="80" rx="40" fill="url(#oh-steel)" stroke="#5c777b" stroke-width="2"/><ellipse cx="665" cy="244" rx="30" ry="39" fill="#b0c5c4" stroke="#698488" stroke-width="2"/><path d="M510 205v77m97-77v77" stroke="#ae8852" stroke-width="4"/><path d="M549 207v-18h19v18m102 31h25v13h-25" fill="#a8bcb9" stroke="#627e7d" stroke-width="2"/></g>
   ${label(438,123,211,'Bram’s installed vessel')}
   <g font-size="19" fill="#694f28" text-anchor="middle"><text x="510" y="229">7</text><text x="607" y="229">8</text></g>
   <g aria-label="X-ray source and detector at weld 7"><path d="M509 306V287" stroke="#4a6967" stroke-width="5"/><path d="M508 307 491 328m17-21 18 21" stroke="#4a6967" stroke-width="4"/><rect x="492" y="284" width="35" height="24" rx="6" fill="#46656d"/><rect x="504" y="279" width="12" height="12" rx="2" fill="#d4b052"/><rect x="499" y="197" width="24" height="7" rx="2" fill="#244b57"/></g>
   ${p===2?`<g class="oh-rays"><path d="M510 283 488 241H532Z" fill="#ddb55635" stroke="#c29437" stroke-width="1.5"/><path d="M506 266Q454 278 418 300M498 254Q449 243 410 275M524 267q66 19 126 43" fill="none" stroke="#c39648" stroke-width="2" stroke-dasharray="5 6"/></g>`:''}
   <g class="oh-shield ${shield?'':'is-planned'}" aria-label="${shield?'Lead shielding screen in position':'Lead screen position being planned'}"><path d="M378 274 418 256V329L378 349Z" fill="#6b8791" stroke="#345a63" stroke-width="3"/><path d="M383 279 413 267V323L383 338Z" fill="#95acaf"/><path d="M379 349v9m39-29v16M365 361h27m13-14h27" stroke="#4f6767" stroke-width="4"/><circle cx="366" cy="364" r="4" fill="#405650"/><circle cx="430" cy="350" r="4" fill="#405650"/></g>
   ${p===2||p===3?`<path d="M350 279 380 291" stroke="#658c83" stroke-width="1.5"/>${label(178,244,177,'Lead screen',shield?'':'muted')}`:''}
   <path d="M491 311Q475 394 305 386" fill="none" stroke="#697c7666" stroke-width="3"/>
   <g filter="url(#oh-shadow)"><path d="M284 360h38l-5 30h-28Z" fill="#466369"/><path d="M290 363h25l-2 11h-22Z" fill="#afd5c1"/><circle cx="297" cy="382" r="3" fill="#d0b361"/><path d="M291 390v16m20-16v16" stroke="#45635c" stroke-width="4"/></g>
   ${p===3&&b>=1?'<path class="oh-distance" d="M238 415H431" fill="none" stroke="#437e78" stroke-width="2.5" marker-start="url(#oh-arrow)" marker-end="url(#oh-arrow)"/>':''}
   ${p===3&&b>=3?'<path class="oh-contact" d="M270 375Q550 427 838 371" fill="none" stroke="#659183" stroke-width="2" stroke-dasharray="6 8"/>':''}
   <g class="oh-gate ${closed?'is-closed':''}"><path d="M690 390v-36m109 36v-36" stroke="#65796a" stroke-width="6"/><path d="${closed?'M690 363H799':'M690 363l-16-63'}" stroke="${closed?'url(#oh-tape)':'#94a894'}" stroke-width="9"/></g>
   <g transform="translate(360 367)"><path d="M0 0 18-30 36 0Z" fill="#e6c14e" stroke="#514e31"/><text x="18" y="-6" text-anchor="middle" font-size="22" fill="#25362f">☢</text></g>
   ${person('daniel',danX,394,118,p===6?1:0)}
   ${person('sofia',863,395,124)}
   ${label(128,433,229,'Daniel · controls')}${label(749,433,220,'Sofia · access watch')}
   ${label(675,4,277,'Pedestrian route',closed?'closed':'')}
   <path d="M808 34v40l-66 57" fill="none" stroke="#718e81" stroke-width="1.5"/>
   ${label(651,398,174,closed?'CLOSED for RT':'OPEN · no RT',closed?'closed':'')}
   ${p===1?label(393,379,270,'Agree positions before exposure'):''}
   ${measuring?'<g class="oh-measure" aria-label="Boundary measurement locations, not measured results"><circle cx="350" cy="316" r="13"/><circle cx="560" cy="367" r="13"/><circle cx="786" cy="220" r="13"/><path d="M345 309h10v14h-10Zm210 51h10v14h-10Zm226-147h10v14h-10Z"/></g>':''}
   ${stopped?'<g class="oh-stop"><rect x="423" y="305" width="271" height="45" rx="8"/><text x="558" y="334" text-anchor="middle">STOP · reassess</text></g>':''}
  </svg>`;
 }
 function render(cue,beat){const p=+cue.split('-P')[1],b=Math.max(0,beat),note=notes[p-1][Math.min(b,notes[p-1].length-1)];
  const time=p===5?`<div class="oh-sequence">${['PREPARE','EXPOSE','VERIFY'].map((s,i)=>`<span class="${Math.min(b,2)===i?'active':''}"><b>${i+1}</b>${s}</span>`).join('<i>→</i>')}</div>`:'';
  return `<section class="oh-explainer" data-step="${p}-${b}" aria-label="Optimisation in Bram’s hall"><header><span>HAVENMEER PROCESS WORKS · OPTIMISATION</span><h2>${titles[p-1]}</h2></header>${hall(p,b)}${time}<div class="oh-focus ${p===6&&b>=3||p===4&&b>=3?'stop':''}">${note}</div><footer><span>Conceptual layout · positions and shielding require assessment.</span><button type="button" data-oh-source>Legal basis ↗</button></footer></section>`;
 }
 function openSource(){Player.reader('Optimisation — legal basis',`<div class="jp-source-reader"><p class="jp-reader-kind">Summary for this lesson</p><h3>Keep exposure as low as reasonably achievable</h3><p>ARBIS / RGPRI Article 20.1.1.1(b) establishes optimisation, taking economic and social factors into account. Meeting a dose limit does not, by itself, establish optimisation.</p><p><a href="${arbis}" target="_blank" rel="noopener">Read Article 20 on FANC Jurion ↗</a></p><h3>Prepare, supervise and verify the work</h3><p>The Royal Decree of 17 February 2023 requires correct written job information at least 24 hours beforehand (Article 6 §4), agreements about contacts and perimeter supervision (Article 8), at least two radiographers outside a bunker and checks before work (Article 16). Article 19 requires the perimeter, active boundary measurements and adequate supervision. Article 11 §2 requires stopping when work cannot proceed safely.</p><p><a href="${law}" target="_blank" rel="noopener">Read the industrial radiography decree on FANC Jurion ↗</a></p><p>The screen and positions in this hall are a conceptual example. The illustration does not specify shielding thickness, safe distances or measured dose rates, and does not establish that two people can supervise every real site.</p></div>`);}
 window.OptimisationHall={render,openSource,hall,person};
})();
