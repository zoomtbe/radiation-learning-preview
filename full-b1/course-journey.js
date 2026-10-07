/* Owner point 2: the course route advances by spoken topic, not by paragraph number. */
(() => {
  'use strict';
  const topics = {
    framework: [0,'Start here · B1','The Belgian framework','Who is responsible for what, before work begins.','people'],
    science: [1,'Build the foundations','Understanding radiation','Sources and quantities, shielding, exposure, biological effects and dosimetry.','science'],
    instruments: [2,'Continue the foundations','Instruments and safety checks','The instruments and checks used in everyday work.','checks'],
    sources: [2,'Continue the foundations','Sources and contamination','The routines around sources and contamination.','source'],
    colleagues: [0,'Your guides through the course','A colleague for each subject','Emilia stays with you throughout B1.','people'],
    application: [2,'Additional class II modules','Apply the foundation','Activity and equipment, measurements, worksites, transport and unusual events.','application'],
    continuity: [2,'One module at a time','Build on what you learn','Each module gives you something the next one can use.','application']
  };
  const paths = {
    people: '<path d="M65 92L120 130L175 92M120 130V166" fill="none" stroke="#b9c6b9" stroke-width="4"/><g fill="#f4ecd5" stroke="#517d73" stroke-width="3"><circle cx="65" cy="59" r="19"/><circle cx="175" cy="59" r="19"/><circle cx="120" cy="132" r="20"/></g><g fill="#5c897d"><path d="M31 114V99Q31 79 65 79Q99 79 99 99V114Z"/><path d="M141 114V99Q141 79 175 79Q209 79 209 99V114Z"/><path d="M82 189V177Q82 154 120 154Q158 154 158 177V189Z"/></g><path d="M110 132l7 7 15-18" fill="none" stroke="#c3a35c" stroke-width="4" stroke-linecap="round"/>',
    science: '<g fill="none" stroke="#5b897e" stroke-width="4"><ellipse cx="120" cy="108" rx="91" ry="33"/><ellipse cx="120" cy="108" rx="91" ry="33" transform="rotate(60 120 108)"/><ellipse cx="120" cy="108" rx="91" ry="33" transform="rotate(120 120 108)"/></g><circle cx="120" cy="108" r="17" fill="#d7b35c"/><g fill="#32665f" stroke="#fbfaf1" stroke-width="3"><circle cx="205" cy="120" r="9"/><circle cx="78" cy="35" r="9"/><circle cx="75" cy="183" r="9"/></g>',
    checks: '<rect x="57" y="31" width="123" height="160" rx="13" fill="#fffdf5" stroke="#557e73" stroke-width="4"/><rect x="92" y="23" width="56" height="19" rx="6" fill="#d6b45f"/><g fill="none" stroke="#517d73" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M76 75l7 7 13-16M107 76h49M76 108l7 7 13-16M107 109h36M76 141l7 7 13-16M107 142h33"/></g><circle cx="181" cy="160" r="31" fill="#e7eee1" stroke="#557e73" stroke-width="4"/><path d="M170 161l8 8 15-18" fill="none" stroke="#32665f" stroke-width="5" stroke-linecap="round"/>',
    source: '<path d="M48 55H192V168H48Z" fill="#eef1e5" stroke="#608579" stroke-width="4"/><path d="M48 55l23-20h98l23 20" fill="#dfe7d9" stroke="#608579" stroke-width="4"/><circle cx="120" cy="109" r="38" fill="#dfc168"/><g fill="#345b50" transform="translate(120 109)"><circle r="7"/><path d="M-10-6L-29-17A34 34 0 0 1 0-34V-12A12 12 0 0 0-10-6Z" transform="rotate(-30)"/><path d="M-10-6L-29-17A34 34 0 0 1 0-34V-12A12 12 0 0 0-10-6Z" transform="rotate(90)"/><path d="M-10-6L-29-17A34 34 0 0 1 0-34V-12A12 12 0 0 0-10-6Z" transform="rotate(210)"/></g><path d="M70 186H170" stroke="#c9d3c3" stroke-width="7" stroke-linecap="round"/>',
    application: '<path d="M38 81L90 63V81L143 62V81H204V179H38Z" fill="#edf0e3" stroke="#5b8275" stroke-width="4"/><path d="M158 81V34H182V81" fill="#dfe7d9" stroke="#5b8275" stroke-width="4"/><g fill="#b8cabe"><rect x="57" y="101" width="26" height="27" rx="3"/><rect x="98" y="101" width="26" height="27" rx="3"/><rect x="139" y="101" width="26" height="27" rx="3"/></g><path d="M77 179v-28h37v28" fill="#6c9586"/><circle cx="189" cy="161" r="34" fill="#dfc16f" stroke="#fbfaf1" stroke-width="5"/><path d="M175 162l10 10 19-24" fill="none" stroke="#345f54" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function illustration(kind) {
    return `<svg class="journey-illustration" viewBox="0 0 240 215" role="img" aria-label="Topic illustration"><ellipse cx="120" cy="200" rx="91" ry="7" fill="#bccbbc" opacity=".35"/>${paths[kind]}</svg>`;
  }
  function route(topic) {
    const [active,eyebrow,title,copy,art]=topics[topic];
    const steps=['Framework and people','Radiation and protection','Equipment and routines'];
    return `<section class="course-journey" data-journey-topic="${topic}" aria-label="Your route through the course"><ol class="journey-track">${steps.map((s,i)=>`<li class="${i===active?'current':i<active?'visited':''}" ${i===active?'aria-current="step"':''}><span class="journey-step-number" aria-hidden="true">${i+1}</span><span>${s}</span></li>`).join('')}</ol><div class="journey-focus">${illustration(art)}<div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${copy}</p></div></div></section>`;
  }
  function rhythm(beat) {
    const active=beat<0?0:beat>=4?-1:beat;
    const steps=[['Explanation','Understand the idea.','book'],['Workplace example','See it in a situation.','case'],['Your decision','Choose a response.','choice'],['Feedback','Understand why.','feedback']];
    const icons={book:'<path d="M5 8q10-5 19 0q9-5 19 0v31q-9-5-19 0q-9-5-19 0zM24 8v31"/>',case:'<rect x="5" y="14" width="38" height="28" rx="4"/><path d="M16 14V7h16v7M5 26h38M20 24v5h8v-5"/>',choice:'<circle cx="10" cy="12" r="4"/><circle cx="10" cy="26" r="4"/><path d="M6 39l3 3 7-8M23 12h18M23 26h18M23 39h18"/>',feedback:'<path d="M6 7h36v28H22l-10 8v-8H6zM15 20l7 7 12-13"/>'};
    return `<section class="learning-journey" data-journey-topic="learning-rhythm"><header><span class="eyebrow">How you will learn</span><h2>Understand. Try. Learn from the response.</h2></header><ol>${steps.map(([title,copy,icon],i)=>`<li class="${i===active?'current':''}"><svg viewBox="0 0 48 48" aria-hidden="true">${icons[icon]}</svg><h3>${title}</h3><p>${copy}</p></li>`).join('')}</ol><p class="assessment-note ${beat>=4?'emphasised':''}">Practice questions help you learn. The final assessment is separate.</p></section>`;
  }
  window.CourseJourney={render(cue,beat){
    const p=+cue.split('-P')[1];
    const topic=p===1?'framework':p===2?'science':p===3?(beat>=2?'application':beat>=1?'sources':'instruments'):'colleagues';
    return route(topic);
  }};
})();
