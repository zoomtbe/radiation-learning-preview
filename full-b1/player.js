/* One media channel; written sequence controls the five replacement activities. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), esc=Visuals.esc;
  const audio=new Audio();audio.preload='auto';
  const KEY='radiation-b1-owner-reset-301';
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  const resumePosition=saved.position;let lastSave=0,lastFrame=0;
  let li=0,si=0,pi=0,phase='narration',clip=null,auto=false,activityOpened=false,answered=false,feedbackCorrect=false,selected=null,visited=new Set(),beat=-2,promptPlays=0;
  let captions=saved.captions!==false,returnPlaying=false,dialogClip=null,doneCallback=null,token=0,ready=false;
  const media=window.B1_MEDIA||{}, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rig=EmiliaRig.create($('emilia-rig'),{src:'emilia-rig-base.png'}), performer=Performer.create(rig);
  const scene=()=>COURSE.lessons[li].scenes[si], lesson=()=>COURSE.lessons[li], paragraph=()=>scene().paragraphs[pi];
  const persist=()=>{saved.position={li,si,pi,time:audio.currentTime||0,phase};saved.captions=captions;try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{}};
  const stop=()=>{audio.pause();token++;doneCallback=null;};
  function setClip(id,onEnd,play=false){
    stop();clip=id;doneCallback=onEnd;audio.src=`${id}.mp3`;audio.playbackRate=+$('speed').value;audio.currentTime=0;
    $('captions').textContent='';
    $('stage').dataset.audio=id;$('stage').dataset.phase=phase;
    if(play)playAudio();else updateControls();
  }
  async function playAudio(){
    if(!clip)return;const ticket=token;
    if(audio.ended)audio.currentTime=0;
    try{await audio.play();if(ticket!==token)return;}catch(err){if(ticket===token&&err.name!=='AbortError'){$('captions').textContent='Press Play to begin the narration.';auto=false;}}
    updateControls();
  }
  function updateControls(){
    $('play').textContent=audio.paused?'▶':'Ⅱ';$('play').setAttribute('aria-label',audio.paused?'Play narration':'Pause narration');
    $('stage').dataset.playing=String(!audio.paused);
  }
  function before(){return scene().sequence.cues_before_interaction;}
  function post(){return scene().sequence.post_interaction_cues;}
  function navigate(l,s,play=false){
    stop();li=l;si=s;pi=0;phase='narration';auto=play;activityOpened=false;answered=false;selected=null;visited=new Set();promptPlays=0;
    $('activity').hidden=true;$('stage').classList.remove('question-mode');$('emilia-pose').style.display='none';$('emilia-rig').style.display='block';
    $('lesson-code').textContent=`${lesson().id} · ${lesson().title}`;$('scene-title').textContent=scene().title;
    $('scene-count').textContent=`${si+1} / ${lesson().scenes.length}`;
    $('previous').disabled=li===0&&si===0;$('next').disabled=false;$('next').textContent='Next ›';
    location.hash=`${lesson().id}-${scene().id}`;
    persist();showParagraph(0,play);
  }
  function showParagraph(index,play){
    phase='narration';pi=index;beat=-2;
    $('activity').hidden=true;$('stage').classList.remove('question-mode');
    Visuals.render(lesson().id,scene(),paragraph(),-1);beat=-1;
    $('emilia-rig').style.display='block';$('emilia-pose').style.display='none';
    setClip(paragraph().clip,paragraphDone,play);
  }
  function paragraphDone(){
    if(scene().interaction&&!activityOpened&&paragraph().cue===scene().sequence.interaction_after_cue){openActivity();return;}
    const order=answered?post().map(p=>p.cue):before(), idx=order.indexOf(paragraph().cue), nx=order[idx+1];
    if(nx){showParagraph(scene().paragraphs.findIndex(p=>p.cue===nx),auto);return;}
    if(scene().interaction&&!activityOpened){openActivity();return;}
    completeScene();
  }
  function completeScene(){
    const continueAutomatically=auto;phase='complete';$('stage').dataset.phase=phase;auto=false;
    saved.completed=saved.completed||{};saved.completed[`${lesson().id}-${scene().id}`]=true;persist();
    $('next').textContent=li===5&&si===lesson().scenes.length-1?'Finish B1':'Next scene ›';
    $('captions').textContent='Scene complete. Continue when you are ready.';updateControls();
    if(continueAutomatically&&si+1<lesson().scenes.length)navigate(li,si+1,true);
  }
  function next(){
    if(phase==='activity'&&!answered){$('captions').textContent='Complete this decision before continuing.';return;}
    if(scene().interaction&&!answered){openActivity();return;}
    if(si+1<lesson().scenes.length)navigate(li,si+1,true);else if(li+1<COURSE.lessons.length)navigate(li+1,0,true);else reader('B1 completed','<p>You have reached the end of B1. Finishing the module does not designate or authorise you, or replace practical instruction, medical surveillance or workplace experience.</p><p>Your notes and progress remain on this browser.</p>');
  }
  function activityHeader(i){return `<div class="activity-top"><span>${i.type==='guided_exploration'?'Explore the documents':i.id.includes('R01')?'Your decision':'Apply it'}</span><button id="hear-question">Hear the question</button></div><h2>${esc(i.prompt_spoken_once)}</h2>`;}
  function openActivity(){
    stop();phase='activity';activityOpened=true;auto=false;beat=-1;
    const i=scene().interaction;if(!i){completeScene();return;}
    $('stage').classList.add('question-mode');$('activity').hidden=false;$('status-controls').innerHTML='';
    $('stage').dataset.interaction=i.id;$('stage').dataset.promptPlays=promptPlays;
    $('activity').innerHTML=activityHeader(i)+'<div id="question-work"></div><div id="answer-feedback" hidden></div><div class="activity-actions" id="answer-actions"></div>';
    $('hear-question').onclick=()=>speakPrompt();
    if(i.type==='guided_exploration')renderExploration();else renderAnswers();
    promptPlays++;$('stage').dataset.promptPlays=promptPlays;
    setClip(i.clip,()=>{},true);
  }
  function speakPrompt(){setClip(scene().interaction.clip,()=>{},true);}
  function renderAnswers(){
    const i=scene().interaction;selected=null;feedbackCorrect=false;
    $('captions').textContent='';
    $('answer-feedback').hidden=true;
    const mode=i.id==='B1.1-R01'?'document-choices':i.id==='B1.5-R01'?'record-choices':'answers';
    $('question-work').innerHTML=(i.situation_visible_text?`<p class="situation">${esc(i.situation_visible_text)}</p>`:'')+(mode==='answers'?`<fieldset><legend class="sr-only">Choose one response</legend>${i.options.map((o,j)=>`<label class="answer"><input type="radio" name="response" value="${esc(o.id)}"><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`:`<div class="${mode}" role="group" aria-label="Select one ${mode==='document-choices'?'document':'record line'}">${i.options.map(o=>`<button data-choice="${esc(o.id)}" aria-pressed="false">${esc(o.text)}</button>`).join('')}</div>`);
    $('answer-actions').innerHTML='<button class="primary" id="check-answer" disabled>Check</button>';
    $('question-work').querySelectorAll('input').forEach(n=>n.onchange=()=>{selected=n.value;$('check-answer').disabled=false;});
    $('question-work').querySelectorAll('[data-choice]').forEach(n=>n.onclick=()=>{selected=n.dataset.choice;$('question-work').querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===n)));$('check-answer').disabled=false;});
    $('check-answer').onclick=check;
  }
  function check(){
    const option=scene().interaction.options.find(o=>o.id===selected);if(!option)return;
    feedbackCorrect=option.correct;
    $('answer-feedback').hidden=false;$('answer-feedback').className=`feedback ${option.correct?'correct':''}`;
    $('answer-feedback').innerHTML=`<b>${option.correct?'✓ Correct.':'Consider this.'}</b> ${esc(option.feedback.screen)}`;
    $('answer-actions').innerHTML=`<button id="hear-feedback">Hear feedback</button><button class="primary" id="feedback-next">${option.correct?'Continue':'Try again'}</button>`;
    $('hear-feedback').onclick=()=>setClip(option.clip,()=>{},true);
    $('feedback-next').onclick=()=>{stop();if(option.correct)finishActivity();else renderAnswers();};
    setClip(option.clip,()=>{},true);
  }
  function renderExploration(){
    const i=scene().interaction;
    $('question-work').innerHTML=`<div class="explore-items">${i.items.map(item=>`<button data-explore="${item.id}">${esc(item.label)}</button>`).join('')}</div><div id="exploration-document"></div>`;
    $('answer-actions').innerHTML='<button id="exploration-continue" class="primary" disabled>Continue</button>';
    $('question-work').querySelectorAll('[data-explore]').forEach(btn=>btn.onclick=()=>{
      const item=i.items.find(x=>x.id===btn.dataset.explore), docid=item.page.split(' ')[0];
      visited.add(item.id);btn.classList.add('visited');btn.setAttribute('aria-label',`${item.label}, visited`);
      $('exploration-document').innerHTML=`<div class="explore-document-preview">${Visuals.paper(docid)}<div><h3>${esc(item.field_in_focus)}</h3><p>${esc(item.screen)}</p><button id="read-selected-doc">Open document</button></div></div>`;
      $('read-selected-doc').onclick=()=>documentReader(docid);
      $('exploration-continue').disabled=visited.size<i.items.length;
      setClip(item.clip,()=>{},true);
    });
    $('exploration-continue').onclick=finishActivity;
  }
  function finishActivity(){
    answered=true;phase='narration';$('activity').hidden=true;$('stage').classList.remove('question-mode');
    delete $('stage').dataset.interaction;
    saved.answers=saved.answers||{};saved.answers[scene().interaction.id]=true;persist();
    if(post().length){auto=true;showParagraph(scene().paragraphs.findIndex(p=>p.cue===post()[0].cue),true);}else{Visuals.renderCurrent();auto=true;completeScene();}
  }
  function reader(title,html){
    returnPlaying=!audio.paused;dialogClip=clip;audio.pause();$('reader-title').textContent=title;$('reader-body').innerHTML=html;$('reader').showModal();updateControls();
  }
  function documentReader(id){
    const doc=COURSE.documents[id];if(!doc)return;
    reader(doc.title,`<article class="reader-document"><div class="eyebrow">Illustrative training document · no real client data</div><h3>${esc(doc.title)}</h3><dl>${Visuals.rows(id).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><small>${esc(doc.rules)}</small></article>`);
  }
  $('reader-close').onclick=()=>$('reader').close();
  $('reader').addEventListener('close',()=>{if(returnPlaying&&dialogClip===clip)playAudio();returnPlaying=false;});
  function contents(){
    reader('B1 · Contents',`<div class="contents-grid">${COURSE.lessons.map((l,i)=>`<section><h3>${esc(l.id)} · ${esc(l.title)}</h3>${l.scenes.map((s,j)=>`<button data-go="${i},${j}">${saved.completed?.[`${l.id}-${s.id}`]?'✓ ':''}${j+1}. ${esc(s.title)}</button>`).join('')}</section>`).join('')}</div>`);
    $('reader-body').querySelectorAll('[data-go]').forEach(btn=>btn.onclick=()=>{returnPlaying=false;$('reader').close();navigate(...btn.dataset.go.split(',').map(Number),false);});
  }
  $('home').onclick=contents;$('contents').onclick=contents;
  $('documents').onclick=()=>{reader('Documents and references',`<p>Illustrative training records, with fictional sample information. Detailed reading is separate from the narrated lesson.</p><div class="dialog-links">${Object.entries(COURSE.documents).map(([id,d])=>`<button data-doc="${id}">${esc(d.title)}</button>`).join('')}</div><p style="margin-top:24px">Sources and image credits: <a href="sources.html" target="_blank">Open the source reader</a>. Regulatory source: <a href="https://www.jurion.fanc.fgov.be/jurdb-consult/plainWettekstServlet?lang=nl&wettekstId=32765" target="_blank" rel="noreferrer">Royal decree on industrial radiography</a>. FANC is the regulator; this course does not claim Agency endorsement.</p>`);$('reader-body').querySelectorAll('[data-doc]').forEach(btn=>btn.onclick=()=>{const resume=returnPlaying;documentReader(btn.dataset.doc);returnPlaying=resume;});};
  $('notes').onclick=()=>{reader('Your notes','<p>Saved in this browser. Notes are optional and are not assessed.</p><textarea id="notes-text" aria-label="Your personal course notes"></textarea>');$('notes-text').value=saved.notes||'';$('notes-text').oninput=()=>{saved.notes=$('notes-text').value;persist();};};
  $('previous').onclick=()=>{if(si>0)navigate(li,si-1,false);else if(li>0)navigate(li-1,COURSE.lessons[li-1].scenes.length-1,false);};
  $('next').onclick=next;
  $('play').onclick=()=>{if(audio.paused){auto=phase==='narration';playAudio();}else{auto=false;audio.pause();updateControls();}};
  $('replay').onclick=()=>{audio.currentTime=0;auto=phase==='narration';playAudio();};
  $('speed').onchange=()=>audio.playbackRate=+$('speed').value;
  audio.volume=typeof saved.volume==='number'?saved.volume:1;
  $('volume').value=audio.volume;
  $('volume').oninput=()=>{audio.volume=+$('volume').value;saved.volume=audio.volume;persist();};
  $('cc').onclick=()=>{captions=!captions;$('cc').setAttribute('aria-pressed',captions);persist();};
  $('seek').oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*(+$('seek').value/100);};
  audio.addEventListener('ended',()=>{updateControls();const callback=doneCallback;doneCallback=null;if(callback)callback();});
  audio.addEventListener('error',()=>{$('captions').textContent='This audio could not load. Press replay to retry.';auto=false;updateControls();});
  audio.addEventListener('play',updateControls);audio.addEventListener('pause',updateControls);
  function beatAt(p,m,t){
    let result=-1;
    p.beats.forEach((b,i)=>{const prefix=p.text.slice(0,p.text.indexOf(b.at));const index=(prefix.match(/\S+/g)||[]).length;const when=m?.w?.[index]?.[1] ?? (index/Math.max(1,p.text.split(/\s+/).length))*(m?.d||audio.duration||1);if(t>=when)result=i;});
    return result;
  }
  function animate(now){
    // A restrained 30 fps performance; avoid spending a full frame on an obscured tab.
    if(now-lastFrame<32||document.hidden){requestAnimationFrame(animate);return;}lastFrame=now;
    const m=media[clip], t=audio.currentTime||0;
    performer.frame(now/1000,{id:clip||'',media:m,t,playing:!audio.paused,gestures:true},{listening:phase==='activity',reducedMotion:reduced,mood:feedbackCorrect?'correct':undefined,turn:{side:'right',k:phase==='narration'&&Math.sin(now/4300)>.8?.3:0}});
    if(phase==='narration'){
      const b=beatAt(paragraph(),m,t);if(b!==beat){beat=b;Visuals.render(lesson().id,scene(),paragraph(),b);}
    }
    // An occasional supplied waiting pose changes the posture while no speech is playing.
    const waiting=phase==='activity'&&audio.paused&&!reduced;
    const waitingPose=waiting&&Math.floor(now/8000)%3===1;
    if(waitingPose){
      if($('emilia-pose').style.display!=='block'){
        const data=CAST.people.emilia_poses,p=Object.values(data.poses)[0],h=$('presenter').clientHeight,scale=h/(p.bounds[3]-p.bounds[1]);
        const w=(p.bounds[2]-p.bounds[0])*scale;
        Object.assign($('emilia-pose').style,{display:'block',width:w+'px',height:h+'px',left:'50%',transform:'translateX(-50%)',backgroundImage:`url('${data.src}')`,backgroundSize:`${data.size[0]*scale}px ${data.size[1]*scale}px`,backgroundPosition:`${-p.bounds[0]*scale}px ${-p.bounds[1]*scale}px`,backgroundRepeat:'no-repeat'});
      }
      $('emilia-rig').style.visibility='hidden';
    }else{$('emilia-pose').style.display='none';$('emilia-rig').style.visibility='visible';}
    if(!audio.paused&&m){
      if(captions){let idx=0;m.w.forEach((w,i)=>{if(t>=w[1])idx=i;});const chunk=m.c?.find(c=>idx>=c[0]&&idx<c[1]);$('captions').textContent=chunk?m.w.slice(chunk[0],chunk[1]).map(w=>w[0]).join(' '):m.w.slice(Math.max(0,idx-3),idx+7).map(w=>w[0]).join(' ');}else $('captions').textContent='';
    }
    const d=Number.isFinite(audio.duration)?audio.duration:m?.d||0;
    $('seek').value=d?t/d*100:0;$('time').textContent=`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')} / ${Math.floor(d/60)}:${String(Math.floor(d%60)).padStart(2,'0')}`;
    if(now-lastSave>2500&&!audio.paused){persist();lastSave=now;}
    requestAnimationFrame(animate);
  }
  window.Player={reader,document:documentReader};
  const hash=location.hash.match(/B1\.(\d)-S(\d+)/);
  if(hash){li=Math.max(0,Math.min(5,+hash[1]-1));si=Math.max(0,Math.min(COURSE.lessons[li].scenes.length-1,+hash[2]-1));}else if(saved.position){li=saved.position.li;si=saved.position.si;}
  navigate(li,si,false);
  if(!hash&&resumePosition?.phase==='narration'&&Number.isInteger(resumePosition.pi)&&scene().sequence.cues_before_interaction.includes(scene().paragraphs[resumePosition.pi]?.cue)){
    showParagraph(resumePosition.pi,false);audio.addEventListener('loadedmetadata',()=>{audio.currentTime=Math.min(resumePosition.time||0,audio.duration-.2);},{once:true});
  }
  requestAnimationFrame(animate);ready=true;
})();
