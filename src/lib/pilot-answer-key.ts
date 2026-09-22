import "server-only";

import { PILOT_TRIALS } from "@/lib/pilot-content";

// Provisional research labels. A human research review is required before
// inviting external participants or interpreting correctness as ground truth.
const CORRECT_ACTION_BY_TRIAL: Record<string, "action" | "alternative"> = {
  ops_01: "action", ops_02: "alternative", ops_03: "action",
  ops_04: "action", ops_05: "alternative", ops_06: "alternative",
  ops_07: "alternative", ops_08: "alternative", ops_09: "action",
  ops_10: "action", ops_13: "alternative", ops_15: "action",
};

export function getPilotAnswer(trialId: string) {
  const trial = PILOT_TRIALS.find((item) => item.id === trialId);
  const correctAction = CORRECT_ACTION_BY_TRIAL[trialId];
  if (!trial || !correctAction) return null;
  return { trial, correctAction, aiCorrect: trial.aiChoice === correctAction };
}
