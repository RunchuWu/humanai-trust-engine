import { NextResponse } from "next/server";

import { parseEventFilters, readFilteredEvents, toCsv } from "@/lib/event-store";
import type { EventUnion } from "@/lib/schema";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

function serverError(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 500 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  if (format !== "json" && format !== "csv") {
    return badRequest("Query parameter 'format' must be 'json' or 'csv'");
  }

  const filterParse = parseEventFilters(url.searchParams);
  if (!filterParse.ok || !filterParse.filters) {
    return badRequest(filterParse.error ?? "Invalid export filters");
  }

  let events: EventUnion[];

  try {
    events = await readFilteredEvents(filterParse.filters);
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
