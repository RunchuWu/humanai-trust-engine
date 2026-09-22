import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {loadTs} from './research-test-utils.mjs';
const base=process.env.RESEARCH_BASE_URL??'http://127.0.0.1:3101',key=process.env.RESEARCH_ADMIN_KEY;
if(!key)throw Error('Set RESEARCH_ADMIN_KEY.');
const bank=JSON.parse(fs.readFileSync('data/stimuli/everyday-two-part-en-v1.json','utf8'));
const {defaultStudy}=loadTs('src/lib/research/config.ts');
const config=JSON.parse(JSON.stringify(defaultStudy(bank.trials.map(t=>t.id),bank.version)));config.userSet.enabled=true;
async function call(route,{body,cookie,admin=false}={}){const r=await fetch(base+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(admin?{Authorization:`Bearer ${key}`}:{})},body:body?JSON.stringify(body):undefined});return{r,data:await r.json()};}
const check=(v,status=200)=>{assert.equal(v.r.status,status,JSON.stringify(v.data));return v.data;};
check(await call('/api/research/studies',{body:{config,status:'frozen'}}),401);
for(const change of [c=>c.trialOrder.push('price_03'),c=>[c.trialOrder[0],c.trialOrder[4]]=[c.trialOrder[4],c.trialOrder[0]],c=>c.trialSet='full16']){const c=structuredClone(config);change(c);check(await call('/api/research/studies',{body:{config:c,status:'frozen'},admin:true}),400);}
const study=check(await call('/api/research/studies',{body:{config,status:'frozen'},admin:true}),201).study,id=study.id;
const publicData=check(await call(`/api/research/studies?id=${id}`));
for(const k of ['viewpoints','previewViewpoints','aiViewpoint','aiEstimate','outcome','review'])assert.ok(!JSON.stringify(publicData.dataset).includes(`"${k}"`),`Leaked ${k}`);
const html=await(await fetch(`${base}/task?study=${id}`)).text();assert.ok(!html.includes(bank.trials[0].viewpoints[0].reason));
const initial={text:'I would discuss the situation, including the competing needs.\nA \"fair\" answer needs conditions before deciding.',stance:'disagree',confidence:3};
const final={text:'I would propose a conditional arrangement, recognising both people involved.\nThe \"best\" answer still depends on their views.',stance:'somewhat_agree',confidence:5};
const sessions=[];
for(const mode of ['fixed','user_set']){
 const token=randomBytes(32).toString('hex');
 const start=await call('/api/research/session',{body:{studyId:id,kind:'start',mode,consent:true,requestToken:token}});const session=check(start).session;sessions.push(session.id);
 const cookie=start.r.headers.get('set-cookie').split(';')[0];
 const action=(body)=>call('/api/research/session',{cookie,body:{studyId:id,...body}});
 assert.equal(check(await call('/api/research/session',{body:{studyId:id,kind:'start',mode,consent:true,requestToken:token}})).session.id,session.id);
 assert.ok(!session.openAdvice&&!session.viewpoints);
 if(mode==='user_set'){check(await action({kind:'lock',levels:{...session.profile.levels,confidence:100}}),403);check(await action({kind:'lock',levels:{...session.profile.levels,name:75}}));}
 check(await action({kind:'practice_initial',trialId:bank.numericPractice.id,judgment:{estimate:20,confidence:3}}),409);
 check(await action({kind:'practice',trialId:bank.practice.id,judgment:final}),409);
 const p=check(await action({kind:'practice_initial',trialId:bank.practice.id,judgment:initial})).session;assert.ok(p.openPracticeAdvice.coreReason);check(await action({kind:'practice',trialId:bank.practice.id,judgment:final}));
 check(await action({kind:'practice',trialId:bank.practice.id,judgment:final}));
 for(let i=0;i<12;i++){
  const t=bank.trials[i],open=t.taskType==='open_judgment';
  if(i===4){
   check(await action({kind:'shown',trialId:t.id,stage:'situation'}),409);
   check(await action({kind:'practice_initial',trialId:bank.numericPractice.id,judgment:{estimate:20,confidence:3}}));
   check(await action({kind:'practice',trialId:bank.numericPractice.id,judgment:{estimate:45,confidence:4}}));
  }
  check(await action({kind:'shown',trialId:t.id,stage:'recommendation'}),409);
  check(await action({kind:'advance',trialId:t.id,fromStage:'situation'}),409);
  check(await action({kind:'decision',trialId:t.id,judgment:open?final:{estimate:30,confidence:4}}),409);
  check(await action({kind:'shown',trialId:t.id,stage:'situation',clientShownAt:Date.now()-3000}));
  const first=open?{...initial,stance:i===3?'undecided':'disagree'}:{estimate:t.unit==='litres'?20.5:30,confidence:3};
  const last=open?final:{estimate:t.unit==='litres'?24.5:35,confidence:5};
  check(await action({kind:'initial',trialId:t.id,judgment:open?{...first,text:'short'}:{estimate:1.25,confidence:3}}),400);
  const after=check(await action({kind:'initial',trialId:t.id,judgment:first})).session;
  const advice=open?after.openAdvice:after.advice;assert.ok(advice.coreReason);assert.ok(!advice.viewpoints&&!advice.previewViewpoints&&!('outcome'in advice));
  if(open)assert.equal(advice.coreReason,t.viewpoints.find(v=>v.id===advice.aiViewpoint.id).reason);
  check(await action({kind:'initial',trialId:t.id,judgment:first}));
  check(await action({kind:'initial',trialId:t.id,judgment:open?{...first,text:'A revised initial answer is not allowed after seeing AI.'}:{...first,estimate:first.estimate+1}}),409);
  const resumed=check(await call(`/api/research/session?studyId=${id}`,{cookie})).session;
  assert.deepEqual(open?resumed.openInitial:resumed.initialJudgment,first);
  const shown={kind:'shown',trialId:t.id,stage:'recommendation',clientShownAt:Date.now()-1000};(await Promise.all([action(shown),action(shown)])).forEach(v=>check(v));
  const saved=check(await action({kind:'decision',trialId:t.id,judgment:last,viewpoint_id:'forged',weight_of_advice:999,correct:true})).session;
  check(await action({kind:'decision',trialId:t.id,judgment:last}));
  if(open){
   assert.equal(saved.stage,'reflection');assert.equal(saved.index,i);assert.equal(saved.openFinal.text,last.text);
   assert.equal(check(await call(`/api/research/session?studyId=${id}`,{cookie})).session.stage,'reflection');
   check(await action({kind:'shown',trialId:bank.trials[i+1].id,stage:'situation'}),409);
   check(await action({kind:'reflection',trialId:t.id,text:'x'.repeat(1201)}),400);
   const text=i%2?'':'I retained my own conclusion but considered the suggested conditions.';
   assert.equal(check(await action({kind:'reflection',trialId:t.id,text})).session.index,i+1);
   check(await action({kind:'reflection',trialId:t.id,text:'A retry must not overwrite the saved reflection.'}));
  }else assert.equal(saved.index,i+1);
 }
 const answers=Object.fromEntries(config.survey.map(s=>[s.id,4]));assert.equal(check(await action({kind:'survey',answers})).session.status,'complete');check(await action({kind:'survey',answers}));
}
const exported=check(await call(`/api/research/export?studyId=${id}`,{admin:true}));assert.equal(exported.schema_version,4);
for(const sid of sessions){
 const e=exported.events.filter(e=>e.session_id===sid), decisions=e.filter(e=>e.event_type==='decision'), opens=decisions.filter(e=>e.trial_type==='open_judgment');
 assert.equal(decisions.length,12);assert.equal(opens.length,4);assert.equal(e.filter(e=>e.event_type==='reflection').length,4);assert.equal(e.filter(e=>e.resolved_stimulus).length,12);assert.equal(e.filter(e=>e.event_type==='manipulation_check').length,8);
 assert.equal(opens.filter(e=>e.viewpoint_id==='A').length,2);assert.equal(opens.filter(e=>e.viewpoint_id==='B').length,2);
 for(const d of opens){for(const f of ['weight_of_advice','correct','outcome','ai_estimate'])assert.ok(!(f in d));assert.equal(d.part,1);assert.ok(d.initial_text&&d.final_text);const snap=e.find(x=>x.exposure_id===d.exposure_id&&x.resolved_stimulus);assert.equal(snap.resolved_stimulus.viewpointId,d.viewpoint_id);assert.equal(snap.initial_judgment_id,d.initial_judgment_id);assert.equal(snap.resolved_stimulus.interfaceVersion,'cards-v3');assert.ok(snap.resolved_stimulus.avatarId.startsWith('avatars-v2-')); }
 assert.equal(opens[3].stance_alignment,'not_comparable');
 for(const d of decisions.filter(e=>e.trial_type==='prediction')){assert.equal(d.part,2);assert.equal(d.metrics_version,'prediction-metrics-v1');assert.ok(!('final_text'in d));}
}
const csv=await(await fetch(`${base}/api/research/export?studyId=${id}&format=csv`,{headers:{Authorization:`Bearer ${key}`}})).text();assert.ok(csv.includes('initial_text,final_text,initial_stance,final_stance'));
const path=process.env.RESEARCH_TEST_EXPORT??'/tmp/two-part-export.json';fs.writeFileSync(path,JSON.stringify(exported,null,2));fs.writeFileSync(path.replace(/\.json$/,'.csv'),csv);
console.log(`Two-part API passed: 2 complete 12-task sessions, both practices, fixed/custom locks, balanced perspectives, saved text/stance/reflection, numeric scores, privacy, refresh, retries and exports. Study ${id}`);
