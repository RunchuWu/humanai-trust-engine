import { body, json, requireAdmin, respond, studyId } from "@/lib/research/api";
import { getStudy, listStudies, saveStudy } from "@/lib/research/store";
export const runtime = "nodejs";
export async function GET(request: Request) { return respond(async () => {
  const id = new URL(request.url).searchParams.get("id");
  if (id) return json(await getStudy(studyId(id)));
  requireAdmin(request); return json({ studies: await listStudies() });
}); }
export async function POST(request: Request) { return respond(async () => {
  requireAdmin(request); const data = await body(request);
  const study = await saveStudy(data.config, data.status, data.parentId ? studyId(data.parentId) : undefined);
  return json({ study }, 201);
}); }
