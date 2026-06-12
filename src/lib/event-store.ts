import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  validateEvent,
  type ConditionId,
  type CueSource,
  type EventType,
  type EventUnion,
} from "@/lib/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const RUNS_DIR = path.join(DATA_DIR, "runs");

export const LEGACY_EVENTS_FILE_PATH = path.join(
  DATA_DIR,
  "events.jsonl",
);

export interface RunManifest {
  study_run_id: string;
  storage_version: 1;
  created_at_ms: number;
  created_at_iso: string;
}

export interface RunSummary {
  study_run_id: string;
  manifest: RunManifest | null;
  event_count: number;
  participant_count: number;
  condition_breakdown: Record<string, number>;
  last_event_timestamp_ms: number | null;
}

export interface EventFilters {
  studyRunId: string | "all";
  eventType?: EventType;
  conditionId?: ConditionId;
  participantId?: string;
  sessionId?: string;
  trialId?: string;
  cueSource?: CueSource;
  fromTimestampMs?: number;
  toTimestampMs?: number;
}

export interface FilterParseResult {
  ok: boolean;
  filters?: EventFilters;
  error?: string;
}

const CSV_COLUMNS = [
  "event_id",
  "participant_id",
  "condition_id",
  "session_id",
  "event_type",
  "timestamp_ms",
  "trial_id",
  "trial_index",
  "decision",
  "latency_ms",
  "ai_reco",
  "ground_truth",
  "follow_ai",
  "ai_correct",
  "cue_source",
  "cue_modules",
  "agent_name",
  "agent_tone",
  "agent_personality",
  "agent_avatar_label",
  "study_run_id",
] as const;

export function sanitizeStudyRunId(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  const safe = trimmed.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80);

  return safe || "local-dev";
}

export function getCurrentStudyRunId(): string {
  return sanitizeStudyRunId(process.env.STUDY_RUN_ID);
}

export function getRunDir(studyRunId: string): string {
  return path.join(RUNS_DIR, sanitizeStudyRunId(studyRunId));
}

export function getRunEventsFilePath(studyRunId: string): string {
  return path.join(getRunDir(studyRunId), "events.jsonl");
}

export function getRunManifestFilePath(studyRunId: string): string {
  return path.join(getRunDir(studyRunId), "manifest.json");
}

function isEventType(value: string): value is EventType {
  return value === "task_shown" || value === "decision";
}

function isConditionId(value: string): value is ConditionId {
  return (
    value === "control" ||
    value === "industry_set" ||
    value === "user_set" ||
    value === "A" ||
    value === "B"
  );
}

function isCueSource(value: string): value is CueSource {
  return value === "control" || value === "industry_set" || value === "user_set";
}

function parseTimestampFilter(
  params: URLSearchParams,
  key: "from_timestamp_ms" | "to_timestamp_ms",
): { ok: true; value?: number } | { ok: false; error: string } {
  const rawValue = params.get(key);
  if (!rawValue) {
    return { ok: true };
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: `${key} must be a non-negative number` };
  }

  return { ok: true, value };
}

export function parseEventFilters(params: URLSearchParams): FilterParseResult {
  const requestedStudyRunId = params.get("study_run_id");
  const studyRunId =
    requestedStudyRunId === "all"
      ? "all"
      : sanitizeStudyRunId(requestedStudyRunId ?? getCurrentStudyRunId());
  const eventType = params.get("event_type");
  const conditionId = params.get("condition_id");
  const cueSource = params.get("cue_source");
  const fromTimestamp = parseTimestampFilter(params, "from_timestamp_ms");
  const toTimestamp = parseTimestampFilter(params, "to_timestamp_ms");

  if (eventType && !isEventType(eventType)) {
    return { ok: false, error: "event_type must be 'task_shown' or 'decision'" };
  }

  if (conditionId && !isConditionId(conditionId)) {
    return {
      ok: false,
      error:
        "condition_id must be 'control', 'industry_set', 'user_set', 'A', or 'B'",
    };
  }

  if (cueSource && !isCueSource(cueSource)) {
    return {
      ok: false,
      error: "cue_source must be 'control', 'industry_set', or 'user_set'",
    };
  }

  if (!fromTimestamp.ok) {
    return fromTimestamp;
  }

  if (!toTimestamp.ok) {
    return toTimestamp;
  }

  if (
    fromTimestamp.value !== undefined &&
    toTimestamp.value !== undefined &&
    fromTimestamp.value > toTimestamp.value
  ) {
    return {
      ok: false,
      error: "from_timestamp_ms must be less than or equal to to_timestamp_ms",
    };
  }

  const parsedEventType =
    eventType && isEventType(eventType) ? eventType : undefined;
  const parsedConditionId =
    conditionId && isConditionId(conditionId) ? conditionId : undefined;
  const parsedCueSource =
    cueSource && isCueSource(cueSource) ? cueSource : undefined;

  return {
    ok: true,
    filters: {
      studyRunId,
      eventType: parsedEventType,
      conditionId: parsedConditionId,
      participantId: params.get("participant_id") || undefined,
      sessionId: params.get("session_id") || undefined,
      trialId: params.get("trial_id") || undefined,
      cueSource: parsedCueSource,
      fromTimestampMs: fromTimestamp.value,
      toTimestampMs: toTimestamp.value,
    },
  };
}

function csvEscape(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    const isMissingFile =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT";

    if (isMissingFile) {
      return null;
    }

    throw error;
  }
}

async function ensureRunManifest(studyRunId: string): Promise<void> {
  const safeStudyRunId = sanitizeStudyRunId(studyRunId);
  const runDir = getRunDir(safeStudyRunId);
  const manifestPath = getRunManifestFilePath(safeStudyRunId);

  await mkdir(runDir, { recursive: true });

  const existingManifest = await readOptionalFile(manifestPath);
  if (existingManifest !== null) {
    return;
  }

  const now = Date.now();
  const manifest: RunManifest = {
    study_run_id: safeStudyRunId,
    storage_version: 1,
    created_at_ms: now,
    created_at_iso: new Date(now).toISOString(),
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function createFallbackManifest(studyRunId: string): RunManifest {
  return {
    study_run_id: sanitizeStudyRunId(studyRunId),
    storage_version: 1,
    created_at_ms: 0,
    created_at_iso: "",
  };
}

export async function readRunManifest(
  studyRunId: string,
): Promise<RunManifest | null> {
  const safeStudyRunId = sanitizeStudyRunId(studyRunId);
  const content = await readOptionalFile(getRunManifestFilePath(safeStudyRunId));

  if (content === null) {
    return null;
  }

  const parsed: unknown = JSON.parse(content);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "study_run_id" in parsed &&
    "storage_version" in parsed
  ) {
    return parsed as RunManifest;
  }

  return createFallbackManifest(safeStudyRunId);
}

export function addStudyRunId(
  event: EventUnion,
  studyRunId = getCurrentStudyRunId(),
): EventUnion {
  return {
    ...event,
    study_run_id: sanitizeStudyRunId(studyRunId),
  };
}

export async function appendEvent(event: EventUnion): Promise<EventUnion> {
  const studyRunId = sanitizeStudyRunId(
    event.study_run_id ?? getCurrentStudyRunId(),
  );
  const eventWithRunId = addStudyRunId(event, studyRunId);

  await ensureRunManifest(studyRunId);
  await appendFile(
    getRunEventsFilePath(studyRunId),
    `${JSON.stringify(eventWithRunId)}\n`,
    "utf8",
  );

  return eventWithRunId;
}

export function parseEventLines(content: string): EventUnion[] {
  const events: EventUnion[] = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line) {
      continue;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSON at line ${index + 1}`);
    }

    const validation = validateEvent(parsed);
    if (!validation.ok) {
      throw new Error(
        `Invalid event at line ${index + 1}: ${validation.error ?? "unknown error"}`,
      );
    }

    events.push(parsed as EventUnion);
  }

  events.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return events;
}

export async function readLegacyEvents(): Promise<EventUnion[]> {
  const content = await readOptionalFile(LEGACY_EVENTS_FILE_PATH);

  if (content === null) {
    return [];
  }

  return parseEventLines(content);
}

export async function readRunEvents(studyRunId: string): Promise<EventUnion[]> {
  const safeStudyRunId = sanitizeStudyRunId(studyRunId);
  const content = await readOptionalFile(getRunEventsFilePath(safeStudyRunId));

  if (content === null) {
    return [];
  }

  return parseEventLines(content).map((event) =>
    event.study_run_id ? event : addStudyRunId(event, safeStudyRunId),
  );
}

export async function listStudyRunIds(): Promise<string[]> {
  try {
    const entries = await readdir(RUNS_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => sanitizeStudyRunId(entry.name))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    const isMissingDirectory =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT";

    if (isMissingDirectory) {
      return [];
    }

    throw error;
  }
}

export function filterEvents(
  events: EventUnion[],
  filters: EventFilters,
): EventUnion[] {
  return events.filter((event) => {
    if (filters.eventType && event.event_type !== filters.eventType) {
      return false;
    }

    if (filters.conditionId && event.condition_id !== filters.conditionId) {
      return false;
    }

    if (filters.participantId && event.participant_id !== filters.participantId) {
      return false;
    }

    if (filters.sessionId && event.session_id !== filters.sessionId) {
      return false;
    }

    if (filters.trialId && event.trial_id !== filters.trialId) {
      return false;
    }

    if (
      filters.cueSource &&
      (event.event_type !== "decision" || event.cue_source !== filters.cueSource)
    ) {
      return false;
    }

    if (
      filters.fromTimestampMs !== undefined &&
      event.timestamp_ms < filters.fromTimestampMs
    ) {
      return false;
    }

    if (
      filters.toTimestampMs !== undefined &&
      event.timestamp_ms > filters.toTimestampMs
    ) {
      return false;
    }

    return true;
  });
}

export async function readFilteredEvents(
  filters: EventFilters,
): Promise<EventUnion[]> {
  const studyRunIds =
    filters.studyRunId === "all"
      ? await listStudyRunIds()
      : [sanitizeStudyRunId(filters.studyRunId)];
  const eventGroups = await Promise.all(
    studyRunIds.map((studyRunId) => readRunEvents(studyRunId)),
  );

  return filterEvents(eventGroups.flat(), filters).sort(
    (a, b) => a.timestamp_ms - b.timestamp_ms,
  );
}

export async function getRunSummary(studyRunId: string): Promise<RunSummary> {
  const safeStudyRunId = sanitizeStudyRunId(studyRunId);
  const [manifest, events] = await Promise.all([
    readRunManifest(safeStudyRunId),
    readRunEvents(safeStudyRunId),
  ]);
  const participantIds = new Set(events.map((event) => event.participant_id));
  const conditionBreakdown = events.reduce<Record<string, number>>(
    (accumulator, event) => {
      accumulator[event.condition_id] =
        (accumulator[event.condition_id] ?? 0) + 1;
      return accumulator;
    },
    {},
  );
  const lastEvent = events.at(-1);

  return {
    study_run_id: safeStudyRunId,
    manifest,
    event_count: events.length,
    participant_count: participantIds.size,
    condition_breakdown: conditionBreakdown,
    last_event_timestamp_ms: lastEvent?.timestamp_ms ?? null,
  };
}

export async function getRunSummaries(): Promise<RunSummary[]> {
  const runIds = new Set(await listStudyRunIds());
  runIds.add(getCurrentStudyRunId());

  const summaries = await Promise.all(
    Array.from(runIds).map((studyRunId) => getRunSummary(studyRunId)),
  );

  return summaries.sort((a, b) => a.study_run_id.localeCompare(b.study_run_id));
}

export function toCsv(events: EventUnion[]): string {
  const header = CSV_COLUMNS.join(",");

  const rows = events.map((event) => {
    const baseRecord: Record<string, unknown> = {
      event_id: event.event_id,
      participant_id: event.participant_id,
      condition_id: event.condition_id,
      session_id: event.session_id,
      event_type: event.event_type,
      timestamp_ms: event.timestamp_ms,
      trial_id: event.trial_id,
      trial_index: event.trial_index,
      decision: "",
      latency_ms: "",
      ai_reco: "",
      ground_truth: "",
      follow_ai: "",
      ai_correct: "",
      cue_source: "",
      cue_modules: "",
      agent_name: "",
      agent_tone: "",
      agent_personality: "",
      agent_avatar_label: "",
      study_run_id: event.study_run_id ?? "",
    };

    if (event.event_type === "decision") {
      baseRecord.decision = event.decision;
      baseRecord.latency_ms = event.latency_ms;
      baseRecord.ai_reco = event.ai_reco;
      baseRecord.ground_truth = event.ground_truth;
      baseRecord.follow_ai = event.follow_ai;
      baseRecord.ai_correct = event.ai_correct;
      baseRecord.cue_source = event.cue_source;
      baseRecord.cue_modules = event.cue_modules?.join("|");
      baseRecord.agent_name = event.agent_name;
      baseRecord.agent_tone = event.agent_tone;
      baseRecord.agent_personality = event.agent_personality;
      baseRecord.agent_avatar_label = event.agent_avatar_label;
    }

    return CSV_COLUMNS.map((column) => csvEscape(baseRecord[column])).join(",");
  });

  return [header, ...rows].join("\n");
}
