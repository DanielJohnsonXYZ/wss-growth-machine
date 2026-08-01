// 5. Weekly focus planner
const weeklyCriteria=[
  {id:'impact',title:'Commercial impact',q:'How much could progress on each constraint affect revenue, retention, speed or risk?',weight:1.35,labels:['High impact','Moderate impact','Lower impact']},
  {id:'evidence',title:'Evidence strength',q:'How strongly is each constraint supported by recent data or behaviour?',weight:1,labels:['Strong evidence','Some evidence','Mostly assumption']},
  {id:'control',title:'Influence this week',q:'How much meaningful progress can the team make within one week?',weight:1.2,labels:['Directly controllable','Partly controllable','Hard to influence']},
  {id:'urgency',title:'Urgency',q:'How costly is it to leave this unchanged for another week?',weight:.8,labels:['Urgent now','Important','Can wait']}
];
function candidateFromResults(){
  const out=[];
  if(state.results.bottleneck){const r=state.results.bottleneck;out.push({id:'bottleneck',source:'Growth dependency',name:r.label,evidenceTarget:r.evidenceTarget,actions:r.actions});}
  if(state.results.customer){const r=state.results.customer;out.push({id:'customer',source:'Customer focus',name:`Validate ${r.winner} as the priority segment`,evidenceTarget:r.evidenceTarget,actions:r.actions});}
  if(state.results.positioning){const r=state.results.positioning;out.push({id:'positioning',source:'Positioning',name:'Validate the working positioning direction',evidenceTarget:r.evidenceTarget,actions:r.actions});}
  if(state.results.leak){const r=state.results.leak;out.push({id:'leak',source:'GTM leak',name:`${r.type} at ${r.stage}`,evidenceTarget:r.evidenceTarget,actions:r.actions});}
  return out;
}
function weeklyIntro(){
  const count=candidateFromResults().length;
  return introPage('weekly',{label:'Weekly constraint planner',title:TOOL_META.weekly.title,lead:count?`You have ${count} completed diagnoses ready to compare. Choose one constraint, one evidence target and no more than three actions.`:'Complete another tool first, or add two competing priorities manually.',startFn:'startWeekly',startLabel:completed('weekly')?'Review or rebuild':'Build my weekly focus',meta:'About 5 minutes · Imports previous results · One constraint and three actions',benefits:[['Compare, do not combine','A good week has one commercial learning priority.'],['Use existing diagnoses','Results from the other tools appear automatically.'],['End with evidence','Friday success is defined by what was learned or changed.']]});
}
window.startWeekly=function(){
  const imported=candidateFromResults();const d=state.drafts.weekly||{};session={tool:'weekly',step:d.step||0,candidates:d.candidates||imported,selected:d.selected||imported.slice(0,3).map(x=>x.id),ratings:d.ratings||weeklyCriteria.map(()=>({})),hours:d.hours||4};track('Tool Started',{tool:'weekly',imported:imported.length});renderWeekly();
};
function persistWeekly(){state.drafts.weekly={step:session.step,candidates:session.candidates,selected:session.selected,ratings:session.ratings,hours:session.hours};saveState();}
window.toggleCandidate=function(id){if(session.selected.includes(id))session.selected=session.selected.filter(x=>x!==id);else if(session.selected.length<3)session.selected.push(id);persistWeekly();renderWeekly();};
window.addManualCandidate=function(){const input=document.getElementById('manualCandidate'),name=clean(input?.value);if(name.split(' ').length<3)return;const id='manual-'+uid();session.candidates.push({id,source:'Manual priority',name,evidenceTarget:`Collect evidence that confirms whether ${name.toLowerCase()} is the current commercial constraint.`,actions:[`Define the current baseline and the specific evidence that would change the decision.`,`Run one customer-facing or operational test related to ${name.toLowerCase()}.`,`Review the result on Friday and decide whether to continue, change or stop.`]});session.selected.push(id);persistWeekly();renderWeekly();};
function selectedCandidates(){return session.candidates.filter(c=>session.selected.includes(c.id));}
window.weeklyCandidatesNext=function(){if(selectedCandidates().length<2)return;session.step=1;persistWeekly();renderWeekly();window.scrollTo(0,0);};
window.chooseWeeklyRating=function(candidateId,value){const ci=session.step-1;session.ratings[ci][candidateId]=value;persistWeekly();renderWeekly();};
window.weeklyNext=function(){const ci=session.step-1,cands=selectedCandidates();if(cands.some(c=>session.ratings[ci][c.id]===undefined))return;if(session.step<weeklyCriteria.length){session.step++;persistWeekly();renderWeekly();window.scrollTo(0,0);}else{session.step=weeklyCriteria.length+1;persistWeekly();renderWeekly();}};
window.setHours=function(h){session.hours=h;persistWeekly();renderWeekly();};
window.finishWeekly=function(){
  const cands=selectedCandidates();const totals=cands.map(c=>({c,score:weeklyCriteria.reduce((sum,cr,ci)=>sum+(session.ratings[ci][c.id]||1)*cr.weight,0)})).sort((a,b)=>b.score-a.score);const top=totals[0],second=totals[1];const gap=top.score-second.score;const conf=gap>=1.6?'strong':gap>=.7?'medium':'low';
  const durations=session.hours<=2?['30 minutes','60 minutes','30 minutes']:session.hours<=4?['60 minutes','2 hours','60 minutes']:['90 minutes','4 hours','2.5 hours'];
  const actions=top.c.actions.slice(0,3).map((x,i)=>({text:x,time:durations[i]}));
  const result={name:top.c.name,source:top.c.source,confidence:conf,evidenceTarget:top.c.evidenceTarget,actions,defer:totals.slice(1).map(x=>x.c.name),hours:session.hours,review:['Did we reach the evidence target?','What changed our understanding of the customer or constraint?','Should we continue, change or stop this work next week?'],createdAt:new Date().toISOString()};
  state.results.weekly=result;delete state.drafts.weekly;saveState();track('Tool Completed',{tool:'weekly',source:top.c.source});session={};render();
};
window.weeklyBack=function(){if(session.step===0){session={};render();}else{session.step--;persistWeekly();renderWeekly();window.scrollTo(0,0);}};
function renderWeekly(){
  if(session.step===0){
    const cards=session.candidates.map(c=>`<button class="option ${session.selected.includes(c.id)?'selected':''}" onclick="toggleCandidate('${c.id}')"><span class="option-mark">${session.selected.includes(c.id)?'✓':'+'}</span><span><strong>${esc(c.name)}</strong><span class="desc">${esc(c.source)}</span></span></button>`).join('');
    app.innerHTML=layout(`<div class="wizard">${progress(0,weeklyCriteria.length+2,'Choose the competing constraints')}<section class="panel"><span class="step-kicker">Candidate constraints</span><h2>Which two or three priorities are competing for attention?</h2><p class="intro">Completed tool results are imported automatically. Select at least two and no more than three.</p><div class="options">${cards||'<div class="empty">No completed diagnoses yet. Add two manual priorities below.</div>'}</div><div class="field"><label>Add a manual priority</label><div style="display:flex;gap:8px"><input id="manualCandidate" placeholder="e.g. Improve onboarding activation for new accounts"><button class="btn secondary" onclick="addManualCandidate()">Add</button></div><div class="hint">Use a specific problem, not a broad task such as “do marketing”.</div></div><div class="quality ${selectedCandidates().length>=2?'good':'warn'}">${selectedCandidates().length} selected. Choose 2 or 3.</div><div class="wizard-actions"><button class="back" onclick="weeklyBack()">← Start</button><button class="btn primary" onclick="weeklyCandidatesNext()" ${selectedCandidates().length>=2?'':'disabled'}>Compare priorities →</button></div></section></div>`,TOOL_META.weekly.title,TOOL_META.weekly.desc);return;
  }
  if(session.step<=weeklyCriteria.length){
    const ci=session.step-1,c=weeklyCriteria[ci],cands=selectedCandidates();const complete=cands.every(x=>session.ratings[ci][x.id]!==undefined);
    const rows=cands.map(x=>`<div class="segment-row"><strong>${esc(x.name)}</strong><div class="rating-buttons" style="grid-template-columns:repeat(3,1fr)">${c.labels.map((label,i)=>{const value=3-i;return `<button class="rating ${session.ratings[ci][x.id]===value?'selected':''}" onclick="chooseWeeklyRating('${x.id}',${value})">${esc(label)}</button>`;}).join('')}</div></div>`).join('');
    app.innerHTML=layout(`<div class="wizard">${progress(session.step,weeklyCriteria.length+2,c.title)}<section class="panel"><span class="step-kicker">${esc(c.title)}</span><h2>${esc(c.q)}</h2><div class="segment-list">${rows}</div><div class="wizard-actions"><button class="back" onclick="weeklyBack()">← Back</button><button class="btn primary" onclick="weeklyNext()" ${complete?'':'disabled'}>Continue →</button></div></section></div>`,TOOL_META.weekly.title,TOOL_META.weekly.desc);return;
  }
  app.innerHTML=layout(`<div class="wizard">${progress(weeklyCriteria.length+1,weeklyCriteria.length+2,'Set the capacity')}<section class="panel"><span class="step-kicker">Available capacity</span><h2>How much focused time can the team protect this week?</h2><p class="intro">This controls the size of the three actions. Choose a realistic amount, not the theoretical maximum.</p><div class="options">${[[2,'2 focused hours','A small evidence sprint'],[4,'4 focused hours','A meaningful test and review'],[8,'8 or more hours','A deeper customer-facing or operational experiment']].map((x,i)=>`<button type="button" class="option ${session.hours===x[0]?'selected':''}" onclick="setHours(${x[0]})"><span class="option-mark">${String.fromCharCode(65+i)}</span><span><strong>${esc(x[1])}</strong><span class="desc">${esc(x[2])}</span></span></button>`).join('')}</div><div class="wizard-actions"><button class="back" onclick="weeklyBack()">← Back</button><button class="btn primary" onclick="finishWeekly()">Build my week →</button></div></section></div>`,TOOL_META.weekly.title,TOOL_META.weekly.desc);
}
function weeklyResult(){
  const r=state.results.weekly;if(!r)return weeklyIntro();
  const copy=`WEEKLY GROWTH FOCUS\n\nConstraint: ${r.name}\nSource: ${r.source}\nConfidence: ${r.confidence}\nAvailable capacity: ${r.hours}+ focused hours\n\nEvidence target\n${r.evidenceTarget}\n\nThree actions\n${r.actions.map((x,i)=>`${i+1}. ${x.text} (${x.time})`).join('\n')}\n\nDefer\n${r.defer.map(x=>`- ${x}`).join('\n')}\n\nFriday review\n${r.review.map((x,i)=>`${i+1}. ${x}`).join('\n')}`;
  const content=`<div class="results"><div class="result-head"><span class="eyebrow">Your weekly growth focus</span><h1>${esc(r.name)}</h1><p>Protect the week around one constraint. Everything else remains visible, but deferred.</p><span class="confidence ${r.confidence}">● ${r.confidence==='strong'?'Strong':r.confidence==='medium'?'Working':'Low'} decision confidence</span></div><div class="result-grid"><article class="result-card focus full"><span class="section-label">The constraint</span><h2>${esc(r.name)}</h2><div class="tool-meta"><span class="chip">Source: ${esc(r.source)}</span><span class="chip">Capacity: ${r.hours}+ focused hours</span></div></article><article class="result-card full"><span class="section-label">Evidence target</span><h3>By Friday, we need to know or change this</h3><div class="copy-box">${esc(r.evidenceTarget)}</div></article><article class="result-card full"><span class="section-label">Three actions</span><h3>The whole week</h3><div class="action-list">${r.actions.map((x,i)=>`<div class="action-item"><b>${i+1}</b><p><strong>${esc(x.time)}:</strong> ${esc(x.text)}</p></div>`).join('')}</div></article><article class="result-card"><span class="section-label">Explicit defer list</span><h3>Not this week</h3><div class="defer-list">${r.defer.map(x=>`<span>${esc(x)}</span>`).join('')||'<span>No other priorities recorded</span>'}</div></article><article class="result-card"><span class="section-label">Friday review</span><h3>Close the learning loop</h3>${evidenceItems(r.review)}</article><article class="result-card warning full"><span class="section-label">Working rule</span><h3>Do not add a fourth action</h3><p>When new work appears, either defer it or replace one of the three actions. A focused week is valuable because it creates interpretable evidence.</p></article></div>${resultActions(copy,'weekly')}<div class="next-card"><div><h3>Need a second pair of eyes?</h3><p>Bring the diagnosis, evidence target and current numbers to a focused WSS Growth Audit.</p></div><a class="btn" href="https://wescalestartups.com/contact" target="_blank" rel="noopener" data-track="Growth Audit Clicked" data-tool="weekly">Talk it through with Daniel →</a></div></div>`;
  return layout(content,TOOL_META.weekly.title,TOOL_META.weekly.desc);
}

function render(){
  const path=currentPath();
  if(path==='/'){app.innerHTML=home();return;}
  if(path==='/bottleneck'){app.innerHTML=bottleneckResult();return;}
  if(path==='/customer'){app.innerHTML=customerResult();return;}
  if(path==='/positioning'){app.innerHTML=positioningResult();return;}
  if(path==='/leak'){app.innerHTML=leakResult();return;}
  if(path==='/weekly'){app.innerHTML=weeklyResult();return;}
  app.innerHTML=home();
}

// Expose selected helpers used by inline event handlers.
Object.assign(window,{state,copyText,restartTool,track,renderPositioning,renderPositionReview,renderWeekly});
render();
