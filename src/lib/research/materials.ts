import "server-only";
import bank from "../../../data/stimuli/everyday-two-part-en-v1.json";
import mixedBank from "../../../data/stimuli/everyday-prediction-en-v2.json";
import timeBank from "../../../data/stimuli/everyday-prediction-en-v1.json";
import constraintBank from "../../../data/stimuli/everyday-en-v1.json";
import { isOpen, isPrediction, type OpenViewpoint, type ReviewedOpenTrial, type PublicDataset, type PublicTrial, type ResearchDataset, type ResearchTrial } from "./types";

export const dataset = bank as ResearchDataset;
export function datasetForVersion(version: string): ResearchDataset | undefined {
  if (version === bank.version) return bank as ResearchDataset;
  if (version === mixedBank.version) return mixedBank as ResearchDataset;
  if (version === timeBank.version) return timeBank as ResearchDataset;
  if (version === constraintBank.version) return constraintBank as ResearchDataset;
}
export function publicTrial(trial: ResearchTrial, includeAdvice = false, viewpointId: "A" | "B" = "A"): PublicTrial {
  if (isOpen(trial)) {
    const chosen = (trial as ReviewedOpenTrial).viewpoints.find(v => v.id === viewpointId)!;
    return { taskType: "open_judgment", id: trial.id, category: trial.category, title: trial.title,
      situation: trial.situation, question: trial.question, proposition: trial.proposition,
      expressionRefs: trial.expressionRefs, coreReason: includeAdvice ? chosen.reason : "",
      ...(includeAdvice ? { aiViewpoint: {id: chosen.id, direction: chosen.direction, summary: chosen.summary} } : {}) };
  }
  if (isPrediction(trial)) {
    return {
      taskType: "prediction", id: trial.id, category: trial.category, title: trial.title,
      situation: trial.situation, evidence: trial.evidence, question: trial.question,
      unit: trial.unit, estimateRange: trial.estimateRange, history: trial.history,
      historyStyle: trial.historyStyle, historyDetails: trial.historyDetails, allowRationale: trial.allowRationale,
      historyLabel: trial.historyLabel, expressionRefs: trial.expressionRefs,
      coreReason: includeAdvice ? trial.coreReason : "",
      ...(includeAdvice ? { aiEstimate: trial.aiEstimate } : {}),
    };
  }
  return { id: trial.id, category: trial.category, title: trial.title, situation: trial.situation, evidence: trial.evidence, proposal: trial.proposal, actionLabel: trial.actionLabel, alternativeLabel: trial.alternativeLabel, aiRecommendation: trial.aiRecommendation, coreReason: trial.coreReason, expressionRefs: trial.expressionRefs };
}
export function projectDataset(materials: ResearchDataset, includeAdvice = false): PublicDataset {
  return { version: materials.version, workflow: materials.workflow, pilotIds: materials.pilotIds, catalog: materials.catalog, openCatalog: materials.openCatalog,
    trials: materials.trials.map(t => {
      const result = publicTrial(t, includeAdvice);
      return isOpen(t) && includeAdvice ? { ...result, previewViewpoints: (t as ReviewedOpenTrial).viewpoints as OpenViewpoint[] } : result;
    }), practice: publicTrial(materials.practice, includeAdvice),
    ...(materials.numericPractice ? {numericPractice: publicTrial(materials.numericPractice, includeAdvice) as PublicDataset["numericPractice"]} : {}) };
}
export function publicDataset(includeAdvice = false): PublicDataset { return projectDataset(dataset, includeAdvice); }
