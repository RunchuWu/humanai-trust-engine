import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateEvent, type EventUnion } from "@/lib/schema";

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
  const content = await readOptionalFile(getRunEventsFilePath(studyRunId));

  if (content === null) {
    return [];
  }

  return parseEventLines(content);
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
