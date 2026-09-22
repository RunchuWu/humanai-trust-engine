import { DIMENSIONS, LEVELS, isOpen, isPrediction, type Appearance, type CueDimension, type CueLevel, type Profile, type PublicDataset, type PublicTrial, type ResolvedStimulus, type StudyConfig, type SurveyItem } from "./types";

export const DATASET_VERSION = "everyday-two-part-en-v1";
export const MIXED_DATASET_VERSION = "everyday-prediction-en-v2";
export const TWO_PART_IDS = ["judgment_01", "judgment_02", "judgment_03", "judgment_04", "price_01", "attendance_01", "consumption_01", "time_01", "price_02", "attendance_02", "consumption_02", "time_02"];
export const TIME_DATASET_VERSION = "everyday-prediction-en-v1";
export const isPredictionVersion = (version: unknown) => version === MIXED_DATASET_VERSION || version === TIME_DATASET_VERSION;
export const LEGACY_DATASET_VERSION = "everyday-en-v1";
export const PILOT_IDS = ["price_01", "attendance_01", "consumption_01", "time_01", "price_02", "attendance_02"];
export const pilotIdsForVersion = (version: unknown) => version === TIME_DATASET_VERSION ? ["forecast_01", "forecast_02", "forecast_03", "forecast_04", "forecast_05", "forecast_10"] : PILOT_IDS;
export const DIMENSION_LABELS: Record<CueDimension, string> = { name: "Agent name", tone: "Tone", avatar: "Avatar", personality: "Personality", framing: "Framing", confidence: "Confidence" };
export const ANCHORS: Record<CueDimension, string[]> = {
  name: ["Assistant", "AI Assistant", "Alex", "Sarah", "Your Companion"],
  tone: ["Report-like", "Polite / distant", "Natural", "Warm", "Friendly"],
  avatar: ["System mark", "Abstract assistant", "Person silhouette", "Illustrated person", "Friendly expression"],
  personality: ["Task-focused", "Methodical", "Calm", "Supportive", "Encouraging"],
  framing: ["Information tool", "Task assistant", "Decision assistant", "Collaborative partner", "Companion"],
  confidence: ["Tentative", "Leaning", "Clear", "Confident", "Firm"],
};
export const LEGACY_SURVEY: SurveyItem[] = [
  { id: "humanlike_01", construct: "humanlikeness", text: "The assistant's presentation felt humanlike." },
  { id: "warmth_01", construct: "warmth", text: "The assistant communicated in a warm way." },
  { id: "closeness_01", construct: "closeness", text: "I felt a sense of closeness to the assistant." },
  { id: "confidence_01", construct: "confidence", text: "The assistant sounded certain about its recommendations." },
  { id: "clarity_01", construct: "clarity", text: "The assistant's messages were clear and easy to understand." },
  { id: "trust_01", construct: "trust", text: "I would be willing to rely on this assistant's recommendations." },
];
export const PERSONAL_NAMES = ["Assistant", "AI Assistant", "Alex", "Sam", "Sarah"];
export function namesForProfile(dataset: PublicDataset, profile: Profile): string[] { return profile.presentation.nameVersion === "names-v2" ? PERSONAL_NAMES : dataset.catalog.names; }
export const APPEARANCE_LABELS: Record<Appearance, string> = { cold: "Cold", neutral: "Neutral", friendly: "Warm" };
export function preset(appearance: Appearance, redesigned = true): Profile {
  const level: CueLevel = appearance === "cold" ? 0 : appearance === "neutral" ? 50 : 100;
  return { id: appearance, label: redesigned ? APPEARANCE_LABELS[appearance] : appearance[0].toUpperCase() + appearance.slice(1), levels: { name: level, tone: level, avatar: level, personality: level, framing: level, confidence: 50 }, presentation: { appearance, assetVersion: redesigned ? "avatars-v2" : "avatars-v1", ...(redesigned ? { interfaceVersion: "cards-v3" as const, nameVersion: "names-v2" as const } : {}) } };
}
export const TIME_SURVEY: SurveyItem[] = [
  ...LEGACY_SURVEY.map(item => ({ ...item, text: item.text.replaceAll("recommendations", "estimates") })),
  { id: "capability_01", construct: "capability", text: "The assistant seemed capable of estimating these durations." },
  { id: "reliability_01", construct: "reliability", text: "I expected the assistant's estimates to be reasonably close to actual durations." },
];
export const SURVEY: SurveyItem[] = TIME_SURVEY.map(item => ({ ...item, text: item.text.replace("these durations", "these quantities").replace("actual durations", "actual values") }));
export const TWO_PART_SURVEY: SurveyItem[] = [
  ...LEGACY_SURVEY.map(item => ({...item, text: item.text.replace("recommendations", "views and estimates")})),
  { id: "consideration_01", construct: "consideration", text: "The assistant's reasoning was worth considering, even where I disagreed." },
  { id: "autonomy_01", construct: "autonomy", text: "I felt free to disagree with the assistant." },
];
const surveyForVersion = (version: unknown) => version === DATASET_VERSION ? TWO_PART_SURVEY : version === MIXED_DATASET_VERSION ? SURVEY : version === TIME_DATASET_VERSION ? TIME_SURVEY : LEGACY_SURVEY;
export function defaultStudy(trialIds: string[], version = DATASET_VERSION): StudyConfig {
  const prediction = isPredictionVersion(version);
  const combined = version === DATASET_VERSION;
  return {
    schemaVersion: combined ? 4 : prediction ? 3 : 2,
    ...(combined ? { workflow: "two-part-v1" as const, trialSet: "twoPart12" as const } : {}),
    ...(prediction ? { workflow: "prediction-v1" as const, trialSet: "pilot6" as const } : {}),
    title: combined ? "Everyday judgments & forecasts · two parts" : prediction ? "Everyday forecasts · before & after AI" : "Everyday decisions · five-level cues",
    datasetVersion: version,
    profiles: [preset("cold", combined), preset("neutral", combined), preset("friendly", combined)],
    userSet: { enabled: false, baseProfileId: "neutral", allowedDimensions: ["name", "tone", "avatar", "personality", "framing"] },
    trialOrder: combined ? TWO_PART_IDS.filter(id => trialIds.includes(id)) : prediction ? pilotIdsForVersion(version).filter(id => trialIds.includes(id)) : trialIds,
    survey: surveyForVersion(version),
  };
}
function object(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
export function isLevels(value: unknown): value is Profile["levels"] {
  return object(value) && Object.keys(value).length === 6 && DIMENSIONS.every((id) => LEVELS.includes(value[id] as CueLevel));
}
export function validateStudy(value: unknown, ids: string[]): string | null {
  if (!object(value)) return "Invalid configuration.";
  const prediction = isPredictionVersion(value.datasetVersion);
  const combined = value.datasetVersion === DATASET_VERSION;
  if (combined ? value.schemaVersion !== 4 || value.workflow !== "two-part-v1" || value.trialSet !== "twoPart12" : prediction ? value.schemaVersion !== 3 || value.workflow !== "prediction-v1" || !["pilot6", "full16"].includes(String(value.trialSet)) : value.schemaVersion !== 2 || value.datasetVersion !== LEGACY_DATASET_VERSION) return "Unsupported configuration or dataset version.";
  const survey = surveyForVersion(value.datasetVersion);
  const selectedIds = combined ? TWO_PART_IDS : prediction && value.trialSet === "pilot6" ? pilotIdsForVersion(value.datasetVersion) : ids;
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 160) return "Use a study title of 1–160 characters.";
  if (!Array.isArray(value.profiles) || value.profiles.length !== 3) return "Provide three fixed profiles.";
  const profileIds = new Set<string>();
  for (const p of value.profiles) {
    if (!object(p) || typeof p.id !== "string" || !/^[a-z][a-z0-9_-]{0,39}$/.test(p.id) || profileIds.has(p.id) || typeof p.label !== "string" || !p.label.trim() || p.label.length > 80 || !isLevels(p.levels)) return "Invalid profile ID, label, or five-level cue values.";
    if (!object(p.presentation) || !["cold", "neutral", "friendly"].includes(String(p.presentation.appearance)) || !["avatars-v1", "avatars-v2"].includes(String(p.presentation.assetVersion)) || (p.presentation.interfaceVersion !== undefined && !["cards-v1", "cards-v2", "cards-v3"].includes(String(p.presentation.interfaceVersion)))) return "Invalid presentation.";
    if (p.presentation.nameVersion !== undefined && !["names-v1", "names-v2"].includes(String(p.presentation.nameVersion))) return "Invalid name catalog.";
    if ((prediction || combined) && p.levels.confidence !== 50) return "Hold AI certainty at 50 across all prediction profiles.";
    profileIds.add(p.id);
  }
  const u = value.userSet;
  if (!object(u) || typeof u.enabled !== "boolean" || !profileIds.has(String(u.baseProfileId)) || !Array.isArray(u.allowedDimensions) || new Set(u.allowedDimensions).size !== u.allowedDimensions.length || u.allowedDimensions.some((d) => !DIMENSIONS.includes(d as CueDimension))) return "Invalid participant customization permissions.";
  if ((prediction || combined) && u.allowedDimensions.includes("confidence")) return "AI certainty cannot be customized in this prediction pilot.";
  if (!Array.isArray(value.trialOrder) || value.trialOrder.length !== selectedIds.length || new Set(value.trialOrder).size !== selectedIds.length || value.trialOrder.some((id) => !selectedIds.includes(String(id)))) return "Trial order must contain every item in the selected set exactly once.";
  if (combined && (value.trialOrder as string[]).some((id, index) => id.startsWith("judgment_") !== (index < 4))) return "Keep all four open judgments in Part 1, followed by eight numeric predictions in Part 2.";
  if (!Array.isArray(value.survey) || value.survey.length !== survey.length || value.survey.some((item, index) => !object(item) || item.id !== survey[index].id || item.construct !== survey[index].construct || typeof item.text !== "string" || !item.text.trim() || item.text.length > 300)) return "Provide all versioned survey items with their stable IDs and constructs.";
  return null;
}
export function resolveStimulus(dataset: PublicDataset, trial: PublicTrial, profile: Profile): ResolvedStimulus {
  const l = profile.levels, c = isOpen(trial) ? dataset.openCatalog ?? dataset.catalog : dataset.catalog;
  const index = (id: "tone" | "personality" | "framing" | "confidence") => {
    const ref = trial.expressionRefs[id][l[id] / 25];
    const n = Number(ref.split(":")[1]);
    if (!Number.isInteger(n) || n < 0 || n > 4 || !ref.startsWith(`${id}:`)) throw new Error(`Missing expression ${trial.id}/${id}`);
    return n;
  };
  const frame = c.framings[index("framing")];
  return {
    trialId: trial.id, datasetVersion: dataset.version, levels: { ...l }, appearance: profile.presentation.appearance,
    interfaceVersion: profile.presentation.interfaceVersion ?? "cards-v1",
    name: namesForProfile(dataset, profile)[l.name / 25], avatarId: `${profile.presentation.assetVersion}-${l.avatar}`,
    role: frame.role, welcome: frame.welcome, situationPrompt: frame.situation, evidencePrompt: frame.evidence,
    recommendationPrompt: frame.recommendation, closing: frame.closing,
    tone: c.tones[index("tone")], personality: c.personalities[index("personality")], confidence: c.confidence[index("confidence")],
    recommendation: isOpen(trial) ? trial.aiViewpoint?.summary ?? "Perspective not yet available" : isPrediction(trial) ? trial.aiEstimate === undefined ? "Estimate not yet available" : `${trial.aiEstimate} ${trial.unit}` : trial.aiRecommendation === "proceed" ? trial.actionLabel : trial.alternativeLabel,
    ...(isPrediction(trial) && trial.aiEstimate !== undefined ? { aiEstimate: trial.aiEstimate, unit: trial.unit } : {}),
    ...(isOpen(trial) && trial.aiViewpoint ? { viewpointId: trial.aiViewpoint.id, viewpointDirection: trial.aiViewpoint.direction, proposition: trial.proposition } : {}),
    coreReason: trial.coreReason,
    expressionIds: ["tone", "personality", "framing", "confidence"].map((id) => trial.expressionRefs[id as keyof PublicTrial["expressionRefs"]][l[id as CueDimension] / 25]),
  };
}
