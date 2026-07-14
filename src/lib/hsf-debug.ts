import type { ConditionConfig, CueModuleId } from "@/lib/cue-config";
import type { Trial } from "@/lib/trials";

export type HsfDimension =
  | "appearance"
  | "communication"
  | "behavior"
  | "relationality"
  | "agency";

export interface HsfDimensionDebugInfo {
  dimension: HsfDimension;
  label: string;
  cueModules: CueModuleId[];
}

export interface HsfTrialDebugInfo {
  trialId: string;
  aiCorrect: boolean;
  confidence: number;
  confidenceVisible: boolean;
}

export interface HsfDebugSnapshot {
  conditionDimensions: HsfDimensionDebugInfo[];
  trial: HsfTrialDebugInfo | null;
}

export const HSF_DIMENSION_LABELS: Record<HsfDimension, string> = {
  appearance: "Appearance",
  communication: "Communication",
  behavior: "Behavior",
  relationality: "Relationality",
  agency: "Agency",
};

const CONDITION_DIMENSION_CUES: Record<
  Exclude<HsfDimension, "behavior">,
  CueModuleId[]
> = {
  appearance: ["avatar"],
  communication: ["agent_name", "tone_warmth", "confidence_explanation"],
  relationality: ["tone_warmth", "personality"],
  agency: ["agent_name", "personality"],
};

/**
 * Maps the current cue modules to the provisional HSF interpretation used in
 * the research docs. This is for researcher debug display only: it does not
 * create an HSF condition or add metadata to participant events and exports.
 */
export function getHsfDebugSnapshot(
  condition: ConditionConfig,
  trial: Trial | null,
): HsfDebugSnapshot {
  const conditionDimensions = (
    Object.entries(CONDITION_DIMENSION_CUES) as Array<
      [Exclude<HsfDimension, "behavior">, CueModuleId[]]
    >
  )
    .map(([dimension, cueModules]) => ({
      dimension,
      label: HSF_DIMENSION_LABELS[dimension],
      cueModules: cueModules.filter((cueModule) =>
        condition.enabledCues.includes(cueModule),
      ),
    }))
    .filter(({ cueModules }) => cueModules.length > 0);

  return {
    conditionDimensions,
    trial: trial
      ? {
          trialId: trial.trial_id,
          aiCorrect: trial.ai_reco === trial.ground_truth,
          confidence: trial.confidence,
          confidenceVisible: condition.enabledCues.includes(
            "confidence_explanation",
          ),
        }
      : null,
  };
}
