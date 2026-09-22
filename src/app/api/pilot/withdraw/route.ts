import { NextResponse } from "next/server";

import { getPilotSession, noStoreJson, PILOT_COOKIE, pilotError } from "@/lib/pilot-api";
import { withdrawPilot } from "@/lib/pilot-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getPilotSession();
    if (!session) return pilotError("会话无效。", 401);
    await withdrawPilot(session.hash);
    const response: NextResponse = noStoreJson({ ok: true });
    response.cookies.delete(PILOT_COOKIE);
    return response;
  } catch {
    return pilotError("暂时无法撤回，请联系研究负责人。", 503);
  }
}
