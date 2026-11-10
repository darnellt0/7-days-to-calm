'use strict';
// Executes full supplied TSX component bodies after offline TS transpilation.
// React hooks, JSX, browser APIs and ElevenLabs SDK are MOCKS; no DOM/audio/app test.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.env.SOURCE_DIR || path.resolve(__dirname, '../../components');
const defer = () => { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b;}); return {promise,resolve,reject}; };
const flush = async () => { for(let i=0;i<12;i++) await Promise.resolve(); };
function harness(file, options={}) {
  const states=[], refs=[], effects=[], callbacks=[];
  let si=0,ri=0,ei=0,ci=0, tree, queued=[];
  const storage = new Map(Object.entries(options.storage || {}));
  let blocked=!!options.blocked, sdkOptions, calls=0, fetches=[], tracksStopped=0;
  const pending=options.pending || defer();
  const events=[], activeChanges=[];
  const props={day:3,title:'Body Scan',onActiveChange:x=>activeChanges.push(x),onPracticeEnd:()=>events.push(['practice']),onEvent:(...x)=>events.push(x)};
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
  const react={
    useState(initial){const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],x=>{states[i]=typeof x==='function'?x(states[i]):x;}];},
    useRef(initial){const i=ri++;return refs[i] ||= {current:initial};},
    useCallback(fn,deps){const i=ci++;if(!callbacks[i]||!same(callbacks[i].deps,deps))callbacks[i]={fn,deps};return callbacks[i].fn;},
    useEffect(fn,deps){const i=ei++;if(!effects[i]||!same(effects[i].deps,deps)){queued.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}},
  };
  const jsx=(type,props,key)=>({type,props:props||{},key});
  let timerId=0;const timers=new Map();
  const localStorage={getItem(k){if(blocked)throw new DOMException('blocked','SecurityError');return storage.get(k)??null;},setItem(k,v){if(blocked)throw new DOMException('blocked','SecurityError');storage.set(k,String(v));}};
  const sdk={Conversation:{startSession(o){sdkOptions=o;calls++;return options.startSession ? options.startSession(o) : pending.promise;}}};
  const imports={react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'@elevenlabs/client':sdk,'next/image':{default:'Image'},'./ShriaGuide':{default:'ShriaGuide'},'./ConfirmationDialog':{default:'ConfirmationDialog'},'./MotionControl':{default:'MotionControl',useAmbientMotion:()=>({enabled:true,ready:true,reduced:false,toggle(){}})},'./HeroVideo':{default:'HeroVideo'},'./PracticeSymbol':{default:'PracticeSymbol'}};
  const module={exports:{}};
  const context={module,exports:module.exports,require(n){if(!(n in imports))throw Error('Unmocked import '+n);return imports[n];},console:{log(){},error(){}},process:{env:{}},window:{isSecureContext:true,open:()=>null},navigator:{mediaDevices:{getUserMedia:options.media || (async()=>({getTracks:()=>[{stop(){tracksStopped++;}}]}))}},location:{hostname:'localhost'},localStorage,AbortController,DOMException,URL,Date,Promise,WeakMap,WeakSet,Set,Map,Error,setTimeout(fn,ms){timers.set(++timerId,{fn,ms});return timerId;},clearTimeout(id){timers.delete(id);},setInterval(){return 0;},clearInterval(){},fetch:async(url,opts)=>{fetches.push({url,opts});return options.fetch ? options.fetch(url,opts) : {ok:true,json:async()=>({signed_url:'wss://api.elevenlabs.io/test',challenge_day:3})};}};
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
  assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,'TS transpilation diagnostics');
  vm.runInNewContext(compiled.outputText,context,{filename:file});
  const component=module.exports.default;
  function render(){si=ri=ei=ci=0;queued=[];tree=component(props);for(const fn of queued)fn();return tree;}
  function nodes(node){if(node==null||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
  function text(n){if(n==null||typeof n==='boolean')return '';if(typeof n!=='object')return String(n);return Array.isArray(n)?n.map(text).join(''):text(n.props?.children);}
  function button(label){render();const b=nodes(tree).find(n=>n.type==='button'&&(n.props['aria-label']===label||text(n)===label));assert.ok(b,'Button '+label+' exists');return b;}
  render();render();
  return {render,nodes:(node=tree)=>nodes(node),text,button,props,storage,events,activeChanges,pending,context,timers,get sdkOptions(){return sdkOptions;},get calls(){return calls;},get fetches(){return fetches;},get tracksStopped(){return tracksStopped;},block(){blocked=true;},unmount(){for(const e of effects)e?.cleanup?.();}};
}
const activeSession=()=>({ends:0,muted:[],updates:[],endSession(){this.ends++;return Promise.resolve();},setMicMuted(v){this.muted.push(v);},sendContextualUpdate(v){this.updates.push(v);}});
test('days 1-7: completion, rehydration, final persistence, reset',()=>{
 let saved={};
 for(let day=1;day<=7;day++){
  const h=harness('SevenDaysToCalm.tsx',{storage:saved});
  const guide=h.nodes(h.render()).find(n=>n.type==='ShriaGuide');
  assert.equal(guide.props.day,day);
  assert.equal(guide.props.title,['Arrive','Longer Exhale','Body Scan','Label Thoughts','Box Breathing','Open Awareness','Integration'][day-1]);
  h.button(`Complete Day ${day}`).props.onClick();h.render();saved=Object.fromEntries(h.storage);
 }
 const h=harness('SevenDaysToCalm.tsx',{storage:saved});
 assert.equal(h.button('Complete Day 7').props.disabled,true);
 assert.equal(h.storage.get('em_challenge_complete'),'true');
 assert.equal(h.nodes().find(n=>n.props.role==='progressbar').props['aria-valuenow'],7);
 h.button('Reset to Day 1').props.onClick();h.render();
 h.nodes().find(n=>n.type==='ConfirmationDialog').props.onConfirm();h.render();
 assert.equal(h.storage.get('em_challenge_day'),'1');assert.equal(h.storage.get('em_challenge_complete'),'false');assert.equal(h.button('Complete Day 1').props.disabled,false);
});
test('blocked storage still permits all days and reset within mounted state',()=>{
 const h=harness('SevenDaysToCalm.tsx',{blocked:true});
 for(let day=1;day<=7;day++){h.button(`Complete Day ${day}`).props.onClick();h.render();}
 assert.equal(h.button('Complete Day 7').props.disabled,true);
 assert.ok(h.nodes().some(n=>h.text(n).includes('Your browser isn’t saving progress.')));
 h.button('Reset to Day 1').props.onClick();h.render();h.nodes().find(n=>n.type==='ConfirmationDialog').props.onConfirm();h.render();assert.equal(h.button('Complete Day 1').props.disabled,false);
});
test('active call locks complete, reset and skip without changing progress',()=>{
 const h=harness('SevenDaysToCalm.tsx');h.nodes().find(n=>n.type==='ShriaGuide').props.onActiveChange(true);h.render();
 for(const name of ['Complete Day 1','Reset to Day 1','Skip to Today'])assert.equal(h.button(name).props.disabled,true);
 h.button('Complete Day 1').props.onClick();h.render();assert.equal(h.storage.has('em_challenge_day'),false);
});
test('double start creates one SDK call; context/mute/end keep current day',async()=>{
 const h=harness('ShriaGuide.tsx');const start=h.button('Begin practice').props.onClick;const task=start();await start();await flush();assert.equal(h.calls,1);
 assert.equal(h.sdkOptions.dynamicVariables.challenge_day,3);assert.equal(h.sdkOptions.dynamicVariables.challenge_title,'Body Scan');assert.equal(JSON.parse(h.sdkOptions.clientTools.getChallengeDay()).day,3);assert.equal(JSON.parse(h.sdkOptions.clientTools.setChallengeDay()).changed,false);
 const active=activeSession();h.pending.resolve(active);await task;h.render();assert.match(active.updates[0],/Day 3: Body Scan/);
 h.button('Mute').props.onClick();h.render();assert.deepEqual(active.muted,[true]);h.button('Unmute').props.onClick();assert.deepEqual(active.muted,[true,false]);
 await h.button('End').props.onClick();h.render();assert.equal(active.ends,1);assert.equal(h.events.filter(e=>e[0]==='practice').length,1);h.button('Begin practice');
});
test('cancel during microphone permission releases late stream without signing',async()=>{
 const media=defer();let stopped=0;const h=harness('ShriaGuide.tsx',{media:()=>media.promise});const task=h.button('Begin practice').props.onClick();await h.button('Cancel').props.onClick();media.resolve({getTracks:()=>[{stop(){stopped++;}}]});await task;assert.equal(stopped,1);assert.equal(h.fetches.length,0);h.button('Begin practice');
});
// Return wrapped task to avoid promise assimilation of unresolved start.
async function beginPending(h){const task=h.button('Begin practice').props.onClick();await flush();assert.ok(h.sdkOptions);return {task};}
test('late handle teardown is idempotent',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);await h.button('Cancel').props.onClick();const active=activeSession();h.pending.resolve(active);await task;await flush();assert.equal(active.ends,1);
});
test('disconnect before SDK promise resolves cannot resurrect a dead call',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);h.sdkOptions.onDisconnect();h.render();const active=activeSession();h.pending.resolve(active);await task;await flush();h.button('Begin practice');assert.equal(active.ends,1);assert.equal(active.updates.length,0);
});
test('blocked reminder storage returns actionable tool result, not an exception',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);h.pending.resolve(activeSession());await task;h.block();const result=await h.sdkOptions.clientTools.setReminder({time:'09:00',label:'Practice'});assert.match(result,/cannot|could not|not sav|unavailable/i);assert.equal(h.events.some(e=>e[0]==='em_reminder_set'),false);
});
test('malformed and non-HTTPS links return safe tool results',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);h.pending.resolve(activeSession());await task;
 assert.equal(typeof await h.sdkOptions.clientTools.openLink({url:'not a URL'}),'string');assert.match(await h.sdkOptions.clientTools.openLink({url:'http://example.com'}),/HTTPS/);
});
test('stale tools cannot write reminders or emit analytics after cancellation',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);const tools=h.sdkOptions.clientTools;await h.button('Cancel').props.onClick();const count=h.events.length;await tools.setReminder({time:'09:00'});await tools.trackEvent({name:'stale'});assert.equal(h.storage.has('em_reminder'),false);assert.equal(h.events.length,count);h.pending.resolve(activeSession());await task;
});
test('inconsistent legacy complete flag cannot lock an earlier day',()=>{
 const h=harness('SevenDaysToCalm.tsx',{storage:{em_challenge_day:'1',em_challenge_complete:'true'}});
 assert.equal(h.button('Complete Day 1').props.disabled,false);
 assert.equal(h.nodes().find(n=>n.props.role==='progressbar').props['aria-valuenow'],0);
});
test('invalid saved days are clamped and titles always resolve',()=>{
 for(const value of ['nope','NaN','0','-4','8','3.7']){
  const h=harness('SevenDaysToCalm.tsx',{storage:{em_challenge_day:value}});
  const guide=h.nodes().find(n=>n.type==='ShriaGuide');assert.ok(guide.props.day>=1&&guide.props.day<=7);assert.equal(typeof guide.props.title,'string');
 }
});
test('all seven voice contexts and signing query days match their panel',async()=>{
 const titles=['Arrive','Longer Exhale','Body Scan','Label Thoughts','Box Breathing','Open Awareness','Integration'];
 for(let day=1;day<=7;day++){
  const h=harness('ShriaGuide.tsx');h.props.day=day;h.props.title=titles[day-1];const {task}=await beginPending(h);
  assert.match(h.fetches[0].url,new RegExp('challenge_day='+day+'$'));assert.equal(h.fetches[0].opts.credentials,'omit');assert.equal(h.fetches[0].opts.cache,'no-store');
  assert.equal(h.sdkOptions.dynamicVariables.challenge_day,day);assert.equal(h.sdkOptions.dynamicVariables.challenge_title,titles[day-1]);assert.match(h.sdkOptions.dynamicVariables.session_greeting,new RegExp('Day '+day));
  const active=activeSession();h.pending.resolve(active);await task;await h.button('End').props.onClick();
 }
});
test('microphone denial is actionable and never signs',async()=>{
 const h=harness('ShriaGuide.tsx',{media:async()=>{throw new DOMException('denied','NotAllowedError');}});await h.button('Begin practice').props.onClick();h.render();assert.equal(h.fetches.length,0);assert.ok(h.nodes().some(n=>n.props.role==='alert'&&h.text(n).includes('Microphone access was denied')));h.button('Try again');
});
test('signing 503 retry performs a fresh fetch and can connect',async()=>{
 let count=0;const h=harness('ShriaGuide.tsx',{fetch:async()=>++count===1?{ok:false,status:503,headers:{get:()=>null}}:{ok:true,json:async()=>({signed_url:'wss://api.elevenlabs.io/test',challenge_day:3})}});
 await h.button('Begin practice').props.onClick();h.render();assert.ok(h.nodes().some(n=>n.props.role==='alert'&&h.text(n).includes('503')));const task=h.button('Try again').props.onClick();await flush();assert.equal(count,2);h.pending.resolve(activeSession());await task;h.button('End');
});
test('SDK timeout invalidates late connection and allows retry',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);const timeout=[...h.timers.values()].find(t=>t.ms===25000);assert.ok(timeout);timeout.fn();await task;h.render();h.button('Try again');const active=activeSession();h.pending.resolve(active);await flush();assert.equal(active.ends,1);assert.equal(active.updates.length,0);
});
test('unmount during SDK startup closes late session without callbacks',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);const count=h.events.length;h.unmount();const active=activeSession();h.pending.resolve(active);await task;await flush();assert.equal(active.ends,1);assert.equal(h.events.length,count);
});
test('normal remote disconnect ends one practice and ignores later callbacks',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);h.pending.resolve(activeSession());await task;const old=h.sdkOptions;old.onDisconnect();old.onDisconnect();h.render();h.button('Begin practice');assert.equal(h.events.filter(e=>e[0]==='practice').length,1);assert.equal(h.events.filter(e=>e[0]==='em_convai_ended').length,1);
});
test('early disconnect then restart cannot let old finally clear the new busy state',async()=>{
 const first=defer(),second=defer();let count=0;
 const h=harness('ShriaGuide.tsx',{startSession:()=>++count===1?first.promise:second.promise});
 const a=h.button('Begin practice').props.onClick();await flush();const old=h.sdkOptions;old.onDisconnect();h.render();
 const b=h.button('Begin practice').props.onClick();await flush();first.resolve(activeSession());await a;h.render();h.button('Cancel');assert.equal(h.nodes().some(n=>n.type==='button'&&h.text(n)==='Begin practice'),false);
 second.resolve(activeSession());await b;h.button('End');
});
test('double End waits for one teardown and cannot unlock a concurrent start',async()=>{
 const closed=defer();const h=harness('ShriaGuide.tsx');const start=h.button('Begin practice').props.onClick;const {task}=await beginPending(h);const active=activeSession();active.endSession=function(){this.ends++;return closed.promise;};h.pending.resolve(active);await task;
 const end=h.button('End').props.onClick;const a=end();const b=end();await flush();await start();await flush();assert.equal(h.calls,1);assert.equal(active.ends,1);
 assert.equal(h.events.filter(e=>e[0]==='practice').length,0);
 closed.resolve();await a;await b;h.render();h.button('Begin practice');assert.equal(h.events.filter(e=>e[0]==='practice').length,1);assert.equal(h.events.filter(e=>e[0]==='em_convai_ended').length,1);
});
test('late rejected teardown is handled once without unhandled rejection',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);await h.button('Cancel').props.onClick();const active=activeSession();active.endSession=function(){this.ends++;return Promise.reject(new Error('teardown failed'));};h.pending.resolve(active);await task;await flush();assert.equal(active.ends,1);h.button('Begin practice');
});
test('failed End returns actionable retry and retains exact one teardown',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);const active=activeSession();active.endSession=function(){this.ends++;throw new Error('teardown failed');};h.pending.resolve(active);await task;await h.button('End').props.onClick();h.render();h.button('Try again');assert.equal(active.ends,1);assert.ok(h.nodes().some(n=>n.props.role==='alert'&&h.text(n).includes('connection closed unexpectedly')));
});
test('transcript stays bounded and retired status/message callbacks are inert',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);h.pending.resolve(activeSession());await task;const options=h.sdkOptions;
 for(let i=0;i<70;i++)options.onMessage({source:'ai',message:'Message '+i});h.render();const log=h.nodes().find(n=>n.props.role==='log');assert.equal(log.props.children.length,50);assert.equal(h.text(log).includes('Message 0'),false);
 options.onModeChange({mode:'speaking'});h.render();assert.ok(h.nodes().some(n=>n.props['data-state']==='speaking'));await h.button('End').props.onClick();options.onMessage({source:'ai',message:'STALE-MESSAGE'});options.onModeChange({mode:'speaking'});h.render();assert.equal(h.nodes().some(n=>h.text(n).includes('STALE-MESSAGE')),false);assert.ok(h.nodes().some(n=>n.props['data-state']==='idle'));
});
test('blocked popup produces a tool result rather than throwing',async()=>{
 const h=harness('ShriaGuide.tsx');const {task}=await beginPending(h);h.pending.resolve(activeSession());await task;h.context.window.open=()=>{throw new DOMException('blocked','SecurityError');};const result=await h.sdkOptions.clientTools.openLink({url:'https://example.com'});assert.match(result,/could not|unable|blocked/i);
});
test('skip to today persists the selected day and reset persists its baseline',()=>{
 const h=harness('SevenDaysToCalm.tsx',{storage:{em_challenge_start:new Date(Date.now()-2*86400000).toISOString()}});h.button('Skip to Today').props.onClick();h.render();h.nodes().find(n=>n.type==='ConfirmationDialog').props.onConfirm();h.render();assert.equal(h.storage.get('em_challenge_day'),'3');
 const restored=harness('SevenDaysToCalm.tsx',{storage:Object.fromEntries(h.storage)});assert.equal(restored.nodes().find(n=>n.type==='ShriaGuide').props.day,3);
 restored.button('Reset to Day 1').props.onClick();restored.render();restored.nodes().find(n=>n.type==='ConfirmationDialog').props.onConfirm();restored.render();assert.equal(restored.storage.get('em_challenge_day'),'1');assert.equal(restored.storage.get('em_challenge_complete'),'false');assert.ok(Date.now()-Date.parse(restored.storage.get('em_challenge_start'))<1000);
});
