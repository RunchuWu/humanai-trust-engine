import type { OpenJudgment, OpenTrial, OpenViewpoint, ResearchEvent, Stance } from "./types";
export const STANCES: Array<{ value: Stance; label: string }> = [
  {value:"strongly_disagree",label:"Strongly disagree"}, {value:"disagree",label:"Disagree"},
  {value:"somewhat_disagree",label:"Somewhat disagree"}, {value:"neutral",label:"Neither agree nor disagree"},
  {value:"somewhat_agree",label:"Somewhat agree"}, {value:"agree",label:"Agree"},
  {value:"strongly_agree",label:"Strongly agree"}, {value:"undecided",label:"Not ready to judge"},
];
export function validOpenJudgment(value: unknown): value is OpenJudgment {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.text === "string" && v.text.trim().length >= 10 && v.text.length <= 1200 &&
    STANCES.some(s => s.value === v.stance) && typeof v.confidence === "number" && Number.isInteger(v.confidence) && v.confidence >= 1 && v.confidence <= 7;
}
export function cleanOpenJudgment(v: OpenJudgment): OpenJudgment { return {text:v.text.trim(), stance:v.stance, confidence:v.confidence}; }
export function sameOpenJudgment(a: OpenJudgment, b: OpenJudgment) { return a.text.trim()===b.text.trim() && a.stance===b.stance && a.confidence===b.confidence; }
export function stanceMovement(initial: Stance, final: Stance, direction: "support" | "oppose"): Pick<ResearchEvent,"stance_change" | "stance_alignment"> {
  if (initial === "undecided" || final === "undecided") return {stance_change:"not_comparable",stance_alignment:"not_comparable"};
  const shift = Math.sign(STANCES.findIndex(s=>s.value===final)-STANCES.findIndex(s=>s.value===initial));
  return {stance_change:shift===0?"unchanged":shift>0?"increased_support":"decreased_support",stance_alignment:shift===0?"unchanged":shift===(direction==="support"?1:-1)?"along_ai_direction":"against_ai_direction"};
}
export function previewOpenTrial(trial: OpenTrial, id: OpenViewpoint["id"]): OpenTrial {
  const v = trial.previewViewpoints?.find(v=>v.id===id);
  return v ? {...trial, coreReason:v.reason, aiViewpoint:{id:v.id,direction:v.direction,summary:v.summary}} : trial;
}
