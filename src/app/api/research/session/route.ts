import { body, json, respond, sessionToken, studyId } from "@/lib/research/api";
import { cookieName, getSession, mutateSession, startSession } from "@/lib/research/store";
export const runtime = "nodejs";
export async function GET(request: Request) { return respond(async () => {
  const id = studyId(new URL(request.url).searchParams.get("studyId"));
  return json({ session: await getSession(id, await sessionToken(id)) });
}); }
export async function POST(request: Request) { return respond(async () => {
  const data = await body(request), id = studyId(data.studyId), token = await sessionToken(id);
  if (data.kind === "start") {
    const result = await startSession(id, data.mode, data.consent, token, data.requestToken);
    const response = json({ session: result.session });
    if (result.token) response.cookies.set(cookieName(id), result.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  }
  return json({ session: await mutateSession(id, token, data) });
}); }
