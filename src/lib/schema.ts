export type ConditionId =
  | "control"
  | "industry_set"
  | "user_set"
  | "A"
  | "B";
export type EventType = "task_shown" | "decision";
export type DecisionType = "accept" | "override";
export type Recommendation = "proceed" | "reject";
export type CueSource = "control" | "industry_set" | "user_set";
export type CueModuleId =
  | "agent_name"
  | "tone_warmth"
  | "avatar"
  | "personality"
  | "confidence_explanation";
export type AgentTone = "neutral" | "warm";
export type AgentPersonality = "precise" | "supportive" | "calm";

interface BaseEvent {
  event_id: string;
  participant_id: string;
  condition_id: ConditionId;
  session_id: string;
  event_type: EventType;
  timestamp_ms: number;
}

export interface TaskShownEvent extends BaseEvent {
  event_type: "task_shown";
  trial_id: string;
  trial_index: number;
}

export interface DecisionEvent extends BaseEvent {
  event_type: "decision";
  trial_id: string;
  trial_index: number;
  decision: DecisionType;
  latency_ms: number;
  ai_reco: Recommendation;
  ground_truth: Recommendation;
  follow_ai: boolean;
  ai_correct: boolean;
  cue_source?: CueSource;
  cue_modules?: CueModuleId[];
  agent_name?: string;
  agent_tone?: AgentTone;
  agent_personality?: AgentPersonality;
  agent_avatar_label?: string;
}

export type EventUnion = TaskShownEvent | DecisionEvent;

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

function isConditionId(value: unknown): value is ConditionId {
  return (
    value === "control" ||
    value === "industry_set" ||
    value === "user_set" ||
    value === "A" ||
    value === "B"
  );
}

function isDecisionType(value: unknown): value is DecisionType {
  return value === "accept" || value === "override";
}

function isRecommendation(value: unknown): value is Recommendation {
  return value === "proceed" || value === "reject";
}

function isCueSource(value: unknown): value is CueSource {
  return value === "control" || value === "industry_set" || value === "user_set";
}

function isCueModuleId(value: unknown): value is CueModuleId {
  return (
    value === "agent_name" ||
    value === "tone_warmth" ||
    value === "avatar" ||
    value === "personality" ||
    value === "confidence_explanation"
  );
}

function isCueModuleArray(value: unknown): value is CueModuleId[] {
  return Array.isArray(value) && value.every((item) => isCueModuleId(item));
}

function isAgentTone(value: unknown): value is AgentTone {
  return value === "neutral" || value === "warm";
}

function isAgentPersonality(value: unknown): value is AgentPersonality {
  return value === "precise" || value === "supportive" || value === "calm";
}

function validateBaseFields(e: Record<string, unknown>): ValidationResult {
  if (!isUuid(e.event_id)) {
    return { ok: false, error: "event_id must be a UUID string" };
  }

  if (!isUuid(e.participant_id)) {
    return { ok: false, error: "participant_id must be a UUID string" };
  }

  if (!isConditionId(e.condition_id)) {
    return {
      ok: false,
      error:
        "condition_id must be 'control', 'industry_set', 'user_set', or legacy 'A'/'B'",
    };
  }

  if (!isUuid(e.session_id)) {
    return { ok: false, error: "session_id must be a UUID string" };
  }

  if (e.event_type !== "task_shown" && e.event_type !== "decision") {
    return { ok: false, error: "event_type must be 'task_shown' or 'decision'" };
  }

  if (!isNumber(e.timestamp_ms)) {
    return { ok: false, error: "timestamp_ms must be a finite number" };
  }

  if (!isString(e.trial_id) || e.trial_id.length === 0) {
    return { ok: false, error: "trial_id must be a non-empty string" };
  }

  if (!isInteger(e.trial_index) || e.trial_index < 0) {
    return { ok: false, error: "trial_index must be a non-negative integer" };
  }

  return { ok: true };
}

function validateTaskShownEvent(e: Record<string, unknown>): ValidationResult {
  const base = validateBaseFields(e);
  if (!base.ok) {
    return base;
  }

  return { ok: true };
}

function validateDecisionEvent(e: Record<string, unknown>): ValidationResult {
  const base = validateBaseFields(e);
  if (!base.ok) {
    return base;
  }

  if (!isDecisionType(e.decision)) {
    return { ok: false, error: "decision must be 'accept' or 'override'" };
  }

  if (!isNumber(e.latency_ms) || e.latency_ms < 0) {
    return { ok: false, error: "latency_ms must be a non-negative number" };
  }

  if (!isRecommendation(e.ai_reco)) {
    return { ok: false, error: "ai_reco must be 'proceed' or 'reject'" };
  }

  if (!isRecommendation(e.ground_truth)) {
    return { ok: false, error: "ground_truth must be 'proceed' or 'reject'" };
  }

  if (typeof e.follow_ai !== "boolean") {
    return { ok: false, error: "follow_ai must be a boolean" };
  }

  if (typeof e.ai_correct !== "boolean") {
    return { ok: false, error: "ai_correct must be a boolean" };
  }

  if (e.cue_source !== undefined && !isCueSource(e.cue_source)) {
    return {
      ok: false,
      error: "cue_source must be 'control', 'industry_set', or 'user_set'",
    };
  }

  if (e.cue_modules !== undefined && !isCueModuleArray(e.cue_modules)) {
    return { ok: false, error: "cue_modules must be an array of cue ids" };
  }

  if (e.agent_name !== undefined && !isString(e.agent_name)) {
    return { ok: false, error: "agent_name must be a string" };
  }

  if (e.agent_tone !== undefined && !isAgentTone(e.agent_tone)) {
    return { ok: false, error: "agent_tone must be 'neutral' or 'warm'" };
  }

  if (
    e.agent_personality !== undefined &&
    !isAgentPersonality(e.agent_personality)
  ) {
    return {
      ok: false,
      error: "agent_personality must be 'precise', 'supportive', or 'calm'",
    };
  }

  if (e.agent_avatar_label !== undefined && !isString(e.agent_avatar_label)) {
    return { ok: false, error: "agent_avatar_label must be a string" };
  }

  const expectedFollowAi = e.decision === "accept";
  if (e.follow_ai !== expectedFollowAi) {
    return {
      ok: false,
      error: "follow_ai must match decision (accept=true, override=false)",
    };
  }

  const expectedAiCorrect = e.ai_reco === e.ground_truth;
  if (e.ai_correct !== expectedAiCorrect) {
    return {
      ok: false,
      error: "ai_correct must match ai_reco === ground_truth",
    };
  }

  return { ok: true };
}

export function validateEvent(e: unknown): ValidationResult {
  if (!isObject(e)) {
    return { ok: false, error: "event must be an object" };
  }

  if (e.event_type === "task_shown") {
    return validateTaskShownEvent(e);
  }

  if (e.event_type === "decision") {
    return validateDecisionEvent(e);
  }

  return { ok: false, error: "event_type must be 'task_shown' or 'decision'" };
}
