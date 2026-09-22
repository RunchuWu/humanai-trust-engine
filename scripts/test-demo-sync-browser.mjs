import assert from 'node:assert/strict';
const base=process.env.RESEARCH_BASE_URL??'http://127.0.0.1:3101';
const chrome=process.env.CHROME_DEBUG_URL??'http://127.0.0.1:9223';
const admin=process.env.RESEARCH_ADMIN_KEY;
if(!admin)throw Error('Set RESEARCH_ADMIN_KEY and use an isolated research data directory.');
const pages=[];
async function page(){
 const target=await(await fetch(`${chrome}/json/new?about:blank`,{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let id=0;const pending=new Map(),errors=[];
 ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const waiter=pending.get(message.id);pending.delete(message.id);if(message.error)waiter.reject(Error(JSON.stringify(message.error)));else waiter.resolve(message.result);}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const number=++id;pending.set(number,{resolve,reject});ws.send(JSON.stringify({id:number,method,params}));});
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=async expression=>{const end=Date.now()+20000;while(Date.now()<end){if(await evaluate(`Boolean(${expression})`))return;await new Promise(r=>setTimeout(r,60));}throw Error(`Timed out: ${expression}`);};
 const click=async text=>{const expr=`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(text)}&&!b.disabled)`;await wait(expr);await evaluate(`${expr}.click()`);};
 const fill=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
 const navigate=async path=>{await cdp('Page.navigate',{url:base+path});await wait("document.readyState==='complete'");};
 const p={target,ws,cdp,evaluate,wait,click,fill,navigate,errors};pages.push(p);await cdp('Runtime.enable');await cdp('Page.enable');return p;
}
const exported=async()=>await(await fetch(`${base}/api/research/export`,{headers:{Authorization:`Bearer ${admin}`}})).json();
async function start(p){await p.wait("document.querySelector('input[name=comprehension]')");await p.evaluate("document.querySelector('input[type=checkbox]').click();document.querySelector('input[name=comprehension][value=own]').click()");await p.click('Start Part 1 practice');}
async function initial(p){await p.wait("document.querySelector('textarea[aria-label=\"Your initial view and reasons\"]')");await p.fill('textarea[aria-label="Your initial view and reasons"]','I would discuss the needs of everyone sharing the kitchen before deciding.');await p.fill('select[aria-label="Your initial stance"]','disagree');await p.evaluate("document.querySelectorAll('input[name=open-initial-confidence]')[3].click()");await p.click('Save initial view');await p.wait("document.querySelector('[data-testid=agent-name]')");}
try{
 const before=(await exported()).events.length;
 const researcher=await page();await researcher.navigate('/task?debug=1');await researcher.click('Warm');
 assert.equal(await researcher.evaluate("Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Participant demo ↗').target"),'_blank');
 const demo=await page();await demo.navigate('/task');await demo.wait("document.querySelector('[data-testid=demo-profile]')?.textContent==='Warm · Sarah'");
 await start(demo);await initial(demo);assert.equal(await demo.evaluate("document.querySelector('[data-testid=agent-name]').textContent"),'Sarah');
 const draft='My unsent final response should stay here while I compare the interfaces.';
 await demo.fill('textarea[aria-label="Your final view and reasons"]',draft);await demo.fill('select[aria-label="Your final stance"]','agree');await demo.evaluate("document.querySelectorAll('input[name=open-final-confidence]')[4].click()");
 await researcher.click('Cold');await demo.wait("document.querySelector('[data-testid=agent-name]')?.textContent==='Assistant'");
 assert.equal(await demo.evaluate("document.querySelector('textarea').value"),draft);assert.equal(await demo.evaluate("document.querySelector('select[aria-label=\"Your final stance\"]').value"),'agree');assert.equal(await demo.evaluate("document.querySelector('input[name=open-final-confidence]:checked').value"),'5');
 await researcher.click('Warm');await demo.wait("document.querySelector('[data-testid=stimulus]')?.dataset.appearance==='friendly'");assert.equal(await demo.evaluate("document.querySelector('textarea').value"),draft);
 // Individual slider updates must follow without applying a bundled preset.
 await researcher.evaluate("document.querySelector('button[aria-label^=\"Agent name 75:\"]').click()");await demo.wait("document.querySelector('[data-testid=agent-name]')?.textContent==='Sam'");assert.equal(await demo.evaluate("document.querySelector('[data-testid=stimulus]').dataset.appearance"),'friendly');
 await demo.click('Preview Neutral');await demo.wait("document.querySelector('[data-testid=agent-name]')?.textContent==='Alex'");await researcher.click('Cold');assert.equal(await demo.evaluate("document.querySelector('[data-testid=agent-name]').textContent"),'Alex');
 await demo.click('Follow researcher');await demo.wait("document.querySelector('[data-testid=agent-name]')?.textContent==='Assistant'");
 await researcher.click('Warm');await demo.wait("document.querySelector('[data-testid=demo-profile]')?.textContent==='Warm · Sarah'");
 await demo.navigate('/task');await demo.wait("document.querySelector('[data-testid=demo-profile]')?.textContent==='Warm · Sarah'");
 await start(demo);await initial(demo);assert.equal(await demo.evaluate("document.querySelector('textarea').value"),'');
 await demo.fill('textarea[aria-label="Your final view and reasons"]',draft);await demo.click('Restart demo');await start(demo);await initial(demo);assert.equal(await demo.evaluate("document.querySelector('textarea').value"),'');
 await researcher.evaluate("localStorage.setItem('humanai.research.demo-profile.v1','{broken')");await demo.wait("document.querySelector('[data-testid=demo-profile]')?.textContent==='Neutral · Alex'");await researcher.click('Warm');await demo.wait("document.querySelector('[data-testid=demo-profile]')?.textContent==='Warm · Sarah'");
 assert.equal((await exported()).events.length,before,'Demos must not write research events');
 // A frozen participant tab must not subscribe to this same-origin preview channel.
 await researcher.fill('input[type=password]',admin);await researcher.click('Freeze new version');await researcher.wait("Array.from(document.querySelectorAll('a')).some(a=>a.textContent.includes('Open randomized fixed-group link'))");
 const link=await researcher.evaluate("Array.from(document.querySelectorAll('a')).find(a=>a.textContent.includes('Open randomized fixed-group link')).getAttribute('href')");
 const participant=await page();await participant.navigate(link);await start(participant);await initial(participant);
 assert.equal(await participant.evaluate("document.querySelector('[aria-label=\"Participant demo controls\"]')===null"),true);
 const actual=await participant.evaluate("document.querySelector('[data-testid=agent-name]').textContent+':'+document.querySelector('[data-testid=stimulus]').dataset.appearance");
 await researcher.click('Cold');await demo.wait("document.querySelector('[data-testid=demo-profile]')?.textContent==='Cold · Assistant'");
 assert.equal(await participant.evaluate("document.querySelector('[data-testid=agent-name]').textContent+':'+document.querySelector('[data-testid=stimulus]').dataset.appearance"),actual);
 for(const p of pages)assert.equal(p.errors.length,0,JSON.stringify(p.errors));
 console.log('Demo synchronization passed: cross-tab Sarah/Cold and sliders, in-progress text/stance/confidence preservation, local override/reconnect, reload, restart, malformed storage, zero preview events and frozen participant isolation.');
}finally{for(const p of pages){p.ws.close();await fetch(`${chrome}/json/close/${p.target.id}`).catch(()=>{});}}
