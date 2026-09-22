import type { PredictionJudgment, PredictionMetrics, PredictionTrial } from "./types";

export function validEstimate(value: unknown, trial: PredictionTrial): value is number {
  const { min, max, step } = trial.estimateRange;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || !(step > 0)) return false;
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}
export function validJudgment(value: unknown, trial: PredictionTrial): value is PredictionJudgment {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const judgment = value as Record<string, unknown>;
  return (judgment.rationale === undefined || trial.allowRationale === true && typeof judgment.rationale === "string" && judgment.rationale.length <= 300) && validEstimate(judgment.estimate, trial) && typeof judgment.confidence === "number" && Number.isInteger(judgment.confidence) && judgment.confidence >= 1 && judgment.confidence <= 7;
}
// Allowlist persisted fields; caller-supplied scores/configuration never become answers.
export function cleanJudgment(judgment: PredictionJudgment): PredictionJudgment {
  return { estimate: judgment.estimate, confidence: judgment.confidence,
    ...(judgment.rationale?.trim() ? { rationale: judgment.rationale.trim() } : {}) };
}
export function sameJudgment(a: PredictionJudgment, b: PredictionJudgment): boolean {
  return a.estimate === b.estimate && a.confidence === b.confidence && (a.rationale?.trim() ?? "") === (b.rationale?.trim() ?? "");
}
export function predictionMetrics(initial: PredictionJudgment, final: PredictionJudgment, ai: number, outcome: number, range: PredictionTrial["estimateRange"]): PredictionMetrics {
  const initialError = Math.abs(initial.estimate - outcome);
  const finalError = Math.abs(final.estimate - outcome);
  const distance = ai - initial.estimate;
  const shift = final.estimate - initial.estimate;
  // Preserve raw WOA: values below 0 or above 1 are meaningful, not invalid.
  // Initial agreement provides no advice-disagreement opportunity (undefined WOA).
  const weight = distance === 0 ? null : shift / distance;
  return {
    metrics_version: "prediction-metrics-v1",
    initial_estimate: initial.estimate, initial_confidence: initial.confidence,
    final_estimate: final.estimate, final_confidence: final.confidence,
    ai_estimate: ai, outcome,
    initial_abs_error: initialError, final_abs_error: finalError,
    ai_abs_error: Math.abs(ai - outcome), error_reduction: initialError - finalError,
    normalized_error_reduction: (initialError - finalError) / (range.max - range.min),
    estimate_shift: shift, weight_of_advice: weight,
    advice_distance_initial: Math.abs(distance), advice_distance_final: Math.abs(final.estimate - ai),
    advice_movement: weight === null ? "initially_agreed" : weight === 0 ? "unchanged" : weight < 0 ? "away_from_ai" : weight > 1 ? "past_ai" : "toward_ai",
  };
}
