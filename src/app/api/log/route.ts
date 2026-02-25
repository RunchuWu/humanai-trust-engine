import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { validateEvent, type EventUnion } from "@/lib/schema";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE_PATH = path.join(DATA_DIR, "events.jsonl");

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return badRequest("Content-Type must be application/json");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const validation = validateEvent(payload);
  if (!validation.ok) {
    return badRequest(validation.error ?? "Invalid event payload");
  }

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(
      EVENTS_FILE_PATH,
      `${JSON.stringify(payload as EventUnion)}\n`,
      "utf8",
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to write event to data/events.jsonl" },
      { status: 500 },
    );
  }
}
