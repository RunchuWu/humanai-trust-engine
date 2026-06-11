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

export const CUE_MODULE_IDS: CueModuleId[] = [
  "agent_name",
  "tone_warmth",
  "avatar",
  "personality",
  "confidence_explanation",
];

export const CUE_MODULE_LABELS: Record<CueModuleId, string> = {
  agent_name: "Agent name",
  tone_warmth: "Warm tone",
  avatar: "Avatar",
  personality: "Personality framing",
  confidence_explanation: "Confidence/explanation",
};

export const AGENT_NAME_OPTIONS = ["Atlas", "Nova", "Scout"] as const;
export const AGENT_TONE_OPTIONS: AgentTone[] = ["neutral", "warm"];
export const AGENT_PERSONALITY_OPTIONS: AgentPersonality[] = [
  "precise",
  "supportive",
  "calm",
];

export function createAgentCueConfig(
  name: string,
  tone: AgentTone,
  personality: AgentPersonality,
): AgentCueConfig {
  return {
    name,
    tone,
    personality,
    avatarLabel: name.slice(0, 2).toUpperCase(),
  };
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

export function applyCueModuleOverride(
  condition: ConditionConfig,
  enabledCuesOverride: CueModuleId[] | null,
): ConditionConfig {
  if (!enabledCuesOverride) {
    return condition;
  }

  return {
    ...condition,
    enabledCues: enabledCuesOverride,
  };
}

export function getCueModuleSummary(condition: ConditionConfig): string {
  if (condition.enabledCues.length === 0) {
    return "none";
  }

  return condition.enabledCues.join(", ");
}

export function getResolvedAgentConfig(
  condition: ConditionConfig,
  userAgentConfig: AgentCueConfig | null,
): AgentCueConfig {
  if (condition.cueSource === "user_set" && userAgentConfig) {
    return userAgentConfig;
  }

  return condition.agent;
}

export function getPersonalityLabel(personality: AgentPersonality): string {
  if (personality === "supportive") {
    return "Supportive operator assistant";
  }

  if (personality === "calm") {
    return "Calm risk monitor";
  }

  return "Precise system analyst";
}

export function getRationaleForCondition(
  trial: Trial,
  condition: ConditionConfig,
  agent: AgentCueConfig | null = null,
): string {
  if (condition.cueSource === "control") {
    return trial.rationale_control;
  }

  if (hasCue(condition, "tone_warmth") && agent?.tone === "neutral") {
    return trial.rationale_control;
  }

  return trial.rationale_warm;
}
