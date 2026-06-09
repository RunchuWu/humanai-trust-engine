import type { ConditionId } from "@/lib/conditions";
import type { Trial } from "@/lib/trials";

export type CueSource = "control" | "industry_set" | "user_set";

export type CueModuleId =
  | "agent_name"
  | "tone_warmth"
  | "avatar"
  | "personality"
  | "confidence_explanation";

export type AgentTone = "neutral" | "warm";

export type AgentPersonality = "precise" | "supportive" | "calm";

export interface AgentCueConfig {
  name: string;
  tone: AgentTone;
  personality: AgentPersonality;
  avatarLabel: string;
}

export interface ConditionConfig {
  conditionId: ConditionId;
  cueSource: CueSource;
  label: string;
  enabledCues: CueModuleId[];
  agent: AgentCueConfig;
}

export const CONDITION_CONFIGS: Record<ConditionId, ConditionConfig> = {
  control: {
    conditionId: "control",
    cueSource: "control",
    label: "Control: plain system",
    enabledCues: [],
    agent: {
      name: "System",
      tone: "neutral",
      personality: "precise",
      avatarLabel: "SYS",
    },
  },
  industry_set: {
    conditionId: "industry_set",
    cueSource: "industry_set",
    label: "Industry-set: manufacturer configured cues",
    enabledCues: [
      "agent_name",
      "tone_warmth",
      "avatar",
      "personality",
      "confidence_explanation",
    ],
    agent: {
      name: "Atlas",
      tone: "warm",
      personality: "calm",
      avatarLabel: "AT",
    },
  },
  user_set: {
    conditionId: "user_set",
    cueSource: "user_set",
    label: "User-set: participant configured cues",
    enabledCues: [
      "agent_name",
      "tone_warmth",
      "avatar",
      "personality",
      "confidence_explanation",
    ],
    agent: {
      name: "Nova",
      tone: "warm",
      personality: "supportive",
      avatarLabel: "NV",
    },
  },
};

export const CONDITION_IDS = Object.keys(CONDITION_CONFIGS) as ConditionId[];

export function getConditionConfig(conditionId: ConditionId): ConditionConfig {
  return CONDITION_CONFIGS[conditionId];
}

export function hasCue(
  condition: ConditionConfig,
  cueModuleId: CueModuleId,
): boolean {
  return condition.enabledCues.includes(cueModuleId);
}

export function getCueModuleSummary(condition: ConditionConfig): string {
  if (condition.enabledCues.length === 0) {
    return "none";
  }

  return condition.enabledCues.join(", ");
}

export function getRationaleForCondition(
  trial: Trial,
  condition: ConditionConfig,
): string {
  if (condition.cueSource === "control") {
    return trial.rationale_control;
  }

  return trial.rationale_warm;
}
