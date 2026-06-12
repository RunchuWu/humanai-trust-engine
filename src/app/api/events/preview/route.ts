import { NextResponse } from "next/server";

import {
  getCurrentStudyRunId,
  parseEventFilters,
  readFilteredEvents,
} from "@/lib/event-store";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

function parseLimit(value: string | null): number {
  if (!value) {
    return 100;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 100;
  }

  return Math.min(Math.floor(parsed), 500);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filterParse = parseEventFilters(url.searchParams);

  if (!filterParse.ok || !filterParse.filters) {
    return badRequest(filterParse.error ?? "Invalid event preview filters");
  }

  const limit = parseLimit(url.searchParams.get("limit"));

  try {
    const events = await readFilteredEvents(filterParse.filters);
    const previewEvents = events.slice(-limit).reverse();

    return NextResponse.json(
      {
        current_study_run_id: getCurrentStudyRunId(),
        filters: filterParse.filters,
        total_count: events.length,
        returned_count: previewEvents.length,
        events: previewEvents,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read event preview";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
