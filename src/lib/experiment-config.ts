import type { ConditionId } from "@/lib/conditions";

export type Recommendation = "proceed" | "reject";
export type RevealStage = "job" | "candidate" | "ai";

export type ExperimentScreen =
  | "welcome"
  | "consent"
  | "instructions"
  | "comprehension_check"
  | "practice_trial"
  | "main_task"
  | "debrief";

export interface PracticeTrial {
  job_title: string;
  requirements: string[];
  candidate_summary: string;
  ai_reco: Recommendation;
  rationale: string;
}

export interface ConditionCue {
  agentName: string;
  tone: "formal" | "conversational";
}

export const SCREEN_SEQUENCE: ExperimentScreen[] = [
  "welcome",
  "consent",
  "instructions",
  "comprehension_check",
  "practice_trial",
  "main_task",
  "debrief",
];

export const PRACTICE_TRIAL: PracticeTrial = {
  job_title: "Operations Coordinator",
  requirements: [
    "Calendar coordination",
    "Vendor communication",
    "Process documentation",
  ],
  candidate_summary:
    "2 years coordinating internal schedules, handling vendor messages, and maintaining team process notes.",
  ai_reco: "proceed",
  rationale:
    "The candidate has direct experience with the coordination and documentation tasks listed for the role.",
};

export const CONDITION_CUES: Record<ConditionId, ConditionCue> = {
  A: {
    agentName: "Assistant",
    tone: "formal",
  },
  B: {
    agentName: "Mia",
    tone: "conversational",
  },
};

export function formatRecommendation(recommendation: Recommendation): string {
  return recommendation === "proceed"
    ? "Proceed with this candidate"
    : "Reject this candidate";
}

export function formatRecommendationShort(recommendation: Recommendation): string {
  return recommendation === "proceed" ? "Proceed" : "Reject";
}
