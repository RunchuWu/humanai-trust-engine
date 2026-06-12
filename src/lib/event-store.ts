import { readFile } from "node:fs/promises";
import path from "node:path";

import { validateEvent, type EventUnion } from "@/lib/schema";

export const LEGACY_EVENTS_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "events.jsonl",
);

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
] as const;

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
  try {
    const content = await readFile(LEGACY_EVENTS_FILE_PATH, "utf8");
    return parseEventLines(content);
  } catch (error) {
    const isMissingFile =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT";

    if (isMissingFile) {
      return [];
    }

    throw error;
  }
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
