import "server-only";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { datasetForVersion, projectDataset, publicTrial } from "./materials";
import { cleanJudgment, sameJudgment, predictionMetrics, validJudgment } from "./prediction";
import { cleanOpenJudgment, sameOpenJudgment, stanceMovement, validOpenJudgment } from "./open-judgment";
import { isOpen, isPrediction } from "./types";
import { isLevels, resolveStimulus, validateStudy } from "./config";
import type { OpenJudgment, OpenTrial, ReviewedOpenTrial, PredictionJudgment, PredictionTrial, ReviewedPredictionTrial, CueLevels, Profile, PublicDataset, ResearchDataset, ResearchEvent, SessionView, Stage, StudyConfig, StudyRecord } from "./types";

export class ResearchError extends Error { constructor(message: string, public status = 400) { super(message); } }
interface StoredStudy extends StudyRecord { materials: ResearchDataset; parentId?: string }
interface Session {
  id: string; participantId: string; tokenHash: string; studyId: string; mode: "fixed" | "user_set";
  profile: Profile; locked: boolean; practiceComplete: boolean; index: number; stage: Stage;
  status: "active" | "complete"; createdAt: number;
  initialJudgments?: Record<string, PredictionJudgment & { eventId: string }>;
  practiceInitial?: PredictionJudgment;
  openInitials?: Record<string, OpenJudgment & {eventId:string}>;
  openPracticeInitial?: OpenJudgment; numericPracticeComplete?: boolean;
  viewpoints?: Record<string,"A" | "B">;
}
interface Store { version: 2; studies: StoredStudy[]; sessions: Session[]; events: ResearchEvent[] }
const directory = () => process.env.RESEARCH_DATA_DIR ?? path.join(process.cwd(), "data", "runs", "research-v2");
const file = () => path.join(directory(), "research.json");
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export function cookieName(studyId: string) { return `research_session_${studyId}`; }
export function validId(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9-]{36}$/.test(value); }
function projection(s: StoredStudy): StudyRecord { return { id: s.id, version: s.version, status: s.status, createdAt: s.createdAt, config: s.config }; }
function publicMaterials(s: StoredStudy, advice = false): PublicDataset { return projectDataset(s.materials, advice); }
async function readStore(): Promise<Store> {
  try { return JSON.parse(await readFile(file(), "utf8")) as Store; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 2, studies: [], sessions: [], events: [] }; throw error; }
}
// A directory lock also serializes separate Node workers; rename makes each commit atomic.
async function transaction<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  await mkdir(directory(), { recursive: true });
  const lock = path.join(directory(), ".lock");
  const until = Date.now() + 5000;
  while (true) {
    try { await mkdir(lock); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try { if (Date.now() - (await stat(lock)).mtimeMs > 60000) await rm(lock, { recursive: true, force: true }); } catch { /* another process released the lock */ }
      if (Date.now() > until) throw new ResearchError("Storage is busy. Please retry.", 503);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }
  const temp = `${file()}.${randomUUID()}.tmp`;
  try {
    const store = await readStore();
    const result = await fn(store);
    await writeFile(temp, JSON.stringify(store), { mode: 0o600 });
    await rename(temp, file());
    return result;
  } finally { await rm(temp, { force: true }); await rm(lock, { recursive: true, force: true }); }
}
function findStudy(store: Store, id: string, frozen = true) {
  const s = store.studies.find((item) => item.id === id);
  if (!s || (frozen && s.status !== "frozen")) throw new ResearchError("Study version not found.", 404);
  return s;
}
function authenticated(store: Store, studyId: string, token: string | undefined) {
  if (!token) throw new ResearchError("No session in this browser.", 401);
  const s = store.sessions.find((item) => item.studyId === studyId && item.tokenHash === hash(token));
  if (!s) throw new ResearchError("Session not found.", 401);
  return s;
}
function sessionView(s: Session, study: StoredStudy, events: ResearchEvent[] = []): SessionView {
  const trialId = study.config.trialOrder[s.index];
  const initial = s.initialJudgments?.[trialId];
  const trial = study.materials.trials.find(t => t.id === trialId);
  const prediction = study.materials.workflow === "prediction-v1" || study.materials.workflow === "two-part-v1";
  const open = s.openInitials?.[trialId];
  const final = events.find(e=>e.session_id===s.id && e.trial_id===trialId && e.event_type==="decision");
  return {
    id: s.id, participantId: s.participantId, studyId: s.studyId, configVersion: study.version,
    mode: s.mode, profile: s.profile,
    allowedDimensions: s.mode === "user_set" ? study.config.userSet.allowedDimensions : [],
    locked: s.locked, practiceComplete: s.practiceComplete, index: s.index, stage: s.stage,
    status: s.status, order: study.config.trialOrder, survey: study.config.survey,
    workflow: study.materials.workflow ?? "constraint-v1",
    ...(study.materials.workflow === "two-part-v1" ? {numericPracticeComplete:Boolean(s.numericPracticeComplete)} : {}),
    ...(open ? {openInitial:cleanOpenJudgment(open)} : {}),
    ...(open && trial && isOpen(trial) && s.stage !== "situation" ? {openAdvice:publicTrial(trial,true,s.viewpoints?.[trialId]) as OpenTrial} : {}),
    ...(final?.final_text && final.final_stance && final.final_confidence ? {openFinal:{text:final.final_text,stance:final.final_stance,confidence:final.final_confidence}} : {}),
    ...(s.openPracticeInitial ? {openPracticeInitial:cleanOpenJudgment(s.openPracticeInitial), ...(!s.practiceComplete ? {openPracticeAdvice:publicTrial(study.materials.practice,true,"A") as OpenTrial} : {})} : {}),
    ...(initial ? { initialJudgment: cleanJudgment(initial) } : {}),
    ...(prediction && initial && s.stage === "recommendation" && trial ? { advice: publicTrial(trial, true) as PredictionTrial } : {}),
    ...(s.practiceInitial ? { practiceInitial: s.practiceInitial,
      ...(!(study.materials.workflow === "two-part-v1" ? s.numericPracticeComplete : s.practiceComplete) ? { practiceAdvice: publicTrial(study.materials.numericPractice ?? study.materials.practice, true) as PredictionTrial } : {}) } : {}),
  };
}
function event(store: Store, session: Session, study: StoredStudy, fields: Pick<ResearchEvent, "event_type"> & Partial<ResearchEvent>) {
  const trial = study.materials.trials.find(t => t.id === fields.trial_id);
  const responseMetadata = trial && isOpen(trial) ? {trial_type:"open_judgment" as const, part:1 as const, trial_category:trial.category} : trial && isPrediction(trial) ? {trial_type:"prediction" as const, ...(study.materials.workflow === "two-part-v1" ? {part:2 as const} : {}), trial_category: trial.category, response_unit: trial.unit, response_min: trial.estimateRange.min, response_max: trial.estimateRange.max, response_step: trial.estimateRange.step } : {};
  const row: ResearchEvent = { schema_version: study.config.schemaVersion, workflow: study.materials.workflow ?? "constraint-v1", event_id: randomUUID(), timestamp_ms: Date.now(), study_id: study.id, config_version: study.version, dataset_version: study.materials.version, participant_id: session.participantId, session_id: session.id, profile_id: session.profile.id, config_source: session.mode === "user_set" ? "user_set" : "researcher_fixed", cue_levels: structuredClone(session.profile.levels), appearance: session.profile.presentation.appearance, ...responseMetadata, ...fields };
  store.events.push(row); return row;
}
export async function listStudies() { return (await readStore()).studies.map(projection).reverse(); }
export async function getStudy(id: string) { const s = findStudy(await readStore(), id); return { study: projection(s), dataset: publicMaterials(s) }; }
export async function saveStudy(config: unknown, status: unknown, parentId?: string) {
  const dataset = datasetForVersion((config as StudyConfig | null)?.datasetVersion ?? "");
  if (!dataset) throw new ResearchError("Unsupported dataset version.");
  const error = validateStudy(config, dataset.trials.map((t) => t.id));
  if (error) throw new ResearchError(error);
  if (status !== "draft" && status !== "frozen") throw new ResearchError("Invalid study status.");
  return transaction((store) => {
    const parent = parentId ? findStudy(store, parentId, false) : null;
    const row: StoredStudy = { id: randomUUID(), version: (parent?.version ?? 0) + 1, createdAt: new Date().toISOString(), status, config: structuredClone(config as StudyConfig), materials: structuredClone(dataset), ...(parent ? { parentId: parent.id } : {}) };
    store.studies.push(row); return projection(row);
  });
}
export async function startSession(studyId: string, mode: unknown, consent: unknown, token?: string, requestToken?: unknown) {
  if (consent !== true) throw new ResearchError("Consent is required.");
  if (requestToken !== undefined && (typeof requestToken !== "string" || !/^[a-f0-9]{64}$/.test(requestToken))) throw new ResearchError("Invalid start request token.");
  if (mode !== "fixed" && mode !== "user_set") throw new ResearchError("Invalid study entry.");
  return transaction((store) => {
    const study = findStudy(store, studyId);
    const resumeToken = token ?? (typeof requestToken === "string" ? requestToken : undefined);
    const existing = resumeToken ? store.sessions.find((s) => s.studyId === studyId && s.tokenHash === hash(resumeToken)) : null;
    if (existing) {
      if (existing.mode !== mode) throw new ResearchError("This browser already has a session in the other study entry.", 409);
      return { session: sessionView(existing, study, store.events), token: token ? null : resumeToken! };
    }
    if (mode === "user_set" && !study.config.userSet.enabled) throw new ResearchError("Participant customization is not enabled.", 403);
    const profile = mode === "user_set" ? study.config.profiles.find((p) => p.id === study.config.userSet.baseProfileId)! : study.config.profiles[randomInt(study.config.profiles.length)];
    const nextToken = typeof requestToken === "string" ? requestToken : randomBytes(32).toString("hex");
    const s: Session = { id: randomUUID(), participantId: randomUUID(), tokenHash: hash(nextToken), studyId, mode, profile: structuredClone(profile), locked: mode === "fixed", practiceComplete: false, index: 0, stage: "situation", status: "active", createdAt: Date.now() };
    if (study.materials.workflow === "two-part-v1") {
      const ids = study.materials.trials.filter(isOpen).map(t=>t.id);
      for(let i=ids.length-1;i>0;i--) { const j=randomInt(i+1); [ids[i],ids[j]]=[ids[j],ids[i]]; }
      s.viewpoints = Object.fromEntries(ids.map((id,i)=>[id,i<2?"A":"B"]));
    }
    store.sessions.push(s); event(store, s, study, { event_type: "session_started" });
    if (s.locked) event(store, s, study, { event_type: "configuration_locked" });
    return { session: sessionView(s, study, store.events), token: nextToken };
  });
}
export async function getSession(studyId: string, token?: string) {
  const store = await readStore(), study = findStudy(store, studyId);
  return sessionView(authenticated(store, studyId, token), study, store.events);
}
export async function mutateSession(studyId: string, token: string | undefined, input: Record<string, unknown>) {
  return transaction((store) => {
    const s = authenticated(store, studyId, token), study = findStudy(store, studyId);
    const response = () => sessionView(s, study, store.events);
    if (input.kind === "lock") {
      if (!isLevels(input.levels)) throw new ResearchError("Invalid five-level configuration.");
      const levels = input.levels as CueLevels;
      if (s.locked) {
        if (Object.keys(levels).some((key) => levels[key as keyof CueLevels] !== s.profile.levels[key as keyof CueLevels])) throw new ResearchError("This session configuration is already locked.", 409);
        return response();
      }
      if (s.mode !== "user_set") throw new ResearchError("This is a fixed configuration.", 403);
      for (const key of Object.keys(levels) as (keyof CueLevels)[]) {
        if (!study.config.userSet.allowedDimensions.includes(key) && levels[key] !== s.profile.levels[key]) throw new ResearchError(`The ${key} setting is locked.`, 403);
      }
      s.profile.levels = { ...levels }; s.locked = true;
      event(store, s, study, { event_type: "configuration_locked" }); return response();
    }
    if (!s.locked) throw new ResearchError("Confirm your configuration first.", 409);
    if (study.materials.workflow === "two-part-v1" && (input.kind === "practice_initial" || input.kind === "practice")) {
      const openPractice = study.materials.practice;
      const numeric = study.materials.numericPractice!;
      if (input.trialId === openPractice.id) {
        if(s.practiceComplete) return response();
        if(!validOpenJudgment(input.judgment)) throw new ResearchError("Write 10–1,200 characters, select a stance and rate confidence from 1 to 7.");
        if(input.kind === "practice_initial") {
          if(s.openPracticeInitial && !sameOpenJudgment(s.openPracticeInitial,input.judgment)) throw new ResearchError("Your initial practice response is already saved.",409);
          s.openPracticeInitial ??= cleanOpenJudgment(input.judgment);
        } else {
          if(!s.openPracticeInitial) throw new ResearchError("Save your initial practice response first.",409);
          s.practiceComplete=true;
        }
      } else if(input.trialId === numeric.id) {
        if(s.numericPracticeComplete) return response();
        if(!s.practiceComplete || s.index!==4) throw new ResearchError("Numeric practice begins after Part 1.",409);
        if(!validJudgment(input.judgment,numeric)) throw new ResearchError("Use the displayed range and increment and a confidence rating from 1 to 7.");
        if(input.kind === "practice_initial") {
          if(s.practiceInitial && !sameJudgment(s.practiceInitial,input.judgment)) throw new ResearchError("Your initial practice estimate is already saved.",409);
          s.practiceInitial ??= cleanJudgment(input.judgment);
        } else {
          if(!s.practiceInitial) throw new ResearchError("Save your initial practice estimate first.",409);
          s.numericPracticeComplete=true;
        }
      } else throw new ResearchError("Invalid practice item.",409);
      return response();
    }
    if (study.materials.workflow === "prediction-v1" && (input.kind === "practice_initial" || input.kind === "practice")) {
      const practice = study.materials.practice as ReviewedPredictionTrial;
      if (!validJudgment(input.judgment, practice)) throw new ResearchError("Use the displayed range and increment, a confidence rating from 1 to 7, and an optional explanation of at most 300 characters.");
      if (input.kind === "practice_initial") {
        if (s.practiceInitial && !sameJudgment(s.practiceInitial, input.judgment)) throw new ResearchError("The first practice estimate is already saved.", 409);
        s.practiceInitial ??= cleanJudgment(input.judgment);
      } else {
        if (!s.practiceInitial) throw new ResearchError("Make your independent practice estimate first.", 409);
        s.practiceComplete = true;
      }
      return response();
    }
    if (input.kind === "practice") {
      const practice = study.materials.practice;
      if (isPrediction(practice) || isOpen(practice)) throw new ResearchError("Invalid practice workflow.");
      const truth = practice.groundTruth;
      if (input.decision !== (truth === practice.aiRecommendation ? "accept" : "override")) throw new ResearchError("Check all three requirements and try the practice choice again.");
      s.practiceComplete = true; return response();
    }
    if (!s.practiceComplete) throw new ResearchError("Complete the practice first.", 409);
    if (input.kind === "survey") {
      if (s.index !== study.config.trialOrder.length) throw new ResearchError("Complete all decisions first.", 409);
      const answers = input.answers as Record<string, unknown> | undefined;
      if (!answers || typeof answers !== "object" || Array.isArray(answers) || Object.keys(answers).length !== study.config.survey.length || study.config.survey.some((item) => !Number.isInteger(answers[item.id]) || Number(answers[item.id]) < 1 || Number(answers[item.id]) > 7)) throw new ResearchError("Please answer every item from 1 to 7.");
      if (s.status === "complete") return response();
      for (const item of study.config.survey) event(store, s, study, { event_type: "manipulation_check", item_id: item.id, construct: item.construct, item_text: item.text, response_value: Number(answers[item.id]), scale_min: 1, scale_max: 7 });
      s.status = "complete"; return response();
    }
    const trialId = input.trialId;
    if (input.kind === "decision") {
      const previous = store.events.find((e) => e.session_id === s.id && e.event_type === "decision" && e.trial_id === trialId);
      if (previous) return response(); // Retries never overwrite a saved decision.
    }
    if(input.kind === "reflection" && store.events.some(e=>e.session_id===s.id && e.trial_id===trialId && e.event_type==="reflection")) return response();
    if(study.materials.workflow === "two-part-v1" && s.index>=4 && !s.numericPracticeComplete) throw new ResearchError("Complete the Part 2 practice first.",409);
    if (s.status === "complete" || trialId !== study.config.trialOrder[s.index]) throw new ResearchError("This is not the active trial. Refresh to resume.", 409);
    const trial = study.materials.trials.find((t) => t.id === trialId)!;
    const events = store.events.filter((e) => e.session_id === s.id && e.trial_id === trialId);
    if (isOpen(trial) && input.kind === "initial") {
      if(!validOpenJudgment(input.judgment)) throw new ResearchError("Write 10–1,200 characters, select a stance and rate confidence from 1 to 7.");
      const previous=s.openInitials?.[trial.id];
      if(previous) {if(!sameOpenJudgment(previous,input.judgment)) throw new ResearchError("Your initial view is locked after seeing AI advice.",409);return response();}
      const shown=events.find(e=>e.event_type==="task_shown");
      if(s.stage!=="situation" || !shown) throw new ResearchError("Read the situation before submitting your view.",409);
      const raw=input.clientDecidedAt;
      const now=typeof raw==="number" && Number.isFinite(raw) && Math.abs(Date.now()-raw)<300000?raw:Date.now();
      const judgment=cleanOpenJudgment(input.judgment);
      const row=event(store,s,study,{event_type:"initial_judgment",trial_id:trial.id,trial_index:s.index,initial_text:judgment.text,initial_stance:judgment.stance,initial_confidence:judgment.confidence,initial_judgment_time_ms:Math.max(0,now-(shown.client_shown_at_ms??shown.timestamp_ms))});
      s.openInitials ??= {};s.openInitials[trial.id]={...judgment,eventId:row.event_id};s.stage="recommendation";return response();
    }
    if(isOpen(trial) && input.kind === "decision") {
      const initial=s.openInitials?.[trial.id], exposure=events.find(e=>e.stage==="recommendation"), shown=events.find(e=>e.event_type==="task_shown");
      if(!initial || !exposure || !shown || s.stage!=="recommendation") throw new ResearchError("Save your initial view and read the AI perspective first.",409);
      if(!validOpenJudgment(input.judgment)) throw new ResearchError("Write 10–1,200 characters, select a stance and rate confidence from 1 to 7.");
      const final=cleanOpenJudgment(input.judgment), v=(trial as ReviewedOpenTrial).viewpoints.find(v=>v.id===s.viewpoints?.[trial.id])!;
      const raw=input.clientDecidedAt;
      const now=typeof raw==="number" && Number.isFinite(raw) && Math.abs(Date.now()-raw)<300000?raw:Date.now();
      event(store,s,study,{event_type:"decision",trial_id:trial.id,trial_index:s.index,initial_judgment_id:initial.eventId,exposure_id:exposure.exposure_id,
        initial_text:initial.text,initial_stance:initial.stance,initial_confidence:initial.confidence,
        final_text:final.text,final_stance:final.stance,final_confidence:final.confidence,
        viewpoint_id:v.id,viewpoint_direction:v.direction,...stanceMovement(initial.stance,final.stance,v.direction),
        latency_ms:Math.max(0,now-(shown.client_shown_at_ms??shown.timestamp_ms)),thinking_time_ms:Math.max(0,now-(exposure.client_shown_at_ms??exposure.timestamp_ms))});
      s.stage="reflection";return response();
    }
    if(isOpen(trial) && input.kind === "reflection") {
      const decision=events.find(e=>e.event_type==="decision");
      if(s.stage!=="reflection" || !decision) throw new ResearchError("Save your final view before reflecting.",409);
      if(typeof input.text!=="string" || input.text.length>1200) throw new ResearchError("Use at most 1,200 characters for the optional reflection.");
      event(store,s,study,{event_type:"reflection",trial_id:trial.id,trial_index:s.index,decision_event_id:decision.event_id,initial_judgment_id:decision.initial_judgment_id,exposure_id:decision.exposure_id,viewpoint_id:decision.viewpoint_id,viewpoint_direction:decision.viewpoint_direction,reflection_text:input.text.trim(),reflection_skipped:!input.text.trim()});
      s.index+=1;s.stage="situation";return response();
    }
    if (isPrediction(trial) && input.kind === "initial") {
      if (!validJudgment(input.judgment, trial)) throw new ResearchError("Use the displayed range and increment, a confidence rating from 1 to 7, and an optional explanation of at most 300 characters.");
      const previous = s.initialJudgments?.[trial.id];
      if (previous) {
        if (!sameJudgment(previous, input.judgment)) throw new ResearchError("Your independent estimate is locked after seeing AI advice.", 409);
        return response();
      }
      const shown = events.find(e => e.event_type === "task_shown");
      if (s.stage !== "situation" || !shown) throw new ResearchError("Read the observations before submitting your estimate.", 409);
      const raw = input.clientDecidedAt;
      const now = typeof raw === "number" && Number.isFinite(raw) && Math.abs(Date.now() - raw) < 300000 ? raw : Date.now();
      const row = event(store, s, study, {
        event_type: "initial_judgment", trial_id: trial.id, trial_index: s.index,
        initial_estimate: input.judgment.estimate, initial_confidence: input.judgment.confidence,
        ...(cleanJudgment(input.judgment).rationale ? { initial_rationale: cleanJudgment(input.judgment).rationale } : {}),
        initial_judgment_time_ms: Math.max(0, now - (shown.client_shown_at_ms ?? shown.timestamp_ms)),
      });
      s.initialJudgments ??= {};
      s.initialJudgments[trial.id] = { ...cleanJudgment(input.judgment), eventId: row.event_id };
      s.stage = "recommendation";
      return response();
    }
    if (input.kind === "advance") {
      if (isPrediction(trial) || isOpen(trial)) throw new ResearchError("Submit your independent estimate before seeing AI advice.", 409);
      const from = input.fromStage;
      if (from !== "situation" && from !== "evidence") throw new ResearchError("Invalid stage transition.");
      const next = from === "situation" ? "evidence" : "recommendation";
      if (s.stage === next) return response();
      if (s.stage !== from || !events.some((e) => e.stage === from)) throw new ResearchError("Wait for this stage to finish loading.", 409);
      s.stage = next; return response();
    }
    if (input.kind === "shown") {
      if(s.stage === "reflection") throw new ResearchError("The final response is saved; submit or skip the reflection.",409);
      if ((isPrediction(trial) || isOpen(trial)) && s.stage === "recommendation" && !(s.initialJudgments?.[trial.id] || s.openInitials?.[trial.id])) throw new ResearchError("An independent estimate is required first.", 409);
      if (input.stage !== s.stage) throw new ResearchError("Stage does not match this session.", 409);
      if (!events.some((e) => e.stage === s.stage)) {
        const clientShown = input.clientShownAt;
        // Browser timestamp marks paint; the server receipt timestamp is retained separately.
        const shownAt = typeof clientShown === "number" && Number.isFinite(clientShown) && Math.abs(Date.now() - clientShown) < 300000 ? clientShown : Date.now();
        event(store, s, study, { event_type: s.stage === "situation" ? "task_shown" : "stage_shown", trial_id: trial.id, trial_index: s.index, stage: s.stage, client_shown_at_ms: shownAt, ...(s.stage === "recommendation" ? { ...((s.initialJudgments?.[trial.id] || s.openInitials?.[trial.id]) ? { initial_judgment_id: (s.initialJudgments?.[trial.id] ?? s.openInitials![trial.id]).eventId } : {}), ...(isOpen(trial) ? {viewpoint_id:s.viewpoints?.[trial.id]} : {}), exposure_id: randomUUID(), resolved_stimulus: resolveStimulus(publicMaterials(study, true), publicTrial(trial, true, s.viewpoints?.[trial.id]), s.profile) } : {}) });
      }
      return response();
    }
    if (input.kind === "decision" && isPrediction(trial)) {
      const initial = s.initialJudgments?.[trial.id];
      const exposure = events.find(e => e.stage === "recommendation");
      const shown = events.find(e => e.event_type === "task_shown");
      if (!initial || !exposure || !shown || s.stage !== "recommendation") throw new ResearchError("Submit an independent estimate and view AI advice first.", 409);
      if (!validJudgment(input.judgment, trial)) throw new ResearchError("Use the displayed range and increment, a confidence rating from 1 to 7, and an optional explanation of at most 300 characters.");
      const raw = input.clientDecidedAt;
      const now = typeof raw === "number" && Number.isFinite(raw) && Math.abs(Date.now() - raw) < 300000 ? raw : Date.now();
      const reviewed = trial as ReviewedPredictionTrial;
      event(store, s, study, {
        event_type: "decision", trial_id: trial.id, trial_index: s.index,
        initial_judgment_id: initial.eventId, exposure_id: exposure.exposure_id,
        ...predictionMetrics(initial, input.judgment, reviewed.aiEstimate, reviewed.outcome, trial.estimateRange),
        ...(initial.rationale ? { initial_rationale: initial.rationale } : {}),
        ...(cleanJudgment(input.judgment).rationale ? { final_rationale: cleanJudgment(input.judgment).rationale } : {}),
        latency_ms: Math.max(0, now - (shown.client_shown_at_ms ?? shown.timestamp_ms)),
        thinking_time_ms: Math.max(0, now - (exposure.client_shown_at_ms ?? exposure.timestamp_ms)),
      });
      s.index += 1; s.stage = "situation";
      return response();
    }
    if (input.kind === "decision") {
      if (isPrediction(trial) || isOpen(trial)) throw new ResearchError("Invalid decision workflow.");
      if (input.decision !== "accept" && input.decision !== "override") throw new ResearchError("Invalid decision.");
      const shown = events.find((e) => e.stage === "situation");
      const exposure = events.find((e) => e.stage === "recommendation");
      if (s.stage !== "recommendation" || !shown || !exposure) throw new ResearchError("View the recommendation before deciding.", 409);
      const raw = input.clientDecidedAt;
      const now = typeof raw === "number" && Number.isFinite(raw) && Math.abs(Date.now() - raw) < 300000 ? raw : Date.now();
      const follow = input.decision === "accept", aiCorrect = trial.aiRecommendation === trial.groundTruth;
      event(store, s, study, { event_type: "decision", trial_id: trial.id, trial_index: s.index, decision: input.decision, exposure_id: exposure.exposure_id, ai_reco: trial.aiRecommendation, ground_truth: trial.groundTruth, ai_correct: aiCorrect, follow_ai: follow, correct: follow === aiCorrect, latency_ms: Math.max(0, now - (shown.client_shown_at_ms ?? shown.timestamp_ms)), thinking_time_ms: Math.max(0, now - (exposure.client_shown_at_ms ?? exposure.timestamp_ms)) });
      s.index += 1; s.stage = "situation"; return response();
    }
    throw new ResearchError("Unknown session action.");
  });
}
export async function exportResearch(studyId?: string) {
  const store = await readStore();
  const studies = store.studies.filter((s) => !studyId || s.id === studyId);
  const sessions = store.sessions.filter((s) => !studyId || s.studyId === studyId);
  const events = store.events.filter((e) => !studyId || e.study_id === studyId);
  return { schema_version: studies.some(s=>s.config.schemaVersion===4) ? 4 : studies.every(s => s.config.schemaVersion === 2) ? 2 : 3, studies, sessions: sessions.map(({ tokenHash: _secret, ...s }) => { void _secret; return s; }), events };
}
export function researchCsv(events: ResearchEvent[]) {
  const columns = ["schema_version", "study_id", "config_version", "dataset_version", "participant_id", "session_id", "profile_id", "config_source", "event_id", "event_type", "timestamp_ms", "client_shown_at_ms", "trial_id", "trial_index", "stage", "exposure_id", "name_level", "tone_level", "avatar_level", "personality_level", "framing_level", "confidence_level", "appearance", "agent_name", "avatar_id", "interface_version", "resolved_stimulus", "decision", "ai_reco", "ground_truth", "ai_correct", "follow_ai", "correct", "latency_ms", "thinking_time_ms", "workflow", "trial_type", "part", "viewpoint_id", "viewpoint_direction", "initial_text", "final_text", "initial_stance", "final_stance", "stance_change", "stance_alignment", "reflection_text", "reflection_skipped", "decision_event_id", "trial_category", "response_unit", "response_min", "response_max", "response_step", "initial_rationale", "final_rationale", "metrics_version", "initial_judgment_id", "initial_judgment_time_ms", "initial_estimate", "initial_confidence", "ai_estimate", "final_estimate", "final_confidence", "outcome", "initial_abs_error", "final_abs_error", "ai_abs_error", "error_reduction", "normalized_error_reduction", "estimate_shift", "weight_of_advice", "advice_distance_initial", "advice_distance_final", "advice_movement", "item_id", "construct", "item_text", "response_value", "scale_min", "scale_max"];
  const snapshots = new Map(events.filter((e) => e.resolved_stimulus).map((e) => [e.exposure_id, e.resolved_stimulus!]));
  const quote = (v: unknown) => { const raw = v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); const safe = typeof v !== "number" && /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw; return `"${safe.replaceAll('"', '""')}"`; };
  return columns.join(",") + "\n" + events.map((e) => {
    const resolved = e.resolved_stimulus ?? snapshots.get(e.exposure_id);
    const row: Record<string, unknown> = { ...e, resolved_stimulus: resolved, agent_name: resolved?.name, avatar_id: resolved?.avatarId, interface_version: resolved?.interfaceVersion ?? (resolved ? "cards-v1" : undefined), ...Object.fromEntries(Object.entries(e.cue_levels).map(([k, v]) => [`${k}_level`, v])) };
    return columns.map((c) => quote(row[c])).join(",");
  }).join("\n") + "\n";
}
