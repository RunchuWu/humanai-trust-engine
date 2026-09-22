import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.RESEARCH_BASE_URL ?? "http://127.0.0.1:3101";
const chrome = process.env.CHROME_DEBUG_URL ?? "http://127.0.0.1:9223";
const key = process.env.RESEARCH_ADMIN_KEY;
if (!key) throw new Error("Set RESEARCH_ADMIN_KEY.");
const output = process.env.RESEARCH_SCREENSHOT_DIR ?? "/tmp/research-two-part-screenshots";
await fs.mkdir(output, { recursive: true });
const target = await (await fetch(`${chrome}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let counter = 0; const pending = new Map(), errors = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) { const item = pending.get(message.id); pending.delete(message.id); if (item) { if (message.error) item.reject(new Error(JSON.stringify(message.error))); else item.resolve(message.result); } }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text + " " + JSON.stringify(message.params.exceptionDetails.exception));
};
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const id = ++counter; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
async function wait(expression, label = expression) { const until = Date.now() + 20000; while (Date.now() < until) { if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 80)); } throw new Error(`Timed out: ${label}`); }
async function navigate(path) { await cdp("Page.navigate", { url: base + path }); await wait("document.readyState === 'complete'"); }
async function clickText(text) { await wait(`Array.from(document.querySelectorAll('button')).some(b => b.textContent === ${JSON.stringify(text)} && !b.disabled)`); await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === ${JSON.stringify(text)} && !b.disabled).click()`); }
async function fill(selector, value) { await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); })()`); }
async function screenshot(name) { const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await fs.writeFile(`${output}/${name}.png`, Buffer.from(data, "base64")); }
async function adminExport() { return (await fetch(`${base}/api/research/export`, { headers: { Authorization: `Bearer ${key}` } })).json(); }
try {
  await cdp("Runtime.enable"); await cdp("Page.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1480, height: 1050, deviceScaleFactor: 1, mobile: false });
  const before = (await adminExport()).events.length;
  await navigate("/task?debug=1"); await wait("document.querySelectorAll('input[type=range]').length === 6");
  const nameRange = 'input[aria-label="Agent name"]';
  await evaluate(`document.querySelector(${JSON.stringify(nameRange)}).focus()`);
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35 });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35 });
  await wait("document.querySelector('[data-testid=agent-name]')?.textContent === 'Sarah'");
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await wait("document.querySelector('[data-testid=agent-name]').textContent === 'Sam'");
  assert.equal(await evaluate("document.querySelector('input[aria-label=Confidence]').matches(':disabled')"),true);
  const facts = await evaluate("document.querySelector('[data-testid=core-reason]').textContent");
  for (const [dimension, selector] of [["Tone", "tone-message"], ["Personality", "personality-message"], ["Framing", "framing-message"]]) {
    const texts = new Set();
    for (const level of [0, 25, 50, 75, 100]) {
      await evaluate(`document.querySelector('button[aria-label^="${dimension} ${level}:"]').click()`);
      await wait(`document.querySelector('input[aria-label="${dimension}"]').value === '${level}'`);
      texts.add(await evaluate(`document.querySelector('[data-testid=${selector}]').textContent`));
      assert.equal(await evaluate("document.querySelector('[data-testid=core-reason]').textContent"), facts);
    }
    assert.equal(texts.size, 5, dimension);
  }
  await clickText("Neutral");
  // Exercise dragging using pointer input instead of programmatic value changes.
  const box = await evaluate(`(() => {const r=document.querySelector('input[aria-label="Tone"]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x + box.w / 2, y: box.y + box.h / 2, button: "left", clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x + box.w - 2, y: box.y + box.h / 2, button: "left", buttons: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x + box.w - 2, y: box.y + box.h / 2, button: "left", clickCount: 1 });
  await wait("document.querySelector('input[aria-label=Tone]').value === '100'");
  assert.equal(await evaluate("document.querySelector('[data-testid=stimulus]').dataset.appearance"), "neutral");
  async function choose(selector,value) { await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('change',{bubbles:true}));})()`); }
  async function previewStage(value) {await evaluate(`(()=>{const el=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.startsWith('Stage')).querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
  async function openAnswer(phase,text="I would discuss the competing considerations and propose a conditional arrangement.") {
    await wait(`document.querySelector('textarea[aria-label="Your ${phase} view and reasons"]')!==null`);
    await fill(`textarea[aria-label="Your ${phase} view and reasons"]`,text);
    await choose(`select[aria-label="Your ${phase} stance"]`,phase==='initial'?'disagree':'somewhat_agree');
    await evaluate(`document.querySelector('input[name="open-${phase}-confidence"][value="4"]').click()`);
  }
  async function numericAnswer(phase,value) {
    await wait(`document.querySelector('input[aria-label="Your ${phase} estimate"]')!==null`);
    await fill(`input[aria-label="Your ${phase} estimate"]`,String(value));
    await evaluate(`document.querySelector('input[name="${phase}-confidence"][value="4"]').click()`);
  }
  async function failNext(kind) {
    await evaluate(`window.__originalFetch=window.fetch;window.fetch=async (...args)=>{if(args[1]?.body && JSON.parse(args[1].body).kind===${JSON.stringify(kind)}){window.fetch=window.__originalFetch;return new Response(JSON.stringify({message:'Simulated save failure. Please retry.'}),{status:503,headers:{'Content-Type':'application/json'}})}return window.__originalFetch(...args)}`);
  }
  await previewStage('situation');await openAnswer('initial');
  assert.equal(await evaluate("document.querySelector('[data-testid=agent-name]')===null"),true);
  await clickText('Save initial view');await wait("document.querySelector('[data-testid=initial-open-summary]')!==null");
  await openAnswer('final');await clickText('Save final view');await wait("document.body.textContent.includes('A brief reflection')");
  await clickText('Skip reflection');await previewStage('recommendation');
  const perspectiveA=await evaluate("document.querySelector('[data-testid=core-reason]').textContent");
  await evaluate("(()=>{const el=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.startsWith('AI perspective')).querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,'B');el.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await wait(`document.querySelector('[data-testid=core-reason]').textContent!==${JSON.stringify(perspectiveA)}`);
  await screenshot('researcher-desktop');await clickText('Compare presets');await wait("document.querySelectorAll('[data-testid=stimulus]').length===3");await wait("Array.from(document.querySelectorAll('[data-testid=stimulus] img')).length===3 && Array.from(document.querySelectorAll('[data-testid=stimulus] img')).every(i=>i.complete&&i.naturalWidth>0)");
  const designs=await evaluate("Array.from(document.querySelectorAll('[data-testid=stimulus]')).map(el=>({appearance:el.dataset.appearance,version:el.dataset.interfaceVersion,radius:getComputedStyle(el).borderRadius,font:getComputedStyle(el.querySelector('h2')).fontFamily,bubble:getComputedStyle(el.querySelector('[data-testid=core-reason]').parentElement).backgroundColor,reason:el.querySelector('[data-testid=core-reason]').textContent}))");
  assert.ok(designs.every(d=>d.version==='cards-v3'));assert.equal(new Set(designs.map(d=>d.radius)).size,3);assert.notEqual(designs[0].font,designs[2].font);assert.notEqual(designs[1].bubble,designs[2].bubble);assert.equal(new Set(designs.map(d=>d.reason)).size,1);
  await screenshot('preset-comparison');
  assert.equal((await adminExport()).events.length,before,'Preview must not write events');
  await clickText('Configure & preview');await fill('input[type=password]',key);
  await evaluate("Array.from(document.querySelectorAll('label')).find(l=>l.textContent.includes('Enable the user-set entry')).querySelector('input').click()");
  await clickText('Freeze new version');await wait("Array.from(document.querySelectorAll('a')).some(a=>a.textContent.includes('Open randomized fixed-group link'))");
  const href=await evaluate("Array.from(document.querySelectorAll('a')).find(a=>a.textContent.includes('Open randomized fixed-group link')).getAttribute('href')");
  const studyId=new URL(href,base).searchParams.get('study');
  await navigate(href);await wait("document.querySelector('input[value=own]')!==null");
  assert.ok(await evaluate("document.body.textContent.includes('12 main tasks and 2 practices')"));
  await evaluate("document.querySelector('input[type=checkbox]').click();document.querySelector('input[value=own]').click()");
  await clickText('Start Part 1 practice');await wait("document.body.textContent.includes('Try an open judgment.')");
  await openAnswer('initial');await clickText('Save initial view');await openAnswer('final');await clickText('Save final view');
  for(let i=1;i<=4;i++) {
    await wait(`document.body.textContent.includes('PART 1 · JUDGMENT ${i} OF 4')`);
    assert.equal(await evaluate("document.querySelector('[data-testid=agent-name]')===null"),true);
    await openAnswer('initial');
    if(i===1){await screenshot('open-initial-desktop');await failNext('initial');await clickText('Save initial view');await wait("document.body.textContent.includes('Simulated save failure')");await clickText('Retry');}
    else await clickText('Save initial view');
    await wait("document.querySelector('[data-testid=initial-open-summary]')!==null");
    if(i===1){await cdp('Page.reload');await wait("document.querySelector('[data-testid=initial-open-summary]')?.textContent.includes('conditional arrangement')");await screenshot('open-advice-desktop');}
    await openAnswer('final','I would keep my underlying view, while recognising the suggested conditions and another approach.');
    if(i===1){await failNext('decision');await clickText('Save final view');await wait("document.body.textContent.includes('Simulated save failure')");await clickText('Retry');}
    else await clickText('Save final view');
    await wait("document.body.textContent.includes('A brief reflection')");
    if(i===1){await cdp('Page.reload');await wait("document.body.textContent.includes('A brief reflection')");await fill('textarea[aria-label="Reflection (optional)"]','I considered the extra conditions but retained my own priorities.');await failNext('reflection');await clickText('Save reflection and continue');await wait("document.body.textContent.includes('Simulated save failure')");await clickText('Retry');}
    else await clickText('Skip reflection');
  }
  await wait("document.body.textContent.includes('Now, make numeric predictions.')");await screenshot('part-two-transition');
  await numericAnswer('initial',20);await clickText('Save initial estimate');await numericAnswer('final',45);await clickText('Save final estimate');
  for(let i=1;i<=8;i++) {
    await wait(`document.body.textContent.includes('PART 2 · PREDICTION ${i} OF 8')`);
    const decimal=await evaluate("document.querySelector('input[type=number]').step==='0.5'");
    await numericAnswer('initial',decimal?35.5:35);await clickText('Save initial estimate');await wait("document.querySelector('[data-testid=initial-summary]')!==null");
    await numericAnswer('final',decimal?40.5:40);
    if(i===1){await screenshot('numeric-advice-desktop');await failNext('decision');await clickText('Save final estimate');await wait("document.body.textContent.includes('Simulated save failure')");await clickText('Retry');}else await clickText('Save final estimate');
  }
  await wait("document.body.textContent.includes('How did the interaction feel?')");
  assert.equal(await evaluate("document.querySelectorAll('fieldset').length"),8);
  await evaluate("document.querySelectorAll('input[type=radio][value=\"4\"]').forEach(el=>el.click())");
  await clickText('Finish study');await wait("document.body.textContent.includes('Your responses to both parts and your experience ratings have been saved.')");
  const exported=await(await fetch(`${base}/api/research/export?studyId=${studyId}`,{headers:{Authorization:`Bearer ${key}`}})).json();
  const decisions=exported.events.filter(e=>e.event_type==='decision');assert.equal(decisions.length,12);
  assert.equal(decisions.filter(e=>e.trial_type==='open_judgment').length,4);assert.equal(decisions.filter(e=>e.trial_type==='prediction').length,8);
  assert.equal(new Set(decisions.filter(e=>e.trial_type==='prediction').map(e=>e.response_unit)).size,4);
  assert.equal(exported.events.filter(e=>e.event_type==='reflection').length,4);assert.equal(exported.events.filter(e=>e.resolved_stimulus).length,12);
  assert.equal(decisions.filter(e=>e.viewpoint_id==='A').length,2);
  const config=exported.studies[0].config;
  const copy=await(await fetch(`${base}/api/research/studies`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({config,status:'frozen',parentId:studyId})})).json();
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await cdp('Emulation.setTouchEmulationEnabled',{enabled:true});
  await navigate(`/task?study=${copy.study.id}&mode=user_set`);await wait("document.querySelector('input[value=own]')!==null");
  await evaluate("document.querySelector('input[type=checkbox]').click();document.querySelector('input[value=own]').click()");await clickText('Start Part 1 practice');await wait("document.querySelectorAll('input[type=range]').length===6");
  assert.ok(await evaluate("document.querySelector('input[aria-label=Confidence]').matches(':disabled')"));
  await evaluate("document.querySelector('input[aria-label=\"Agent name\"]').scrollIntoView({block:'center'})");
  const touchBox=await evaluate("(()=>{const r=document.querySelector('input[aria-label=\"Agent name\"]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()");
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchBox.x+touchBox.w/2,y:touchBox.y+touchBox.h/2}]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchBox.x+touchBox.w-2,y:touchBox.y+touchBox.h/2}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await wait("document.querySelector('input[aria-label=\"Agent name\"]').value==='100'");await clickText('Confirm settings');
  await openAnswer('initial');await clickText('Save initial view');await openAnswer('final');await clickText('Save final view');await wait("document.body.textContent.includes('PART 1 · JUDGMENT 1 OF 4')");
  await evaluate('window.scrollTo(0,0)');await screenshot('open-initial-mobile');assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
  await openAnswer('initial');await clickText('Save initial view');await wait("document.querySelector('[data-testid=agent-name]')?.textContent==='Sarah'");await evaluate('window.scrollTo(0,0)');await screenshot('open-advice-mobile');assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
  await navigate('/task?debug=1');await wait("document.querySelectorAll('input[type=range]').length===6");await screenshot('researcher-mobile');assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
  await fill('input[type=password]',key);await clickText('Data & exports');await clickText('Refresh data');await wait("document.body.textContent.includes('Part 1 · Open judgments')");
  assert.ok(await evaluate("document.body.textContent.includes('Mean error reduction (% of range)')"));
  assert.ok(!await evaluate("document.body.textContent.includes('Mean error reduction (min)')"));
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log(`Two-part browser passed: preview A/B and both forms, sliders, full 4+8 flow, both practices, reflection, refresh, save retries, eight ratings, mobile/custom setup and separate data summaries. Screenshots: ${output}`);
} finally { ws.close(); await fetch(`${chrome}/json/close/${target.id}`); }
