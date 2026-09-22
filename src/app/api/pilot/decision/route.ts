import { randomUUID } from "node:crypto";

import { getPilotAnswer } from "@/lib/pilot-answer-key";
import { getPilotSession, noStoreJson, pilotError } from "@/lib/pilot-api";
import { addDecision, addPilotEvent } from "@/lib/pilot-store";
import { PILOT_VERSION, type PilotChoice } from "@/lib/pilot-content";

export const runtime = "nodejs";

function validDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_800_000;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return pilotError("请求格式有误。"); }
  try {
    const session = await getPilotSession();
    if (!session || session.invite.status !== "active") return pilotError("会话无效。", 401);
    if (body.choice !== "follow" && body.choice !== "other") return pilotError("请选择一个方案。");
    const existing = session.decisions.find((row) => row.trial_id === body.trialId);
    if (existing) return noStoreJson({ ok: true, saved: true, nextIndex: session.decisions.length });
    const nextIndex = session.decisions.length;
    const trialId = session.order[nextIndex];
    if (!trialId || body.trialId !== trialId) return pilotError("请按顺序完成题目。", 409);
    if (!validDuration(body.situationTimeMs) || !validDuration(body.evidenceTimeMs) ||
      !validDuration(body.readTimeMs) || !validDuration(body.hesitationTimeMs) ||
      body.readTimeMs !== body.situationTimeMs + body.evidenceTimeMs) return pilotError("答题时间无效。");
    const answer = getPilotAnswer(trialId);
    if (!answer) return pilotError("题目不存在。", 404);
    const choice = body.choice as PilotChoice;
    const correct = (choice === "follow") === answer.aiCorrect;
    const saved = await addDecision({
      token_hash: session.hash, trial_id: trialId, trial_index: nextIndex,
      choice, stimulus_version: PILOT_VERSION,
      ai_reco: answer.trial.aiChoice, ground_truth: answer.correctAction,
      ai_correct: answer.aiCorrect, correct,
      situation_time_ms: body.situationTimeMs,
      evidence_time_ms: body.evidenceTimeMs,
      read_time_ms: body.readTimeMs,
      hesitation_time_ms: body.hesitationTimeMs,
      total_time_ms: body.readTimeMs + body.hesitationTimeMs,
      submitted_at: new Date().toISOString(),
    });
    await addPilotEvent({
      id: randomUUID(), token_hash: session.hash, type: "decision", trial_id: trialId,
      stage: null, client_ms: typeof body.clientMs === "number" ? body.clientMs : null,
      server_at: saved.submitted_at, details: { choice: saved.choice },
    });
    return noStoreJson({ ok: true, saved: true, nextIndex: nextIndex + 1 });
  } catch {
    return pilotError("数据服务暂不可用，答案尚未确认保存。", 503);
  }
}
