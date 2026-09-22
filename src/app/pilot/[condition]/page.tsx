import { notFound } from "next/navigation";
import { Suspense } from "react";

import PilotExperience from "@/app/pilot/PilotExperience";
import type { PilotCondition } from "@/lib/pilot-content";

export default async function PilotConditionPage({ params }: { params: Promise<{ condition: string }> }) {
  const { condition } = await params;
  if (condition !== "1" && condition !== "2" && condition !== "3") notFound();
  return <Suspense fallback={<main style={{ padding: 40 }}>正在载入试点界面…</main>}><PilotExperience
    condition={Number(condition) as PilotCondition}
    contact={process.env.PILOT_CONTACT ?? ""}
    dataRegion={process.env.PILOT_DATA_REGION ?? ""}
    retentionDays={process.env.PILOT_RETENTION_DAYS ?? ""}
  /></Suspense>;
}
