'use strict';

const app = document.getElementById('app');
const STORAGE_KEY = 'wss-growth-tools-v2';
const ROUTES = ['/', '/bottleneck', '/customer', '/positioning', '/leak', '/weekly'];
const TOOL_ORDER = ['bottleneck','customer','positioning','leak','weekly'];
const TOOL_META = {
  bottleneck:{number:'01',title:'What is keeping growth dependent on you?',short:'Growth dependency',time:'4 minutes',desc:'Find the commercial capability that still relies most on founder knowledge, effort or judgement.',route:'/bottleneck'},
  customer:{number:'02',title:'Which customer segment should we prioritise next?',short:'Customer focus',time:'6 minutes',desc:'Compare real customer segments using evidence, economics and delivery fit, then choose where to focus.',route:'/customer'},
  positioning:{number:'03',title:'How do I explain what my product does?',short:'Positioning',time:'8 minutes',desc:'Turn customer evidence into one clear messaging direction that is ready to test.',route:'/positioning'},
  leak:{number:'04',title:'Where are we losing customers?',short:'GTM leak',time:'5 minutes',desc:'Separate a volume problem, conversion leak and measurement gap, then identify the most important stage.',route:'/leak'},
  weekly:{number:'05',title:'What should I focus on this week?',short:'Weekly focus',time:'5 minutes',desc:'Compare the strongest diagnoses, choose one constraint and leave with one evidence target and three actions.',route:'/weekly'}
};

const defaultState = () => ({profile:{product:'',customer:''},drafts:{},results:{},version:2});
let state = loadState();
let session = {};

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.version === 2 ? saved : defaultState();
  }catch(e){return defaultState();}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function esc(value){return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clean(value){return String(value ?? '').trim().replace(/\s+/g,' ').replace(/[.!?]+$/,'');}
function lowerFirst(value){const x=clean(value);return x ? x[0].toLowerCase()+x.slice(1) : '';}
function sentence(value){const x=clean(value);return x ? x[0].toUpperCase()+x.slice(1)+'.' : '';}
function clampText(value,max=120){const x=clean(value);if(x.length<=max)return x;return x.slice(0,max).replace(/\s+\S*$/,'');}
function slug(value){return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function uid(){return Math.random().toString(36).slice(2,9);}
function track(name,data={}){
  try{window.va('event',{name,data});}catch(e){}
}
function toast(text='Copied'){
  const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1500);
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);toast();track('Result Copied',{tool:currentTool()||'collection'});}catch(e){toast('Copy failed');}
}
function currentPath(){return ROUTES.includes(location.pathname)?location.pathname:'/';}
function currentTool(){return Object.keys(TOOL_META).find(k=>TOOL_META[k].route===currentPath())||'';}
function go(path,source='navigation'){
  if(!ROUTES.includes(path))path='/';
  history.pushState({},'',path);session={};render();window.scrollTo(0,0);
  const tool=Object.keys(TOOL_META).find(k=>TOOL_META[k].route===path);
  if(tool)track('Tool Viewed',{tool,source});
}
window.addEventListener('popstate',()=>{session={};render();window.scrollTo(0,0);});
document.addEventListener('click',e=>{
  const routeEl=e.target.closest('[data-route]');
  if(routeEl){e.preventDefault();go(routeEl.dataset.route,routeEl.dataset.source||'link');}
  const tracked=e.target.closest('[data-track]');
  if(tracked)track(tracked.dataset.track,{tool:tracked.dataset.tool||currentTool()||'collection'});
});

function header(){
  return `<header class="site-header"><div class="shell header-inner">
    <a href="/" class="brand always" data-route="/">We Scale <span>Startups</span></a>
    <nav class="nav"><a href="/" class="always" data-route="/">All tools</a><a href="https://wescalestartups.com" target="_blank" rel="noopener">WSS website</a><span class="privacy">Answers stay in this browser</span></nav>
  </div></header>`;
}
function footer(){
  return `<footer class="site-footer"><div class="shell footer-inner"><span>Built by We Scale Startups</span><span>Research → Experiment → Test → Scale</span></div></footer>`;
}
function layout(content,title,description){
  if(title)document.title=`${title} | We Scale Startups`;else document.title='WSS Growth Tools | We Scale Startups';
  const meta=document.querySelector('meta[name="description"]');if(meta&&description)meta.setAttribute('content',description);
  return `${header()}<main class="screen">${content}</main>${footer()}`;
}
function completed(tool){return Boolean(state.results[tool]);}
function draftExists(tool){return Boolean(state.drafts[tool]);}
function statusHtml(tool){
  if(completed(tool))return '<span class="status done">Completed</span>';
  if(draftExists(tool))return '<span class="status progress">In progress</span>';
  return '<span class="chip">Not started</span>';
}
function buttonFor(tool){
  const label=completed(tool)?'Review result':draftExists(tool)?'Continue':'Start tool';
  return `<a class="btn ${completed(tool)?'secondary':'primary'}" href="${TOOL_META[tool].route}" data-route="${TOOL_META[tool].route}" data-source="collection">${label} →</a>`;
}
function home(){
  const done=TOOL_ORDER.filter(completed).length;
  const cards=TOOL_ORDER.map((tool,i)=>{
    const m=TOOL_META[tool];
    return `<article class="tool-card ${tool==='weekly'?'featured':''}"><div><span class="tool-number">${m.number}</span><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p><div class="tool-meta"><span class="chip">${m.time}</span>${statusHtml(tool)}</div></div><div class="button-row">${buttonFor(tool)}</div></article>`;
  }).join('');
  const content=`<section class="hero shell"><div><span class="eyebrow">WSS Growth Tools</span><h1>Diagnose what is limiting growth, then choose the next move.</h1><p class="lead">Five focused tools for post-PMF B2B SaaS and AI companies. Use one for a specific decision, or move through the collection as a connected growth diagnosis.</p><div class="button-row"><a class="btn primary" href="/bottleneck" data-route="/bottleneck" data-source="hero">Start with the growth diagnosis →</a><a class="btn secondary" href="#tools">See all five tools</a></div><p class="micro">No account. No email gate. Answers and results are stored only in this browser.</p></div>
  <aside class="hero-card"><span class="section-label">Your collection</span><h3>${done} of 5 tools completed</h3><p>Each result can be used by the Weekly Focus Planner, so you do not have to repeat the diagnosis.</p><div class="flow-list">${TOOL_ORDER.map((t,i)=>`<div class="flow-item"><b>${i+1}</b><div><strong>${esc(TOOL_META[t].short)}</strong><span>${completed(t)?'Result ready':draftExists(t)?'Continue where you stopped':'Not started'}</span></div></div>`).join('')}</div></aside></section>
  <div class="ticker"><div class="ticker-track">Research → Experiment → Test → Scale → Research → Experiment → Test → Scale → Research → Experiment → Test → Scale → Research → Experiment → Test → Scale →</div></div>
  <section id="tools" class="section shell"><div class="section-head"><div><span class="section-label">The initial five</span><h2>One connected path from diagnosis to action.</h2></div><p>Tools 1 to 4 identify the strongest current signal. Tool 5 turns the selected diagnosis into a focused weekly plan.</p></div><div class="tools-grid">${cards}</div></section>`;
  return layout(content);
}

function introPage(tool,copy){
  return layout(`<section class="tool-intro shell"><a href="/" data-route="/" class="micro">← All tools</a><div style="margin-top:24px"><span class="eyebrow">${esc(copy.label)}</span><h1>${esc(copy.title)}</h1><p class="lead">${esc(copy.lead)}</p><div class="button-row"><button class="btn primary" onclick="${copy.startFn}()">${copy.startLabel||'Start the tool'} →</button>${copy.exampleFn?`<button class="btn secondary" onclick="${copy.exampleFn}()">Use a WSS example</button>`:''}</div><p class="micro">${esc(copy.meta)}</p></div><div class="tool-benefits">${copy.benefits.map(b=>`<div class="benefit"><strong>${esc(b[0])}</strong><span>${esc(b[1])}</span></div>`).join('')}</div></section>`,copy.title,copy.lead);
}
function progress(step,total,title){return `<div class="progress-meta"><strong>${esc(title)}</strong><span>Step ${step+1} of ${total}</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round((step+1)/total*100)}%"></div></div>`;}
function optionButton(label,desc,index,selected,fn){return `<button type="button" class="option ${selected?'selected':''}" onclick="${fn}(${index})"><span class="option-mark">${String.fromCharCode(65+index)}</span><span><strong>${esc(label)}</strong><span class="desc">${esc(desc)}</span></span></button>`;}
function evidenceItems(items){return `<div class="evidence-list">${items.map((x,i)=>`<div class="evidence-item"><b>${i+1}</b><p>${esc(x)}</p></div>`).join('')}</div>`;}
function actionItems(items){return `<div class="action-list">${items.map((x,i)=>`<div class="action-item"><b>${i+1}</b><p>${esc(x)}</p></div>`).join('')}</div>`;}
function resultActions(copy,tool){return `<div class="result-actions"><button class="btn primary" onclick="copyText(${JSON.stringify(copy)})">Copy result</button><button class="btn secondary" onclick="window.print();track('PDF Selected',{tool:'${tool}'})">Print or save as PDF</button><button class="btn secondary" onclick="restartTool('${tool}')">Retake</button></div>`;}
function nextCard(title,text,route,label,sourceTool){return `<div class="next-card"><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div><a class="btn" href="${route}" data-route="${route}" data-source="${sourceTool}" onclick="track('Next Tool Selected',{tool:'${sourceTool}',destination:'${route}'})">${esc(label)} →</a></div>`;}
function restartTool(tool){delete state.drafts[tool];delete state.results[tool];saveState();session={};render();window.scrollTo(0,0);track('Tool Restarted',{tool});}
