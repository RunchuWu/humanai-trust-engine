import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { loadTs } from "./research-test-utils.mjs";
const base = process.env.RESEARCH_BASE_URL ?? "http://127.0.0.1:3101";
const key = process.env.RESEARCH_ADMIN_KEY;
if (!key) throw new Error("Set RESEARCH_ADMIN_KEY for the test server and this test.");
const { defaultStudy } = loadTs("src/lib/research/config.ts");
const bank = JSON.parse(fs.readFileSync("data/stimuli/everyday-en-v1.json", "utf8"));
const config = JSON.parse(JSON.stringify(defaultStudy(bank.trials.map(t => t.id), "everyday-en-v1")));
config.title = "Research V2 E2E"; config.userSet.enabled = true;
async function call(route, { body, cookie, admin = false } = {}) {
  const response = await fetch(base + route, { method: body === undefined ? "GET" : "POST", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}), ...(admin ? { Authorization: `Bearer ${key}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => null); return { response, data };
}
const action = (studyId, cookie, body) => call("/api/research/session", { body: { studyId, ...body }, cookie });
assert.equal((await call("/api/research/export")).response.status, 401);
assert.equal((await call("/api/research/materials")).response.status, 401);
assert.equal((await call("/api/research/studies")).response.status, 401);
assert.equal((await call("/api/research/studies", { body: { config, status: "frozen" } })).response.status, 401);
const draft = await call("/api/research/studies", { body: { config, status: "draft" }, admin: true });
assert.equal(draft.response.status, 201, JSON.stringify(draft.data));
assert.equal((await call(`/api/research/studies?id=${draft.data.study.id}`)).response.status, 404);
const malformed = structuredClone(config); malformed.profiles[0].levels.name = 33;
assert.equal((await call("/api/research/studies", { body: { config: malformed, status: "frozen" }, admin: true })).response.status, 400);
const frozen = await call("/api/research/studies", { body: { config, status: "frozen", parentId: draft.data.study.id }, admin: true });
assert.equal(frozen.response.status, 201, JSON.stringify(frozen.data));
const studyId = frozen.data.study.id;
assert.equal(frozen.data.study.version, 2);
const publicData = await call(`/api/research/studies?id=${studyId}`);
assert.equal(publicData.response.status, 200);
for (const sensitive of ["groundTruth", "answerExplanation", "constraintChecks", "review", "tokenHash"]) assert.ok(!JSON.stringify(publicData.data).includes(`"${sensitive}"`), `Public response leaked ${sensitive}`);
assert.equal((await action(studyId, null, { kind: "start", mode: "fixed", consent: false })).response.status, 400);
const changed = structuredClone(config); changed.profiles.forEach(p => p.levels.name = 75);
const newer = await call("/api/research/studies", { body: { config: changed, status: "frozen", parentId: studyId }, admin: true });
assert.equal(newer.data.study.version, 3);
assert.deepEqual((await call(`/api/research/studies?id=${studyId}`)).data.study.config, config);
let sessionIds = [];
for (const mode of ["fixed", "user_set"]) {
  const requestToken = randomBytes(32).toString("hex");
  const started = await action(studyId, null, { kind: "start", mode, consent: true, requestToken });
  assert.equal(started.response.status, 200, JSON.stringify(started.data));
  const cookie = started.response.headers.get("set-cookie")?.split(";")[0]; assert.ok(cookie);
  const sid = started.data.session.id; sessionIds.push(sid);
  const lostCookieRetry = await action(studyId, null, { kind: "start", mode, consent: true, requestToken });
  assert.equal(lostCookieRetry.data.session.id, sid);
  const duplicateStart = await action(studyId, cookie, { kind: "start", mode, consent: true });
  assert.equal(duplicateStart.data.session.id, sid);
  assert.equal((await action(studyId, cookie, { kind: "start", mode: mode === "fixed" ? "user_set" : "fixed", consent: true })).response.status, 409);
  let levels = { ...started.data.session.profile.levels };
  const forbidden = { ...levels, confidence: levels.confidence === 100 ? 0 : 100 };
  assert.equal((await action(studyId, cookie, { kind: "lock", levels: forbidden })).response.status, mode === "fixed" ? 409 : 403);
  if (mode === "user_set") {
    levels.name = 75; levels.tone = 25; levels.framing = 100;
    const result = await action(studyId, cookie, { kind: "lock", levels }); assert.equal(result.response.status, 200);
    assert.equal((await action(studyId, cookie, { kind: "lock", levels })).response.status, 200);
  }
  assert.equal((await action(studyId, cookie, { kind: "practice", decision: "override" })).response.status, 400);
  assert.equal((await action(studyId, cookie, { kind: "practice", decision: "accept" })).response.status, 200);
  assert.equal((await action(studyId, cookie, { kind: "survey", answers: {} })).response.status, 409);
  for (let index = 0; index < config.trialOrder.length; index++) {
    const trialId = config.trialOrder[index];
    assert.equal((await action(studyId, cookie, { kind: "decision", trialId, decision: "accept" })).response.status, 409);
    for (const stage of ["situation", "evidence", "recommendation"]) {
      if (stage !== "situation") assert.equal((await action(studyId, cookie, { kind: "advance", trialId, fromStage: stage === "evidence" ? "situation" : "evidence" })).response.status, 200);
      const shown = { kind: "shown", trialId, stage, clientShownAt: Date.now() - (stage === "situation" ? 3000 : 1000) };
      const results = await Promise.all([action(studyId, cookie, shown), action(studyId, cookie, shown)]);
      results.forEach(r => assert.equal(r.response.status, 200, JSON.stringify(r.data)));
    }
    const resumed = await call(`/api/research/session?studyId=${studyId}`, { cookie });
    assert.equal(resumed.data.session.stage, "recommendation");
    assert.deepEqual(resumed.data.session.profile.levels, levels);
    // Client-submitted score/config fields must have no influence.
    const decision = await action(studyId, cookie, { kind: "decision", trialId, decision: "accept", clientDecidedAt: Date.now(), correct: true, ground_truth: "forged", levels: forbidden });
    assert.equal(decision.response.status, 200, JSON.stringify(decision.data));
    assert.equal(decision.data.session.index, index + 1);
    const duplicate = await action(studyId, cookie, { kind: "decision", trialId, decision: "override" });
    assert.equal(duplicate.response.status, 200); assert.equal(duplicate.data.session.index, index + 1);
  }
  const answers = Object.fromEntries(config.survey.map(item => [item.id, 4]));
  assert.equal((await action(studyId, cookie, { kind: "survey", answers: { ...answers, confidence_01: 8 } })).response.status, 400);
  assert.equal((await action(studyId, cookie, { kind: "survey", answers })).data.session.status, "complete");
  assert.equal((await action(studyId, cookie, { kind: "survey", answers })).response.status, 200);
  const completed = await call(`/api/research/session?studyId=${studyId}`, { cookie }); assert.equal(completed.data.session.status, "complete");
}
const exported = await call(`/api/research/export?studyId=${studyId}`, { admin: true });
assert.equal(exported.response.status, 200);
assert.ok(!JSON.stringify(exported.data).includes('"tokenHash"'));
for (const id of sessionIds) {
  const events = exported.data.events.filter(e => e.session_id === id);
  assert.equal(events.filter(e => e.event_type === "decision").length, 16);
  assert.equal(events.filter(e => e.event_type === "manipulation_check").length, 6);
  assert.equal(events.filter(e => e.event_type === "task_shown").length, 16);
  const exposures = events.filter(e => e.resolved_stimulus); assert.equal(exposures.length, 16);
  const decisions = events.filter(e => e.event_type === "decision");
  assert.equal(decisions.filter(e => e.correct).length, 8);
  assert.equal(decisions.filter(e => e.ai_correct).length, 8);
  assert.ok(decisions.every(e => e.latency_ms >= e.thinking_time_ms && e.thinking_time_ms >= 1000));
  for (const decision of decisions) {
    const exposure = exposures.find(e => e.exposure_id === decision.exposure_id); assert.ok(exposure);
    assert.deepEqual(exposure.cue_levels, decision.cue_levels);
    assert.equal(exposure.resolved_stimulus.coreReason, bank.trials.find(t => t.id === decision.trial_id).coreReason);
    assert.equal(decision.ground_truth, bank.trials.find(t => t.id === decision.trial_id).groundTruth);
    assert.equal(decision.config_version, 2);
  }
}
const csv = await fetch(`${base}/api/research/export?format=csv&studyId=${studyId}`, { headers: { Authorization: `Bearer ${key}` } });
assert.equal(csv.status, 200); const csvText = await csv.text();
assert.ok(csvText.includes("name_level,tone_level,avatar_level,personality_level,framing_level,confidence_level"));
assert.ok(csvText.includes("thinking_time_ms")); assert.ok(csvText.includes("Your Companion") || csvText.includes("Sarah"));
const path = process.env.RESEARCH_TEST_EXPORT;
if (path) fs.writeFileSync(path, JSON.stringify(exported.data, null, 2));
console.log(`Research E2E passed: drafts/frozen versions, auth, answer privacy, fixed/custom sessions, 32 decisions, 12 ratings, concurrent duplicate exposures, retries, server scoring, version isolation, timing and JSON/CSV exports. Study ${studyId}`);
