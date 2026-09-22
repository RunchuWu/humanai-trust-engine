import { randomUUID } from "node:crypto";

import { getPilotSession, noStoreJson, pilotError } from "@/lib/pilot-api";
import { addPilotEvent } from "@/lib/pilot-store";
import type { PilotStage } from "@/lib/pilot-content";

export const runtime = "nodejs";

const STAGES: PilotStage[] = ["situation", "evidence", "recommendation"];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return pilotError("请求格式有误。"); }
  try {
    const session = await getPilotSession();
    if (!session || session.invite.status !== "active") return pilotError("会话无效。", 401);
    const expected = session.order[session.decisions.length];
    if (body.trialId !== expected || !STAGES.includes(body.stage as PilotStage)) {
      return pilotError("题目或阶段不匹配。", 409);
    }
    if (typeof body.clientMs !== "number" || !Number.isFinite(body.clientMs) || body.clientMs < 0) {
      return pilotError("时间戳无效。");
    }
    await addPilotEvent({
      id: randomUUID(), token_hash: session.hash, type: "stage",
      trial_id: expected, stage: body.stage as PilotStage,
      client_ms: body.clientMs, server_at: new Date().toISOString(),
      details: {},
    });
    return noStoreJson({ ok: true });
  } catch {
    return pilotError("数据服务暂不可用。", 503);
  }
}
