import assert from "node:assert/strict";
import fs from "node:fs";
import { loadTs } from "./research-test-utils.mjs";
const { resolveStimulus, defaultStudy, preset, validateStudy } = loadTs("src/lib/research/config.ts");
const bank = JSON.parse(fs.readFileSync("data/stimuli/everyday-en-v1.json", "utf8"));
const levels = [0, 25, 50, 75, 100];
const dimensions = ["name", "tone", "avatar", "personality", "framing", "confidence"];
const formal = bank.trials, all = [...formal, bank.practice];
assert.equal(formal.length, 16);
assert.equal(new Set(all.map(t => t.id)).size, 17);
const categories = Object.groupBy(formal, t => t.category);
assert.equal(Object.keys(categories).length, 4);
for (const rows of Object.values(categories)) {
  assert.equal(rows.length, 4);
  assert.equal(rows.filter(t => t.groundTruth === t.aiRecommendation).length, 2);
  assert.equal(rows.filter(t => t.groundTruth === "proceed").length, 2);
  assert.equal(rows.filter(t => t.aiRecommendation === "proceed").length, 2);
}
assert.equal(formal.filter(t => t.groundTruth !== t.aiRecommendation && t.aiRecommendation === "proceed").length, 4);
assert.equal(formal.filter(t => t.groundTruth !== t.aiRecommendation && t.aiRecommendation === "reject").length, 4);
for (const t of all) {
  assert.equal(t.evidence.length, 3);
  assert.equal(t.constraintChecks.length, 3);
  assert.equal(t.constraintChecks.every(c => c.satisfied), t.groundTruth === "proceed", `${t.id} constraint result`);
  for (const field of ["title", "situation", "proposal", "coreReason", "answerExplanation"]) assert.ok(t[field].trim());
  assert.ok(t.review.notes.length);
  for (const d of ["tone", "personality", "framing", "confidence"]) assert.equal(new Set(t.expressionRefs[d]).size, 5);
}
const study = defaultStudy(formal.map(t => t.id), "everyday-en-v1");
assert.equal(validateStudy(study, study.trialOrder), null);
for (const mutation of [s => s.profiles[0].levels.tone = 60, s => s.trialOrder[0] = s.trialOrder[1], s => s.userSet.allowedDimensions.push("unknown"), s => s.survey[0].id = "wrong", s => s.profiles[0].presentation.appearance = "other"]) {
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
      assert.equal(r.recommendation, trial.aiRecommendation === "proceed" ? trial.actionLabel : trial.alternativeLabel);
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
assert.ok(Math.max(...wordCounts) - Math.min(...wordCounts) <= 10, `Preset reading-load spread: ${wordCounts}`);
console.log(`Research materials passed: 16 + 1 items, balanced answers/errors, isolation of all six dimensions, ${combinations} resolved combinations. Preset word counts: ${wordCounts.join(" / ")}. Independent semantic review remains pending.`);
