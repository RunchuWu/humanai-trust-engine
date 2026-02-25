import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { validateEvent, type EventUnion } from "@/lib/schema";

export const runtime = "nodejs";

const EVENTS_FILE_PATH = path.join(process.cwd(), "data", "events.jsonl");

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
] as const;

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

function serverError(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 500 });
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

function toCsv(events: EventUnion[]): string {
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
    };

    if (event.event_type === "decision") {
      baseRecord.decision = event.decision;
      baseRecord.latency_ms = event.latency_ms;
      baseRecord.ai_reco = event.ai_reco;
      baseRecord.ground_truth = event.ground_truth;
      baseRecord.follow_ai = event.follow_ai;
      baseRecord.ai_correct = event.ai_correct;
    }

    return CSV_COLUMNS.map((column) => csvEscape(baseRecord[column])).join(",");
  });

  return [header, ...rows].join("\n");
}

function parseEventLines(content: string): EventUnion[] {
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

async function readEvents(): Promise<EventUnion[]> {
  try {
    const content = await readFile(EVENTS_FILE_PATH, "utf8");
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  if (format !== "json" && format !== "csv") {
    return badRequest("Query parameter 'format' must be 'json' or 'csv'");
  }

  let events: EventUnion[];

  try {
    events = await readEvents();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read events";
    return serverError(message);
  }

  if (format === "json") {
    return NextResponse.json(events, { status: 200 });
  }

  const csv = toCsv(events);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="events.csv"',
    },
  });
}
