import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadTs} from './research-test-utils.mjs';
const bank=JSON.parse(fs.readFileSync('data/stimuli/everyday-two-part-en-v1.json','utf8'));
const {defaultStudy,validateStudy,resolveStimulus,preset}=loadTs('src/lib/research/config.ts');
const {validOpenJudgment,stanceMovement,previewOpenTrial}=loadTs('src/lib/research/open-judgment.ts');
const ids=bank.trials.map(t=>t.id), config=JSON.parse(JSON.stringify(defaultStudy(ids,bank.version)));
assert.equal(config.schemaVersion,4);assert.equal(config.workflow,'two-part-v1');assert.equal(config.trialOrder.length,12);
// New visual versions are explicit; archived configurations remain valid.
assert.ok(config.profiles.every(p=>p.presentation.interfaceVersion==='cards-v3'&&p.presentation.assetVersion==='avatars-v2'));
const archived=structuredClone(config);archived.profiles.forEach(p=>{delete p.presentation.interfaceVersion;delete p.presentation.nameVersion;p.presentation.assetVersion='avatars-v1';});
assert.equal(validateStudy(archived,ids),null);
assert.equal(resolveStimulus(bank,bank.practice,archived.profiles[0]).interfaceVersion,'cards-v1');
for(const field of ['assetVersion','interfaceVersion','nameVersion']){const invalid=structuredClone(config);invalid.profiles[0].presentation[field]='unknown-version';assert.ok(validateStudy(invalid,ids));}
assert.equal(resolveStimulus(bank,bank.practice,config.profiles[2]).name,'Sarah');
assert.equal(resolveStimulus(bank,bank.practice,archived.profiles[2]).name,'Your Companion');
const v2=structuredClone(archived);v2.profiles.forEach(p=>{p.presentation.interfaceVersion='cards-v2';p.presentation.assetVersion='avatars-v2';});assert.equal(validateStudy(v2,ids),null);assert.equal(resolveStimulus(bank,bank.practice,v2.profiles[2]).name,'Your Companion');
const avatarManifest=JSON.parse(fs.readFileSync('public/research/avatars-v2/manifest.json','utf8'));
assert.deepEqual(avatarManifest.assets.map(a=>a.level),[0,25,50,75,100]);
for(const a of avatarManifest.assets)assert.ok(fs.statSync('public'+a.file).size>1000);
assert.equal(bank.trials.length+2,14);assert.ok(bank.trials.length+2<=16);assert.equal(validateStudy(config,ids),null);
assert.equal(bank.trials.slice(0,4).every(t=>t.taskType==='open_judgment'),true);
assert.equal(bank.trials.slice(4).every(t=>t.taskType==='prediction'),true);
for(const unit of ['USD','people','litres','minutes'])assert.equal(bank.trials.filter(t=>t.unit===unit).length,2);
for(const mutate of [s=>s.trialOrder.push('price_03'),s=>[s.trialOrder[0],s.trialOrder[4]]=[s.trialOrder[4],s.trialOrder[0]],s=>s.trialSet='full16',s=>s.profiles[1].levels.confidence=75]){const c=structuredClone(config);mutate(c);assert.ok(validateStudy(c,ids));}
const dimensions=['name','tone','avatar','personality','framing','confidence'];let count=0;
const open=[...bank.trials.filter(t=>t.taskType==='open_judgment'),bank.practice];
for(const t of open){
 assert.equal(t.viewpoints.length,2);assert.deepEqual(t.viewpoints.map(v=>v.id),['A','B']);assert.deepEqual(t.viewpoints.map(v=>v.direction),['support','oppose']);assert.ok(t.proposition&&t.question&&t.situation);assert.equal(t.review.status,'pending');assert.ok(!('outcome' in t));
 const lengths=t.viewpoints.map(v=>v.reason.split(/\s+/).length);assert.ok(Math.max(...lengths)-Math.min(...lengths)<=20,`${t.id} unbalanced reading load`);
 for(const v of t.viewpoints){
  const trial=previewOpenTrial({...t,previewViewpoints:t.viewpoints},v.id);
  for(let i=0;i<15625;i++){let x=i;const profile=preset('neutral');for(const d of dimensions){profile.levels[d]=[0,25,50,75,100][x%5];x=Math.floor(x/5);}
   const r=resolveStimulus(bank,trial,profile);assert.equal(r.coreReason,v.reason);assert.equal(r.recommendation,v.summary);assert.equal(r.viewpointId,v.id);assert.equal(r.proposition,t.proposition);assert.ok(!('aiEstimate' in r));for(const f of ['tone','personality','confidence','role'])assert.ok(r[f]);count++;
  }
 }
}
for(const value of [null,{}, {text:'short',stance:'agree',confidence:4},{text:'x'.repeat(1201),stance:'agree',confidence:4},{text:'A sufficient response.',stance:'unknown',confidence:4},{text:'A sufficient response.',stance:'agree',confidence:8}])assert.equal(validOpenJudgment(value),false);
assert.ok(validOpenJudgment({text:'I would propose another arrangement.',stance:'undecided',confidence:1}));
assert.equal(stanceMovement('disagree','agree','support').stance_alignment,'along_ai_direction');
assert.equal(stanceMovement('disagree','agree','oppose').stance_alignment,'against_ai_direction');
assert.equal(stanceMovement('agree','agree','support').stance_change,'unchanged');
assert.equal(stanceMovement('undecided','agree','support').stance_change,'not_comparable');
console.log(`Two-part materials passed: 4 open + 8 numeric, 2 practices, enforced part order and cap, ${count} open cue/viewpoint combinations, ordinal stance validation without WOA.`);
