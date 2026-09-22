import { getPilotSession, noStoreJson, pilotError } from "@/lib/pilot-api";
import { getSurvey } from "@/lib/pilot-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getPilotSession();
    if (!session) return pilotError("请使用有效的邀请链接进入。", 401);
    const survey = await getSurvey(session.hash);
    return noStoreJson({
      ok: true,
      condition: session.invite.condition,
      status: session.invite.status,
      order: session.order,
      completedTrialIds: session.decisions.map((row) => row.trial_id),
      surveyDone: Boolean(survey),
    });
  } catch {
    return pilotError("数据服务暂不可用。", 503);
  }
}
