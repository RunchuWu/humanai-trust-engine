"use client";
import { usePreviewDraft } from "./PreviewDrafts";
import { validJudgment } from "@/lib/research/prediction";
import type { PredictionJudgment, PredictionTrial } from "@/lib/research/types";
import styles from "./research.module.css";

export default function JudgmentForm({ trial, phase, initial, disabled, onSubmit }: {
  trial: PredictionTrial; phase: "initial" | "final"; initial?: PredictionJudgment;
  disabled: boolean; onSubmit: (judgment: PredictionJudgment) => void;
}) {
  const [estimate, setEstimate] = usePreviewDraft(`${trial.id}:${phase}:estimate`, "");
  const [confidence, setConfidence] = usePreviewDraft<number | null>(`${trial.id}:${phase}:confidence`, null);
  const [rationale, setRationale] = usePreviewDraft(`${trial.id}:${phase}:rationale`, "");
  const judgment = { estimate: estimate.trim() ? Number(estimate) : NaN, confidence, ...(trial.allowRationale && rationale.trim() ? { rationale: rationale.trim() } : {}) };
  const valid = validJudgment(judgment, trial);
  return <form className={styles.judgmentForm} onSubmit={event => {
    event.preventDefault();
    if (!disabled && validJudgment(judgment, trial)) onSubmit(judgment);
  }}>
    {initial ? <p className={styles.initialSummary} data-testid="initial-summary">Your initial estimate: <strong>{initial.estimate} {trial.unit}</strong> · your confidence: {initial.confidence}/7. You may keep or change your estimate.</p> : null}
    <label className={styles.estimateLabel}>Your {phase} estimate
      <span><input aria-label={`Your ${phase} estimate`} type="number" inputMode={trial.estimateRange.step < 1 ? "decimal" : "numeric"} required min={trial.estimateRange.min} max={trial.estimateRange.max} step={trial.estimateRange.step} value={estimate} onChange={event => setEstimate(event.target.value)} /><span>{trial.unit}</span></span>
    </label>
    <p className={styles.helper}>Enter {trial.estimateRange.step === 1 ? "a whole number" : `a number in steps of ${trial.estimateRange.step}`} from {trial.estimateRange.min} to {trial.estimateRange.max} {trial.unit}. {phase === "initial" ? "Your estimate will be saved before you see AI advice." : "Your final estimate can differ from both your initial estimate and the AI estimate."}</p>
    <fieldset className={styles.judgmentConfidence}>
      <legend>How confident are you that your {phase} estimate is close to the actual {trial.unit === "minutes" ? "duration" : "value"}?</legend>
      <p>1 = Not at all confident · 7 = Very confident</p>
      <div className={styles.rating}>{[1, 2, 3, 4, 5, 6, 7].map(value => <label key={value}>
        <input type="radio" name={`${phase}-confidence`} value={value} checked={confidence === value} onChange={() => setConfidence(value)} required /><span>{value}</span>
      </label>)}</div>
    </fieldset>
    {trial.allowRationale ? <label className={styles.rationaleLabel}>What informed your {phase} estimate? <span>(optional)</span>
      <textarea aria-label={`Your ${phase} reasoning (optional)`} maxLength={300} rows={2} value={rationale} onChange={event => setRationale(event.target.value)} placeholder="A short reason or assumption is enough. Please avoid personal information." />
      <small>{rationale.length}/300 characters</small>
    </label> : null}
    <button type="submit" className={styles.primary} disabled={disabled || !valid}>{phase === "initial" ? "Save initial estimate" : "Save final estimate"}</button>
  </form>;
}
