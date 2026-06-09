export type Recommendation = "proceed" | "reject";
export type RevealStage = "situation" | "evidence" | "ai";

export type ExperimentScreen =
  | "welcome"
  | "consent"
  | "instructions"
  | "comprehension_check"
  | "practice_trial"
  | "main_task"
  | "debrief";

export interface PracticeTrial {
  scenario_title: string;
  situation: string;
  evidence: string[];
  action_label: string;
  opposite_action_label: string;
  ai_reco: Recommendation;
  rationale: string;
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
  scenario_title: "Practice Drone Route Check",
  situation:
    "You are supervising a delivery drone approaching a light rain band on a routine route.",
  evidence: [
    "Rain intensity: light",
    "Battery on arrival: 42%",
    "No temporary airspace restrictions detected",
  ],
  action_label: "Continue planned route",
  opposite_action_label: "Hold position",
  ai_reco: "proceed",
  rationale:
    "The route remains within normal weather and battery operating limits.",
};

interface RecommendationLabels {
  action_label: string;
  opposite_action_label: string;
}

export function formatRecommendation(
  recommendation: Recommendation,
  labels?: RecommendationLabels,
): string {
  if (labels) {
    return recommendation === "proceed"
      ? labels.action_label
      : labels.opposite_action_label;
  }

  return recommendation === "proceed" ? "Proceed" : "Do not proceed";
}

export function formatRecommendationShort(
  recommendation: Recommendation,
  labels?: RecommendationLabels,
): string {
  if (labels) {
    return recommendation === "proceed"
      ? labels.action_label
      : labels.opposite_action_label;
  }

  return recommendation === "proceed" ? "Proceed" : "Do not proceed";
}

export function formatOppositeRecommendationShort(
  recommendation: Recommendation,
  labels?: RecommendationLabels,
): string {
  if (labels) {
    return recommendation === "proceed"
      ? labels.opposite_action_label
      : labels.action_label;
  }

  return recommendation === "proceed" ? "Reject" : "Proceed";
}
