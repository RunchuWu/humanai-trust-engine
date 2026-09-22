import { body, json, respond, sessionToken, studyId } from "@/lib/research/api";
import { mutateSession } from "@/lib/research/store";
export const runtime = "nodejs";
export async function POST(request: Request) { return respond(async () => {
  const data = await body(request), id = studyId(data.studyId);
  return json({ session: await mutateSession(id, await sessionToken(id), data) });
}); }
