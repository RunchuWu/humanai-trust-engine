import { NextResponse } from "next/server";

import { getCurrentStudyRunId, getRunSummaries } from "@/lib/event-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const runs = await getRunSummaries();

    return NextResponse.json(
      {
        current_study_run_id: getCurrentStudyRunId(),
        runs,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read study runs";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
