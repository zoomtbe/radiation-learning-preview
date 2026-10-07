/* One requested three-case activity. All spoken feedback uses Player's single audio channel. */
(() => {
 'use strict';
 let data,api,index=0,result=false,completed=0;
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function readCase(){if(data&&!result)api.speak(data.cases[index].clip);}
 function draw(){
  result=false;const c=data.cases[index];
  $('stage').dataset.sortCase=c.id;$('stage').dataset.sortCompleted=String(completed);delete $('stage').dataset.sortCorrect;
  $('answer-feedback').hidden=true;$('answer-feedback').textContent='';$('answer-actions').innerHTML='';
  $('question-work').innerHTML=`<div class="ls-progress"><span>Case ${index+1} of ${data.cases.length}</span><button type="button" id="ls-hear-case">Hear this case</button></div><div class="ls-work"><article class="ls-card" draggable="true" tabindex="0" aria-label="Workpiece: ${esc(c.title)}" aria-describedby="ls-help"><span class="ls-drag">DRAG THIS WORKPIECE →</span><h3>${esc(c.title)}</h3><dl><div><dt>Dimensions</dt><dd>${esc(c.dimensions)}</dd></div><div><dt>Mass</dt><dd>${esc(c.mass)}</dd></div><div><dt>Wall thickness</dt><dd>${esc(c.thickness)}</dd></div></dl><div class="ls-facts">${c.facts.map(f=>`<p>${esc(f)}</p>`).join('')}</div></article><div class="ls-destinations" role="group" aria-label="Choose the irradiation location">${data.destinations.map(d=>`<button type="button" data-ls-destination="${d.id}"><strong>${esc(d.label)}</strong><span>${esc(d.detail)}</span></button>`).join('')}</div></div><p id="ls-help">Drag the workpiece to the right, or click a destination. Keyboard: Tab to a destination, then Enter.</p>`;
  $('ls-hear-case').onclick=readCase;
  const card=$('question-work').querySelector('.ls-card');
  // Pointer capture supports mouse and touch consistently; keyboard selection remains available.
  card.draggable=false;
  let drag=null;
  const targetAt=e=>document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-ls-destination]');
  const endDrag=()=>{if(drag?.ghost)drag.ghost.remove();drag=null;card.classList.remove('dragging');$('question-work').querySelectorAll('.drag-over').forEach(n=>n.classList.remove('drag-over'));};
  card.onpointerdown=e=>{if(result||e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};card.setPointerCapture(e.pointerId);};
  card.onpointermove=e=>{
   if(!drag)return;
   if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){const box=card.getBoundingClientRect();drag.ghost=card.cloneNode(true);drag.ghost.className='ls-card ls-drag-ghost';drag.ghost.setAttribute('aria-hidden','true');drag.ghost.removeAttribute('tabindex');drag.ghost.style.width=box.width+'px';document.body.append(drag.ghost);card.classList.add('dragging');}
   if(!drag.ghost)return;
   drag.ghost.style.left=(e.clientX-50)+'px';drag.ghost.style.top=(e.clientY-22)+'px';
   const over=targetAt(e);$('question-work').querySelectorAll('[data-ls-destination]').forEach(n=>n.classList.toggle('drag-over',n===over));
  };
  card.onpointerup=e=>{if(!drag)return;const dest=drag.ghost?targetAt(e)?.dataset.lsDestination:null;if(card.hasPointerCapture(e.pointerId))card.releasePointerCapture(e.pointerId);endDrag();if(dest)choose(dest,'drag');};
  card.onpointercancel=endDrag;card.onlostpointercapture=endDrag;
  $('question-work').querySelectorAll('[data-ls-destination]').forEach(btn=>{
   btn.onclick=()=>choose(btn.dataset.lsDestination,'select');
  });
 }
 function choose(dest,input){
  if(result)return;const c=data.cases[index],f=c.feedback[dest];if(!f)return;
  result=true;api.stop();$('stage').dataset.sortCorrect=String(f.correct);$('stage').dataset.sortInput=input;
  const label=data.destinations.find(d=>d.id===dest).label;
  $('question-work').innerHTML=`<div class="ls-result-case"><div><span>Case ${index+1} of ${data.cases.length}</span><h3>${esc(c.title)}</h3><p>${esc(c.dimensions)} · ${esc(c.mass)} · wall ${esc(c.thickness)}</p></div><div class="ls-result-choice"><span>Your choice</span><strong>${esc(label)}</strong></div></div>`;
  $('answer-feedback').hidden=false;$('answer-feedback').className=`feedback ls-feedback ${f.correct?'correct':''}`;
  const feedbackText=f.screen.replace(/^Correct(?:, with conditions)?\.\s*/,'');
  $('answer-feedback').setAttribute('role','status');$('answer-feedback').innerHTML=`<b>${f.correct?'✓ Correct — here is why.':'↩ This location does not fit the case.'}</b><p>${esc(feedbackText)}</p>`;
  $('answer-actions').innerHTML=`<button id="ls-law">Legal basis</button><button id="hear-feedback">Hear feedback</button><button class="primary" id="feedback-next">${f.correct?(index+1===data.cases.length?'Continue to optimisation':'Next workpiece'):'Try this case again'}</button>`;
  $('ls-law').onclick=()=>JustificationPath.openSource(index===0?'threshold':index===1?'hierarchy':'bram');
  $('hear-feedback').onclick=()=>api.speak(f.clip);
  $('feedback-next').onclick=()=>{
   api.stop();if(!f.correct){draw();$('question-work').querySelector('.ls-card').focus();return;}
   completed++;$('stage').dataset.sortCompleted=String(completed);
   if(index+1===data.cases.length){api.finish();return;}
   index++;draw();readCase();$('question-work').querySelector('.ls-card').focus();
  };
  api.speak(f.clip);
 }
 function mount(i,callbacks){data=i;api=callbacks;index=0;completed=0;draw();}
 window.LocationSort={mount,readCase};
})();
