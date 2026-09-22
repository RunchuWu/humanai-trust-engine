import { randomBytes, randomInt } from "node:crypto";

import { adminAuthorized, noStoreJson, pilotError } from "@/lib/pilot-api";
import { createInvites, hashPilotToken, type PilotInvite } from "@/lib/pilot-store";
import type { PilotCondition } from "@/lib/pilot-content";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!adminAuthorized(request)) return pilotError("无权限。", 401);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return pilotError("请求格式有误。"); }
  const perGroup = body.perGroup;
  if (!Number.isInteger(perGroup) || (perGroup as number) < 1 || (perGroup as number) > 30) {
    return pilotError("每组邀请码数量须为 1–30。");
  }
  try {
    const origin = new URL(request.url).origin;
    const now = new Date().toISOString();
    const rows: PilotInvite[] = [];
    const links: { condition: PilotCondition; order: "A" | "B"; url: string }[] = [];
    for (const condition of [1, 2, 3] as PilotCondition[]) {
      for (let i = 0; i < (perGroup as number); i++) {
        const token = randomBytes(24).toString("hex");
        const order = i % 2 === 0 ? "A" : "B";
        rows.push({ token_hash: hashPilotToken(token), session_hash: null, condition, order_variant: order,
          status: "pending", created_at: now, consented_at: null, completed_at: null });
        links.push({ condition, order, url: `${origin}/pilot/${condition}?invite=${token}` });
      }
    }
    // Mix the distribution order while retaining equal counts by condition.
    for (let i = links.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [links[i], links[j]] = [links[j], links[i]];
    }
    await createInvites(rows);
    return noStoreJson({ ok: true, links, note: "邀请码明文仅在此响应中出现，请立即保存。" });
  } catch {
    return pilotError("生成邀请链接失败，请检查数据库配置。", 503);
  }
}
