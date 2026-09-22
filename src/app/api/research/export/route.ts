import { json, requireAdmin, respond, studyId } from "@/lib/research/api";
import { exportResearch, researchCsv, ResearchError } from "@/lib/research/store";
export const runtime = "nodejs";
export async function GET(request: Request) { return respond(async () => {
  requireAdmin(request); const url = new URL(request.url), id = url.searchParams.get("studyId"), format = url.searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "csv") throw new ResearchError("Use JSON or CSV export.");
  const data = await exportResearch(id ? studyId(id) : undefined);
  if (format === "json") return json(data);
  return new Response(researchCsv(data.events), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="research-events-v2.csv"', "Cache-Control": "no-store" } });
}); }
