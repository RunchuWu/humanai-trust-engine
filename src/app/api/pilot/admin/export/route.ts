import { adminAuthorized, pilotError } from "@/lib/pilot-api";
import { csvTable, summarizeParticipants } from "@/lib/pilot-analysis";
import { getPilotAnswer } from "@/lib/pilot-answer-key";
import { PILOT_AGENTS, PILOT_VERSION } from "@/lib/pilot-content";
import { getPilotExport } from "@/lib/pilot-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!adminAuthorized(request)) return pilotError("无权限。", 401);
  try {
    const data = await getPilotExport();
    const summary = summarizeParticipants(data.invites, data.decisions, data.surveys);
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "participants";
    const headers = { "Cache-Control": "no-store", "Content-Type": "text/csv; charset=utf-8" };
    if (kind === "json") {
      return Response.json({ version: PILOT_VERSION, ...data, participants: summary }, { headers: { "Cache-Control": "no-store" } });
    }
    if (kind === "participants") {
      return new Response(csvTable(summary as unknown as Record<string, unknown>[]), { headers: { ...headers, "Content-Disposition": 'attachment; filename="pilot-participants.csv"' } });
    }
    if (kind === "decisions") {
      const invites = new Map(data.invites.map((invite) => [invite.token_hash, invite]));
      const rows = data.decisions.filter((row) => invites.get(row.token_hash)?.status !== "withdrawn").map((row) => {
        const condition = invites.get(row.token_hash)?.condition;
        const answer = getPilotAnswer(row.trial_id);
        return {
          participant_id: row.token_hash.slice(0, 12),
          condition: condition ?? "", order_variant: invites.get(row.token_hash)?.order_variant ?? "",
          stimulus_version: row.stimulus_version ?? PILOT_VERSION,
          trial_id: row.trial_id, trial_index: row.trial_index, choice: row.choice,
          follow_ai: row.choice === "follow", ai_reco: row.ai_reco ?? answer?.trial.aiChoice ?? "",
          ground_truth: row.ground_truth ?? answer?.correctAction ?? "", ai_correct: row.ai_correct, correct: row.correct,
          agent_name: condition ? PILOT_AGENTS[condition].name : "",
          situation_time_ms: row.situation_time_ms, evidence_time_ms: row.evidence_time_ms,
          read_time_ms: row.read_time_ms, hesitation_time_ms: row.hesitation_time_ms,
          thinking_time_ms: row.hesitation_time_ms, total_time_ms: row.total_time_ms,
          decision_time_ms: row.total_time_ms, latency_ms: row.total_time_ms,
          submitted_at: row.submitted_at,
        };
      });
      return new Response(csvTable(rows as Record<string, unknown>[]), { headers: { ...headers, "Content-Disposition": 'attachment; filename="pilot-decisions.csv"' } });
    }
    if (kind === "events") {
      const rows = data.events.filter((row) => data.invites.find((invite) => invite.token_hash === row.token_hash)?.status !== "withdrawn").map((row) => ({
        participant_id: row.token_hash.slice(0, 12), type: row.type,
        trial_id: row.trial_id, stage: row.stage, client_ms: row.client_ms,
        server_at: row.server_at,
      }));
      return new Response(csvTable(rows), { headers: { ...headers, "Content-Disposition": 'attachment; filename="pilot-events.csv"' } });
    }
    return pilotError("未知导出类型。");
  } catch {
    return pilotError("导出失败，请检查数据库配置。", 503);
  }
}
