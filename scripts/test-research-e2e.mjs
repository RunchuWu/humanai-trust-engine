import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { loadTs } from "./research-test-utils.mjs";
const base = process.env.RESEARCH_BASE_URL ?? "http://127.0.0.1:3101";
const key = process.env.RESEARCH_ADMIN_KEY;
if (!key) throw new Error("Set RESEARCH_ADMIN_KEY for the test server and this test.");
const { defaultStudy } = loadTs("src/lib/research/config.ts");
const { predictionMetrics } = loadTs("src/lib/research/prediction.ts");
const bank = JSON.parse(fs.readFileSync(`data/stimuli/${process.env.RESEARCH_TEST_DATASET ?? "everyday-prediction-en-v2"}.json`, "utf8"));
const config = JSON.parse(JSON.stringify(defaultStudy(bank.trials.map(t => t.id), bank.version)));
config.title = "Prediction workflow E2E"; config.userSet.enabled = true;
async function call(route, { body, cookie, admin = false } = {}) {
  const response = await fetch(base + route, { method: body === undefined ? "GET" : "POST", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}), ...(admin ? { Authorization: `Bearer ${key}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => null); return { response, data };
}
const action = (studyId, cookie, body) => call("/api/research/session", { body: { studyId, ...body }, cookie });
const status = (result, code=200) => assert.equal(result.response.status,code,JSON.stringify(result.data));
function privateSafe(value, before=true) {
  for (const sensitive of ["outcome", "outcomeExplanation", "review", "provenance", "tokenHash", ...(before ? ["aiEstimate"] : [])]) assert.ok(!JSON.stringify(value).includes(`"${sensitive}"`), `Public response leaked ${sensitive}`);
}
for (const route of ["/api/research/export","/api/research/materials","/api/research/studies"]) status(await call(route),401);
status(await call("/api/research/studies",{body:{config,status:"frozen"}}),401);
const draft=await call("/api/research/studies",{body:{config,status:"draft"},admin:true});status(draft,201);
status(await call(`/api/research/studies?id=${draft.data.study.id}`),404);
for (const mutate of [s=>s.profiles[0].levels.name=33,s=>s.profiles[1].levels.confidence=75,s=>s.userSet.allowedDimensions.push("confidence"),s=>s.trialOrder.pop()]) {
 const bad=structuredClone(config);mutate(bad);status(await call("/api/research/studies",{body:{config:bad,status:"frozen"},admin:true}),400);
}
const frozen=await call("/api/research/studies",{body:{config,status:"frozen",parentId:draft.data.study.id},admin:true});status(frozen,201);
const studyId=frozen.data.study.id;assert.equal(frozen.data.study.version,2);
const publicData=await call(`/api/research/studies?id=${studyId}`);status(publicData);privateSafe(publicData.data);
assert.ok(publicData.data.dataset.trials.every(t=>t.coreReason===""));
const html=await (await fetch(`${base}/task?study=${studyId}`)).text();
assert.ok(!html.includes(bank.trials[0].coreReason),"AI rationale leaked in initial HTML/RSC");
assert.ok(!html.includes(bank.trials[0].outcomeExplanation));
const changed=structuredClone(config);changed.profiles.forEach(p=>p.levels.name=75);
const newer=await call("/api/research/studies",{body:{config:changed,status:"frozen",parentId:studyId},admin:true});status(newer,201);
assert.equal(newer.data.study.version,3);assert.deepEqual((await call(`/api/research/studies?id=${studyId}`)).data.study.config,config);
const full=structuredClone(config);full.trialSet="full16";full.trialOrder=bank.trials.map(t=>t.id);
const fullStudy=await call("/api/research/studies",{body:{config:full,status:"frozen"},admin:true});status(fullStudy,201);
const cases=[{mode:"fixed",id:studyId,config},{mode:"user_set",id:studyId,config},{mode:"fixed",id:fullStudy.data.study.id,config:full}];
for (const c of cases) {
 const {id,mode}=c;const requestToken=randomBytes(32).toString("hex");
 status(await action(id,null,{kind:"start",mode,consent:false}),400);
 const started=await action(id,null,{kind:"start",mode,consent:true,requestToken});status(started);privateSafe(started.data);
 const cookie=started.response.headers.get("set-cookie")?.split(";")[0];assert.ok(cookie);c.sessionId=started.data.session.id;
 assert.equal((await action(id,null,{kind:"start",mode,consent:true,requestToken})).data.session.id,c.sessionId);
 assert.equal((await action(id,cookie,{kind:"start",mode,consent:true})).data.session.id,c.sessionId);
 status(await action(id,cookie,{kind:"start",mode:mode==="fixed"?"user_set":"fixed",consent:true}),409);
 const levels={...started.data.session.profile.levels};
 status(await action(id,cookie,{kind:"lock",levels:{...levels,confidence:100}}),mode==="fixed"?409:403);
 if(mode==="user_set") {levels.name=75;levels.tone=25;status(await action(id,cookie,{kind:"lock",levels}));status(await action(id,cookie,{kind:"lock",levels}));}
 status(await action(id,cookie,{kind:"practice",judgment:{estimate:20,confidence:3}}),409);
 status(await action(id,cookie,{kind:"practice_initial",judgment:{estimate:20,confidence:0}}),400);
 const practice=await action(id,cookie,{kind:"practice_initial",judgment:{estimate:20,confidence:3}});status(practice);privateSafe(practice.data,false);assert.equal(practice.data.session.practiceAdvice.aiEstimate,bank.practice.aiEstimate);
 status(await action(id,cookie,{kind:"practice_initial",judgment:{estimate:21,confidence:3}}),409);
 // Practice never rewards copying AI: a different, valid value advances.
 status(await action(id,cookie,{kind:"practice",judgment:{estimate:45,confidence:4}}));
 status(await action(id,cookie,{kind:"survey",answers:{}}),409);
 for (let index=0;index<c.config.trialOrder.length;index++) {
  const trialId=c.config.trialOrder[index],t=bank.trials.find(t=>t.id===trialId);
  const initial={estimate:index===0?t.aiEstimate:index===1?0:t.aiEstimate-10,confidence:3,...(t.allowRationale?{rationale:"Recent observations, adjusted for context."}:{})};
  const final={estimate:index===0?t.aiEstimate:index===1?10:index===2?t.aiEstimate-15:index===3?t.aiEstimate+5:t.aiEstimate,confidence:5,...(t.allowRationale?{rationale:"I considered the AI reasoning alongside my initial view."}:{})};
  privateSafe((await call(`/api/research/session?studyId=${id}`,{cookie})).data);
  status(await action(id,cookie,{kind:"advance",trialId,fromStage:"situation"}),409);
  status(await action(id,cookie,{kind:"shown",trialId,stage:"recommendation"}),409);
  status(await action(id,cookie,{kind:"decision",trialId,judgment:final}),409);
  status(await action(id,cookie,{kind:"initial",trialId,judgment:initial}),409);
  status(await action(id,cookie,{kind:"shown",trialId,stage:"situation",clientShownAt:Date.now()-4000}));
  for(const judgment of [null,{estimate:"20",confidence:3},{estimate:20,confidence:null},{estimate:t.estimateRange.max+1,confidence:3}]) status(await action(id,cookie,{kind:"initial",trialId,judgment}),400);
  status(await action(id,cookie,{kind:"initial",trialId,judgment:{estimate:t.estimateRange.min+t.estimateRange.step/2,confidence:4}}),400);
  status(await action(id,cookie,{kind:"initial",trialId,judgment:{...initial,rationale:"x".repeat(301)}}),400);
  const first=await action(id,cookie,{kind:"initial",trialId,judgment:initial,clientDecidedAt:Date.now()-2000});status(first);privateSafe(first.data,false);assert.equal(first.data.session.advice.aiEstimate,t.aiEstimate);assert.equal(first.data.session.advice.coreReason,t.coreReason);
  status(await action(id,cookie,{kind:"initial",trialId,judgment:initial}));
  status(await action(id,cookie,{kind:"initial",trialId,judgment:{...initial,estimate:initial.estimate+1}}),409);
  if(t.allowRationale) status(await action(id,cookie,{kind:"initial",trialId,judgment:{...initial,rationale:"A changed explanation after viewing AI."}}),409);
  const resumed=await call(`/api/research/session?studyId=${id}`,{cookie});assert.deepEqual(resumed.data.session.initialJudgment,initial);assert.deepEqual(resumed.data.session.profile.levels,levels);
  status(await action(id,cookie,{kind:"decision",trialId,judgment:final}),409);
  const shown={kind:"shown",trialId,stage:"recommendation",clientShownAt:Date.now()-1000};
  (await Promise.all([action(id,cookie,shown),action(id,cookie,shown)])).forEach(r=>status(r));
  status(await action(id,cookie,{kind:"decision",trialId,judgment:{estimate:30,confidence:8}}),400);
  const decided=await action(id,cookie,{kind:"decision",trialId,judgment:final,clientDecidedAt:Date.now(),outcome:999,ai_estimate:999,weight_of_advice:999,levels:{...levels,name:0}});status(decided);assert.equal(decided.data.session.index,index+1);
  const duplicate=await action(id,cookie,{kind:"decision",trialId,judgment:{estimate:0,confidence:1}});status(duplicate);assert.equal(duplicate.data.session.index,index+1);
 }
 const answers=Object.fromEntries(c.config.survey.map(item=>[item.id,4]));
 status(await action(id,cookie,{kind:"survey",answers:{...answers,confidence_01:8}}),400);
 assert.equal((await action(id,cookie,{kind:"survey",answers})).data.session.status,"complete");status(await action(id,cookie,{kind:"survey",answers}));
 const exportData=(await call(`/api/research/export?studyId=${id}`,{admin:true})).data;
 const events=exportData.events.filter(e=>e.session_id===c.sessionId),n=c.config.trialOrder.length;
 for(const type of ["initial_judgment","decision","task_shown","stage_shown"]) assert.equal(events.filter(e=>e.event_type===type).length,n,type);
 assert.equal(events.filter(e=>e.event_type==="manipulation_check").length,8);
 for(const d of events.filter(e=>e.event_type==="decision")) {
  const initial=events.find(e=>e.event_id===d.initial_judgment_id), exposure=events.find(e=>e.exposure_id===d.exposure_id&&e.resolved_stimulus),t=bank.trials.find(t=>t.id===d.trial_id);
  assert.ok(initial&&exposure);assert.equal(exposure.initial_judgment_id,initial.event_id);
  assert.equal(exposure.resolved_stimulus.aiEstimate,t.aiEstimate);assert.equal(exposure.resolved_stimulus.coreReason,t.coreReason);
  assert.deepEqual(exposure.cue_levels,d.cue_levels);
  assert.equal(d.response_unit,t.unit);assert.equal(d.trial_category,t.category);
  assert.equal(d.response_step,t.estimateRange.step);assert.equal(d.response_min,t.estimateRange.min);assert.equal(d.response_max,t.estimateRange.max);
  assert.equal(exposure.response_unit,d.response_unit);assert.equal(initial.response_unit,d.response_unit);
  if(t.allowRationale) {assert.equal(d.initial_rationale,initial.initial_rationale);assert.equal(d.final_rationale,"I considered the AI reasoning alongside my initial view.");}
  assert.ok(!("correct" in d));assert.ok(!("follow_ai" in d));
  const metrics=predictionMetrics({estimate:initial.initial_estimate,confidence:initial.initial_confidence},{estimate:d.final_estimate,confidence:d.final_confidence},t.aiEstimate,t.outcome,t.estimateRange);
  for(const [field,value] of Object.entries(metrics)) assert.equal(d[field],value,field);
  assert.ok(d.latency_ms>=d.thinking_time_ms&&d.thinking_time_ms>=1000);assert.ok(initial.initial_judgment_time_ms>=2000);
 }
 assert.equal(events.find(e=>e.event_type==="decision").weight_of_advice,null);
}
const exported=(await call(`/api/research/export?studyId=${studyId}`,{admin:true})).data;
assert.equal(exported.schema_version,3);assert.ok(!JSON.stringify(exported).includes('"tokenHash"'));
const csv=await (await fetch(`${base}/api/research/export?format=csv&studyId=${studyId}`,{headers:{Authorization:`Bearer ${key}`}})).text();
assert.ok(csv.includes("weight_of_advice"));assert.ok(csv.includes('"-0.5"'));assert.ok(!csv.includes('"\'-0.5"'));
if(process.env.RESEARCH_TEST_EXPORT) {fs.writeFileSync(process.env.RESEARCH_TEST_EXPORT,JSON.stringify(exported,null,2));fs.writeFileSync(process.env.RESEARCH_TEST_EXPORT.replace(/\.json$/,".csv"),csv);}
console.log(`Prediction API E2E passed: fixed6 + user_set6 + full16, paired judgments, withheld advice, immutable initial values, concurrent exposure/retry deduplication, frozen versions, server metrics, 24 ratings and JSON/CSV. Study ${studyId}`);
