import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const base = process.env.PILOT_BASE_URL ?? "http://localhost:3100";
const adminKey = process.env.PILOT_ADMIN_KEY;
if (!adminKey) throw new Error("Set PILOT_ADMIN_KEY for the running app and this test.");

async function call(path, { method = "GET", body, cookie, admin = false } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(admin ? { Authorization: `Bearer ${adminKey}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

assert.equal((await call("/api/pilot/admin/export?kind=json")).response.status, 401);
assert.equal((await call("/api/pilot/session")).response.status, 401);

const generated = await call("/api/pilot/admin/invites", { method: "POST", body: { perGroup: 2 }, admin: true });
assert.equal(generated.response.status, 200, JSON.stringify(generated.data));
assert.equal(generated.data.links.length, 6);
const groupLinks = [1, 2, 3].map((condition) => generated.data.links.find((link) => link.condition === condition));
const withdrawalLink = generated.data.links.find((link) => !groupLinks.includes(link));
const seenHashes = [];

for (const link of groupLinks) {
  const token = new URL(link.url).searchParams.get("invite");
  const hash = createHash("sha256").update(token).digest("hex");
  seenHashes.push(hash);
  const started = await call("/api/pilot/start", { method: "POST", body: { token, condition: link.condition, consent: true, adult: true } });
  assert.equal(started.response.status, 200, JSON.stringify(started.data));
  const cookie = started.response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.includes("humanai_pilot_token="));
  const reusedElsewhere = await call("/api/pilot/start", { method: "POST", body: { token, condition: link.condition, consent: true, adult: true } });
  assert.equal(reusedElsewhere.response.status, 409);
  const session = await call("/api/pilot/session", { cookie });
  assert.equal(session.data.condition, link.condition);
  assert.equal(session.data.order.length, 12);
  for (let index = 0; index < session.data.order.length; index++) {
    const trialId = session.data.order[index];
    for (const stage of ["situation", "evidence", "recommendation"]) {
      const result = await call("/api/pilot/stage", { method: "POST", cookie, body: { trialId, stage, clientMs: Date.now() } });
      assert.equal(result.response.status, 200, JSON.stringify(result.data));
    }
    const decision = await call("/api/pilot/decision", { method: "POST", cookie, body: { trialId, choice: "follow", clientMs: Date.now(), situationTimeMs: 900, evidenceTimeMs: 1400, readTimeMs: 2300, hesitationTimeMs: 1400 } });
    assert.equal(decision.response.status, 200, JSON.stringify(decision.data));
    assert.equal(decision.data.nextIndex, index + 1);
  }
  const duplicate = await call("/api/pilot/decision", { method: "POST", cookie, body: { trialId: session.data.order[0], choice: "other", readTimeMs: 0, hesitationTimeMs: 0 } });
  assert.equal(duplicate.response.status, 200);
  const answerIds = ["humanlike_1", "humanlike_2", "warmth_1", "warmth_2", "agency_1", "agency_2", "clarity", "trust"];
  const survey = await call("/api/pilot/survey", { method: "POST", cookie, body: { answers: Object.fromEntries(answerIds.map((id) => [id, 4])), feedback: link.condition === 1 ? "=1+1" : "测试" } });
  assert.equal(survey.response.status, 200, JSON.stringify(survey.data));
  const resumed = await call("/api/pilot/session", { cookie });
  assert.equal(resumed.data.status, "complete");
  assert.equal(resumed.data.completedTrialIds.length, 12);
}

const withdrawalToken = new URL(withdrawalLink.url).searchParams.get("invite");
const withdrawalHash = createHash("sha256").update(withdrawalToken).digest("hex");
const wrongGroup = await call("/api/pilot/start", { method: "POST", body: { token: withdrawalToken, condition: withdrawalLink.condition === 1 ? 2 : 1, consent: true, adult: true } });
assert.equal(wrongGroup.response.status, 403);
const withdrawalStart = await call("/api/pilot/start", { method: "POST", body: { token: withdrawalToken, condition: withdrawalLink.condition, consent: true, adult: true } });
assert.equal(withdrawalStart.response.status, 200);
const withdrawalCookie = withdrawalStart.response.headers.get("set-cookie")?.split(";")[0];
const withdrawalSession = await call("/api/pilot/session", { cookie: withdrawalCookie });
const withdrawalTrial = withdrawalSession.data.order[0];
const withdrawalDecision = await call("/api/pilot/decision", { method: "POST", cookie: withdrawalCookie, body: { trialId: withdrawalTrial, choice: "other", clientMs: Date.now(), situationTimeMs: 800, evidenceTimeMs: 900, readTimeMs: 1700, hesitationTimeMs: 1200 } });
assert.equal(withdrawalDecision.response.status, 200);
const withdrawn = await call("/api/pilot/withdraw", { method: "POST", cookie: withdrawalCookie, body: {} });
assert.equal(withdrawn.response.status, 200);
assert.equal((await call("/api/pilot/session", { cookie: withdrawalCookie })).response.status, 401);

const exported = await call("/api/pilot/admin/export?kind=json", { admin: true });
assert.equal(exported.response.status, 200);
const participantCsvResponse = await fetch(`${base}/api/pilot/admin/export?kind=participants`, { headers: { Authorization: `Bearer ${adminKey}` } });
assert.equal(participantCsvResponse.status, 200);
const participantCsv = await participantCsvResponse.text();
assert.ok(participantCsv.startsWith("participant_id,condition,order_variant,status,consented_at,completed_at,answered,correct,accuracy,"));
assert.ok(participantCsv.includes("mean_decision_time_ms,mean_thinking_time_ms,mean_read_time_ms"));
assert.ok(participantCsv.includes("'=1+1"));
assert.ok(participantCsv.trimEnd().split("\n").length >= 6); // header + this run's 5 retained invitations
const decisionCsvResponse = await fetch(`${base}/api/pilot/admin/export?kind=decisions`, { headers: { Authorization: `Bearer ${adminKey}` } });
assert.equal(decisionCsvResponse.status, 200);
const decisionCsv = await decisionCsvResponse.text();
assert.ok(decisionCsv.includes("follow_ai,ai_reco,ground_truth,ai_correct,correct"));
assert.ok(decisionCsv.includes("situation_time_ms,evidence_time_ms,read_time_ms,hesitation_time_ms,thinking_time_ms,total_time_ms,decision_time_ms,latency_ms"));
assert.ok(decisionCsv.trimEnd().split("\n").length >= 37); // header + this run's 36 decisions
assert.equal(exported.data.decisions.filter((row) => row.token_hash === withdrawalHash).length, 0);
assert.equal(exported.data.participants.filter((row) => row.participant_id === withdrawalHash.slice(0, 12)).length, 0);
for (const hash of seenHashes) {
  const rows = exported.data.decisions.filter((row) => row.token_hash === hash);
  assert.equal(rows.length, 12);
  assert.equal(rows.filter((row) => row.ai_correct).length, 6);
  assert.equal(rows.filter((row) => !row.ai_correct).length, 6);
  assert.equal(rows.filter((row) => row.correct).length, 6);
  assert.ok(rows.every((row) => row.stimulus_version === "zh-pilot-v1"));
  assert.ok(rows.every((row) => row.ai_correct === (row.ai_reco === row.ground_truth)));
  assert.ok(rows.every((row) => row.correct === (row.choice === "follow" ? row.ai_correct : !row.ai_correct)));
  assert.ok(rows.every((row) => row.situation_time_ms === 900 && row.evidence_time_ms === 1400 && row.read_time_ms === 2300 && row.hesitation_time_ms === 1400));
  const summary = exported.data.participants.find((row) => row.participant_id === hash.slice(0, 12));
  assert.equal(summary.accuracy, 0.5);
  assert.equal(summary.mean_decision_time_ms, 3700);
  assert.equal(summary.mean_thinking_time_ms, 1400);
  assert.equal(summary.overtrust_rate, 1);
  assert.equal(summary.calibration_gap, 0);
}

console.log("Pilot E2E passed: 3 interfaces, 36 complete decisions, timing, survey, resume, idempotency, group binding, withdrawal, admin authorization, CSV/JSON export.");
