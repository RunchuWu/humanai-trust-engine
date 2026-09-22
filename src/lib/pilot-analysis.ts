import type { PilotDecision, PilotInvite, PilotSurvey } from "@/lib/pilot-store";

export interface ParticipantSummary {
  participant_id: string;
  condition: number;
  order_variant: string;
  status: string;
  consented_at: string | null;
  completed_at: string | null;
  answered: number;
  correct: number;
  accuracy: number | null;
  follow_rate: number | null;
  overtrust_rate: number | null;
  undertrust_rate: number | null;
  calibration_gap: number | null;
  mean_decision_time_ms: number | null;
  mean_thinking_time_ms: number | null;
  mean_read_time_ms: number | null;
  mean_hesitation_time_ms: number | null;
  humanlike_mean: number | null;
  warmth_mean: number | null;
  agency_mean: number | null;
  clarity: number | null;
  trust: number | null;
  feedback: string;
}

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

export function summarizeParticipants(invites: PilotInvite[], decisions: PilotDecision[], surveys: PilotSurvey[]): ParticipantSummary[] {
  return invites.filter((invite) => invite.status !== "withdrawn").map((invite) => {
    const rows = decisions.filter((row) => row.token_hash === invite.token_hash);
    const survey = surveys.find((row) => row.token_hash === invite.token_hash);
    const correctAi = rows.filter((row) => row.ai_correct);
    const incorrectAi = rows.filter((row) => !row.ai_correct);
    const followCorrect = rate(correctAi.filter((row) => row.choice === "follow").length, correctAi.length);
    const followIncorrect = rate(incorrectAi.filter((row) => row.choice === "follow").length, incorrectAi.length);
    const answers = survey?.answers;
    return {
      participant_id: invite.token_hash.slice(0, 12),
      condition: invite.condition,
      order_variant: invite.order_variant,
      status: invite.status,
      consented_at: invite.consented_at,
      completed_at: invite.completed_at,
      answered: rows.length,
      correct: rows.filter((row) => row.correct).length,
      accuracy: rate(rows.filter((row) => row.correct).length, rows.length),
      follow_rate: rate(rows.filter((row) => row.choice === "follow").length, rows.length),
      overtrust_rate: followIncorrect,
      undertrust_rate: rate(correctAi.filter((row) => row.choice === "other").length, correctAi.length),
      calibration_gap: followCorrect !== null && followIncorrect !== null ? followCorrect - followIncorrect : null,
      mean_decision_time_ms: mean(rows.map((row) => row.total_time_ms)),
      mean_thinking_time_ms: mean(rows.map((row) => row.hesitation_time_ms)),
      mean_read_time_ms: mean(rows.map((row) => row.read_time_ms)),
      mean_hesitation_time_ms: mean(rows.map((row) => row.hesitation_time_ms)),
      humanlike_mean: answers ? mean([answers.humanlike_1, answers.humanlike_2]) : null,
      warmth_mean: answers ? mean([answers.warmth_1, answers.warmth_2]) : null,
      agency_mean: answers ? mean([answers.agency_1, answers.agency_2]) : null,
      clarity: answers?.clarity ?? null,
      trust: answers?.trust ?? null,
      feedback: survey?.feedback ?? "",
    };
  });
}

export function csvTable(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const raw = value === null || value === undefined ? "" : String(value);
    // Free-text feedback must not become a spreadsheet formula on CSV open.
    const string = typeof value === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\n\r]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
  };
  return `${columns.join(",")}\n${rows.map((row) => columns.map((column) => escape(row[column])).join(",")).join("\n")}\n`;
}
