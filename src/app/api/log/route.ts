import { NextResponse } from "next/server";

import {
  addStudyRunId,
  appendEvent,
  getCurrentStudyRunId,
} from "@/lib/event-store";
import { validateEvent, type EventUnion } from "@/lib/schema";

export const runtime = "nodejs";

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

  const event = addStudyRunId(payload as EventUnion, getCurrentStudyRunId());

  try {
    await appendEvent(event);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to write event to study run storage" },
      { status: 500 },
    );
  }
}
