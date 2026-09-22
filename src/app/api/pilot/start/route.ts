import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { isCondition, noStoreJson, PILOT_COOKIE, pilotError, validToken } from "@/lib/pilot-api";
import { activateInvite, getInvite, hashPilotToken } from "@/lib/pilot-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && (
    process.env.PILOT_RECRUITMENT_OPEN !== "1" ||
    !process.env.PILOT_CONTACT || !process.env.PILOT_DATA_REGION ||
    !process.env.PILOT_RETENTION_DAYS
  )) {
    return pilotError("研究尚未开放招募。", 503);
  }
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return pilotError("请求格式有误。"); }
  if (!validToken(body.token) || !isCondition(body.condition) || body.consent !== true || body.adult !== true) {
    return pilotError("请确认年满 18 岁并同意参与。", 400);
  }
  try {
    const hash = hashPilotToken(body.token);
    const existing = await getInvite(hash);
    if (!existing || existing.condition !== body.condition || existing.status === "withdrawn") {
      return pilotError("邀请链接无效或不属于这个界面。", 403);
    }
    let sessionSecret = (await cookies()).get(PILOT_COOKIE)?.value ?? "";
    let invite = existing;
    if (existing.status === "pending") {
      sessionSecret = randomBytes(24).toString("hex");
      const activated = await activateInvite(hash, hashPilotToken(sessionSecret));
      if (!activated) return pilotError("邀请链接已被使用。", 409);
      invite = activated;
    } else if (!validToken(sessionSecret) || existing.session_hash !== hashPilotToken(sessionSecret)) {
      return pilotError("此邀请已在另一设备上启用。请继续使用原设备。", 409);
    }
    const response = noStoreJson({ ok: true, condition: invite.condition, status: invite.status });
    response.cookies.set(PILOT_COOKIE, sessionSecret, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch {
    return pilotError("数据服务暂不可用，请稍后重试。", 503);
  }
}
