import { randomUUID } from "node:crypto";

import { getPilotSession, noStoreJson, pilotError } from "@/lib/pilot-api";
import { PILOT_SURVEY } from "@/lib/pilot-content";
import { addPilotEvent, addSurvey, getSurvey, setInviteStatus } from "@/lib/pilot-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return pilotError("请求格式有误。"); }
  try {
    const session = await getPilotSession();
    if (!session || session.invite.status === "withdrawn") return pilotError("会话无效。", 401);
    if (session.decisions.length !== session.order.length) return pilotError("请先完成全部题目。", 409);
    if (await getSurvey(session.hash)) {
      if (session.invite.status !== "complete") await setInviteStatus(session.hash, "complete");
      return noStoreJson({ ok: true, saved: true });
    }
    if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) return pilotError("请完成问卷。");
    const answers = body.answers as Record<string, unknown>;
    const clean: Record<string, number> = {};
    for (const item of PILOT_SURVEY) {
      const value = answers[item.id];
      if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 7) {
        return pilotError("请回答全部 1–7 分题目。");
      }
      clean[item.id] = value as number;
    }
    const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 500) : "";
    const now = new Date().toISOString();
    await addSurvey({ token_hash: session.hash, answers: clean, feedback, submitted_at: now });
    await setInviteStatus(session.hash, "complete");
    await addPilotEvent({ id: randomUUID(), token_hash: session.hash, type: "survey", trial_id: null, stage: null, client_ms: null, server_at: now, details: {} });
    return noStoreJson({ ok: true, saved: true });
  } catch {
    return pilotError("数据服务暂不可用，请重试提交问卷。", 503);
  }
}
