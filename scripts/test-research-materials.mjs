import assert from "node:assert/strict";
import fs from "node:fs";
import { loadTs } from "./research-test-utils.mjs";
const { resolveStimulus, defaultStudy, preset, validateStudy } = loadTs("src/lib/research/config.ts");
const bank = JSON.parse(fs.readFileSync("data/stimuli/everyday-prediction-en-v2.json", "utf8"));
const { validEstimate } = loadTs("src/lib/research/prediction.ts");
const levels = [0, 25, 50, 75, 100];
const dimensions = ["name", "tone", "avatar", "personality", "framing", "confidence"];
const formal = bank.trials, all = [...formal, bank.practice];
assert.equal(formal.length, 16);
assert.equal(new Set(all.map(t => t.id)).size, 17);
const categories = Object.groupBy(formal, t => t.category);
assert.equal(Object.keys(categories).length, 4);
for (const rows of Object.values(categories)) assert.equal(rows.length, 4);
for (const t of all) {
  assert.equal(t.taskType, "prediction");
  assert.equal(t.evidence.length, 3);
  assert.equal(t.history.length, 5);
  assert.ok(new Set(t.history).size > 2);
  for (const value of [...t.history, t.aiEstimate, t.outcome]) assert.ok(validEstimate(value,t), `${t.id}: invalid numeric material ${value}`);
  for (const field of ["title", "situation", "question", "coreReason", "outcomeExplanation"]) assert.ok(t[field].trim());
  assert.equal(t.provenance.kind, "synthetic");
  assert.equal(t.review.status, "pending");
  assert.ok(t.review.notes.length);
  for (const d of ["tone", "personality", "framing", "confidence"]) assert.equal(new Set(t.expressionRefs[d]).size, 5);
}
const study = defaultStudy(formal.map(t => t.id), bank.version);
assert.equal(study.trialOrder.length, 6);
assert.equal(study.survey.length, 8);
assert.deepEqual(Array.from(study.trialOrder), bank.pilotIds);
assert.equal(validateStudy(study, formal.map(t=>t.id)), null);
const full = structuredClone(study); full.trialSet="full16"; full.trialOrder=formal.map(t=>t.id);
assert.equal(validateStudy(full, full.trialOrder), null);
for (const mutation of [s => s.profiles[0].levels.tone = 60, s => s.profiles[0].levels.confidence = 75, s => s.userSet.allowedDimensions.push("confidence"), s => s.trialOrder[0] = s.trialOrder[1], s => s.userSet.allowedDimensions.push("unknown"), s => s.survey[0].id = "wrong", s => s.profiles[0].presentation.appearance = "other"]) {
  const changed = structuredClone(study); mutation(changed); assert.ok(validateStudy(changed, study.trialOrder));
}
const changes = { name: ["name"], tone: ["tone"], avatar: ["avatarId"], personality: ["personality"], framing: ["role", "welcome", "situationPrompt", "evidencePrompt", "recommendationPrompt", "closing"], confidence: ["confidence"] };
for (const t of all) {
  const baseline = resolveStimulus(bank, t, preset("neutral"));
  for (const d of dimensions) {
    const outputs = [];
    for (const level of levels) {
      const profile = preset("neutral"); profile.levels[d] = level;
      const output = resolveStimulus(bank, t, profile);
      outputs.push(changes[d].map(key => output[key]).join("|"));
      for (const key of Object.keys(baseline).filter(key => ![...changes[d], "levels", "expressionIds"].includes(key))) assert.equal(JSON.stringify(output[key]), JSON.stringify(baseline[key]), `${d} changed unrelated ${key}`);
    }
    assert.equal(new Set(outputs).size, 5, `${d} must have five distinct visible levels`);
  }
}
// Exhaustive contract coverage: 5^6 configurations × 3 appearances × 17 materials.
let combinations = 0;
for (const appearance of ["cold", "neutral", "friendly"]) {
  for (let encoded = 0; encoded < 15625; encoded++) {
    let value = encoded; const profile = preset(appearance);
    for (const d of dimensions) { profile.levels[d] = levels[value % 5]; value = Math.floor(value / 5); }
    for (const trial of all) {
      const r = resolveStimulus(bank, trial, profile);
      assert.equal(r.coreReason, trial.coreReason);
      assert.equal(r.recommendation, `${trial.aiEstimate} ${trial.unit}`);
      for (const key of ["name", "avatarId", "role", "tone", "personality", "confidence", "welcome", "situationPrompt", "evidencePrompt", "recommendationPrompt", "closing"]) assert.ok(typeof r[key] === "string" && r[key].length);
      combinations++;
    }
  }
}
const count = s => s.trim().split(/\s+/).length;
const wordCounts = ["cold", "neutral", "friendly"].map(a => {
  const r = resolveStimulus(bank, bank.practice, preset(a));
  return count([r.recommendationPrompt, r.tone, r.personality, r.confidence, r.coreReason].join(" "));
});
assert.ok(Math.max(...wordCounts) - Math.min(...wordCounts) <= 12, `Preset reading-load spread: ${wordCounts}`);
console.log(`Research materials passed: 16 + 1 items, uncertain numeric forecasts, six-item pilot, isolation of all six dimensions, ${combinations} resolved combinations. Preset word counts: ${wordCounts.join(" / ")}. Independent semantic review remains pending.`);

const { predictionMetrics, validJudgment } = loadTs("src/lib/research/prediction.ts");
for (const [initial, final, ai, expected] of [[20,20,40,0],[20,30,40,.5],[20,40,40,1],[20,10,40,-.5],[20,50,40,1.5],[40,40,40,null],[40,20,40,null],[40,30,20,.5]]) {
 const m=predictionMetrics({estimate:initial,confidence:2},{estimate:final,confidence:6},ai,35,{min:0,max:100,step:1});
 assert.equal(m.weight_of_advice,expected); assert.equal(m.error_reduction,Math.abs(initial-35)-Math.abs(final-35));
 assert.equal(m.normalized_error_reduction,m.error_reduction/100);
 assert.equal(m.initial_confidence,2); assert.equal(m.final_confidence,6);
}
for (const value of [null,{}, {estimate:"20",confidence:3},{estimate:20,confidence:0},{estimate:20,confidence:8},{estimate:20.5,confidence:3},{estimate:-1,confidence:3}]) assert.equal(validJudgment(value,formal[0]),false);
assert.equal(validJudgment({estimate:0,confidence:1},formal[0]),true);
console.log("Prediction metric fixtures passed: agreement, partial/full shifts, negative and >1 WOA, error changes, confidence and numeric validation.");

assert.deepEqual(Object.keys(categories).sort(),["attendance","consumption","price","time"]);
assert.equal(new Set(study.trialOrder.map(id=>formal.find(t=>t.id===id).category)).size,4);
for(const t of formal) {
 assert.equal(t.unit,({price:"USD",attendance:"people",consumption:"litres",time:"minutes"})[t.category]);
 assert.equal(t.estimateRange.step,t.category==="consumption"?.5:1);
 assert.equal(t.allowRationale,true);
 if(t.category==="price") {assert.equal(t.historyStyle,"cards");assert.equal(t.historyDetails.length,5);}
 if(t.category==="attendance") {assert.equal(t.historyStyle,"bars");assert.ok(t.aiEstimate<=t.estimateRange.max);}
}
const litres=formal.find(t=>t.unit==="litres");
assert.ok(validJudgment({estimate:12.5,confidence:4,rationale:"Similar past events, adjusted for weather."},litres));
for(const estimate of [12.25,NaN,Infinity,-.5,litres.estimateRange.max+.5]) assert.equal(validJudgment({estimate,confidence:4},litres),false);
for(const rationale of [null,7,{},"x".repeat(301)]) assert.equal(validJudgment({estimate:20,confidence:4,rationale},litres),false);
assert.ok(validJudgment({estimate:20,confidence:4,rationale:"x".repeat(300)},litres));
const archived=JSON.parse(fs.readFileSync("data/stimuli/everyday-prediction-en-v1.json","utf8"));
const archivedStudy=defaultStudy(archived.trials.map(t=>t.id),archived.version);
assert.equal(validateStudy(archivedStudy,archived.trials.map(t=>t.id)),null);
assert.deepEqual(Array.from(archivedStudy.trialOrder),archived.pilotIds);
assert.ok(archivedStudy.survey.some(item=>item.text.includes("durations")));
assert.ok(!study.survey.some(item=>item.text.includes("durations")));
assert.equal(validJudgment({estimate:20.5,confidence:4},archived.trials[0]),false);
console.log("Mixed material units, decimals, optional explanations and archived time-study configuration passed.");
