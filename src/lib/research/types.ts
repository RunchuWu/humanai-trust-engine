export const LEVELS = [0, 25, 50, 75, 100] as const;
export type CueLevel = (typeof LEVELS)[number];
export const DIMENSIONS = ["name", "tone", "avatar", "personality", "framing", "confidence"] as const;
export type CueDimension = (typeof DIMENSIONS)[number];
export type CueLevels = Record<CueDimension, CueLevel>;
export type Appearance = "cold" | "neutral" | "friendly";
export type Stage = "situation" | "evidence" | "recommendation" | "reflection";
export type Workflow = "constraint-v1" | "prediction-v1" | "two-part-v1";
export type Recommendation = "proceed" | "reject";
export interface PresentationConfig { appearance: Appearance; assetVersion: "avatars-v1" | "avatars-v2"; nameVersion?: "names-v1" | "names-v2"; interfaceVersion?: "cards-v1" | "cards-v2" | "cards-v3" }
export interface Profile { id: string; label: string; levels: CueLevels; presentation: PresentationConfig }
export interface SurveyItem { id: string; construct: string; text: string }
export interface StudyConfig {
  schemaVersion: 2 | 3 | 4;
  workflow?: Workflow;
  trialSet?: "pilot6" | "full16" | "twoPart12";
  title: string;
  datasetVersion: string;
  profiles: Profile[];
  userSet: { enabled: boolean; baseProfileId: string; allowedDimensions: CueDimension[] };
  trialOrder: string[];
  survey: SurveyItem[];
}
export interface StudyRecord { id: string; version: number; status: "draft" | "frozen"; createdAt: string; config: StudyConfig }
export interface ExpressionCatalog {
  names: string[];
  tones: string[];
  personalities: string[];
  confidence: string[];
  framings: { role: string; welcome: string; situation: string; evidence: string; recommendation: string; closing: string }[];
}
export interface ConstraintTrial {
  taskType?: "constraint";
  id: string; category: string; title: string; situation: string; evidence: string[];
  proposal: string; actionLabel: string; alternativeLabel: string; aiRecommendation: Recommendation;
  coreReason: string;
  expressionRefs: Record<"tone" | "personality" | "framing" | "confidence", string[]>;
}
export interface ReviewedConstraintTrial extends ConstraintTrial {
  groundTruth: Recommendation;
  answerExplanation: string;
  constraintChecks: { label: string; satisfied: boolean; explanation: string }[];
  review: { status: "pending" | "approved" | "revise"; notes: string[] };
}
export interface PredictionTrial {
  taskType: "prediction";
  id: string; category: string; title: string; situation: string;
  evidence: string[]; question: string; unit: "minutes" | "USD" | "people" | "litres";
  historyStyle?: "cards" | "bars"; historyDetails?: string[]; allowRationale?: boolean;
  estimateRange: { min: number; max: number; step: number };
  history: number[]; historyLabel: string;
  aiEstimate?: number; coreReason: string;
  expressionRefs: ConstraintTrial["expressionRefs"];
}
export interface ReviewedPredictionTrial extends PredictionTrial {
  aiEstimate: number; outcome: number; outcomeExplanation: string;
  provenance: { kind: "synthetic"; generationRule: string; uncertaintyNote: string };
  review: ReviewedConstraintTrial["review"];
}
export type Stance = "strongly_disagree" | "disagree" | "somewhat_disagree" | "neutral" | "somewhat_agree" | "agree" | "strongly_agree" | "undecided";
export interface OpenViewpoint { id: "A" | "B"; direction: "support" | "oppose"; summary: string; reason: string }
export interface OpenTrial {
  taskType: "open_judgment"; id: string; category: string; title: string; situation: string;
  question: string; proposition: string; coreReason: string;
  aiViewpoint?: Omit<OpenViewpoint, "reason">; previewViewpoints?: OpenViewpoint[];
  expressionRefs: ConstraintTrial["expressionRefs"];
}
export interface ReviewedOpenTrial extends OpenTrial { viewpoints: OpenViewpoint[]; review: ReviewedConstraintTrial["review"] }
export interface OpenJudgment { text: string; stance: Stance; confidence: number }
export function isOpen(trial: PublicTrial): trial is OpenTrial { return trial.taskType === "open_judgment"; }
export type PublicTrial = ConstraintTrial | PredictionTrial | OpenTrial;
export type ResearchTrial = ReviewedConstraintTrial | ReviewedPredictionTrial | ReviewedOpenTrial;
export function isPrediction(trial: PublicTrial): trial is PredictionTrial { return trial.taskType === "prediction"; }
export interface PredictionJudgment { estimate: number; confidence: number; rationale?: string }
export interface PredictionMetrics {
  metrics_version: "prediction-metrics-v1";
  initial_estimate: number; initial_confidence: number;
  final_estimate: number; final_confidence: number;
  ai_estimate: number; outcome: number;
  initial_abs_error: number; final_abs_error: number; ai_abs_error: number;
  error_reduction: number; normalized_error_reduction: number;
  estimate_shift: number; weight_of_advice: number | null;
  advice_distance_initial: number; advice_distance_final: number;
  advice_movement: "initially_agreed" | "unchanged" | "toward_ai" | "away_from_ai" | "past_ai";
}
export interface PublicDataset {
  workflow?: Workflow; pilotIds?: string[];
  version: string; catalog: ExpressionCatalog; openCatalog?: ExpressionCatalog; trials: PublicTrial[]; practice: PublicTrial; numericPractice?: PredictionTrial;
}
export interface ResearchDataset extends Omit<PublicDataset, "trials" | "practice"> {
  schemaVersion: 2 | 3 | 4; status: "review_required"; trials: ResearchTrial[]; practice: ResearchTrial; numericPractice?: ReviewedPredictionTrial;
}
export interface ResolvedStimulus {
  trialId: string; datasetVersion: string; levels: CueLevels; appearance: Appearance;
  interfaceVersion?: "cards-v1" | "cards-v2" | "cards-v3";
  name: string; avatarId: string; role: string; welcome: string; situationPrompt: string;
  evidencePrompt: string; recommendationPrompt: string; closing: string;
  tone: string; personality: string; confidence: string;
  aiEstimate?: number; unit?: string; viewpointId?: "A" | "B"; viewpointDirection?: "support" | "oppose"; proposition?: string;
  recommendation: string; coreReason: string; expressionIds: string[];
}
export type ResearchEventType = "session_started" | "configuration_locked" | "task_shown" | "stage_shown" | "decision" | "manipulation_check" | "initial_judgment" | "reflection";
export interface ResearchEvent extends Partial<PredictionMetrics> {
  schema_version: 2 | 3 | 4; workflow?: Workflow; event_id: string; event_type: ResearchEventType; timestamp_ms: number;
  study_id: string; config_version: number; dataset_version: string; participant_id: string; session_id: string;
  profile_id: string; config_source: "researcher_fixed" | "user_set";
  cue_levels: CueLevels; appearance: Appearance;
  trial_type?: "open_judgment" | "prediction"; part?: 1 | 2;
  initial_text?: string; final_text?: string; initial_stance?: Stance; final_stance?: Stance;
  viewpoint_id?: "A" | "B"; viewpoint_direction?: "support" | "oppose";
  stance_change?: "increased_support" | "decreased_support" | "unchanged" | "not_comparable";
  stance_alignment?: "along_ai_direction" | "against_ai_direction" | "unchanged" | "not_comparable";
  reflection_text?: string; reflection_skipped?: boolean; decision_event_id?: string;
  trial_category?: string; response_unit?: PredictionTrial["unit"];
  response_min?: number; response_max?: number; response_step?: number;
  initial_rationale?: string; final_rationale?: string;
  initial_judgment_id?: string; initial_judgment_time_ms?: number;
  trial_id?: string; trial_index?: number; stage?: Stage; exposure_id?: string;
  resolved_stimulus?: ResolvedStimulus; decision?: "accept" | "override";
  ai_reco?: Recommendation; ground_truth?: Recommendation; ai_correct?: boolean; follow_ai?: boolean; correct?: boolean;
  latency_ms?: number; thinking_time_ms?: number; client_shown_at_ms?: number;
  item_id?: string; construct?: string; item_text?: string; response_value?: number; scale_min?: 1; scale_max?: 7;
}
export interface SessionView {
  openInitial?: OpenJudgment; openAdvice?: OpenTrial; openFinal?: OpenJudgment;
  openPracticeInitial?: OpenJudgment; openPracticeAdvice?: OpenTrial; numericPracticeComplete?: boolean;
  workflow?: Workflow; initialJudgment?: PredictionJudgment; advice?: PredictionTrial;
  practiceInitial?: PredictionJudgment; practiceAdvice?: PredictionTrial;
  id: string; studyId: string; participantId: string; configVersion: number;
  mode: "fixed" | "user_set"; profile: Profile; allowedDimensions: CueDimension[];
  locked: boolean; practiceComplete: boolean; index: number; stage: Stage; status: "active" | "complete";
  order: string[]; survey: SurveyItem[];
}
