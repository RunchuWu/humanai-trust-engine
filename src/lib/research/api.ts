import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, ResearchError, validId } from "./store";
export function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } }); }
export function requireAdmin(request: Request) {
  const expected = process.env.RESEARCH_ADMIN_KEY, supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) throw new ResearchError("Researcher key is missing or incorrect.", 401);
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ResearchError("Expected JSON.");
  const text = await request.text();
  if (text.length > 100000) throw new ResearchError("Configuration is too large.", 413);
  try { const value = JSON.parse(text); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new ResearchError("Invalid JSON object."); }
}
export function studyId(value: unknown) { if (!validId(value)) throw new ResearchError("Invalid study ID."); return value; }
export async function sessionToken(id: string) { return (await cookies()).get(cookieName(id))?.value; }
export async function respond(fn: () => Promise<Response>) {
  try { return await fn(); }
  catch (error) {
    if (error instanceof ResearchError) return json({ message: error.message }, error.status);
    console.error("Research storage request failed", error instanceof Error ? error.name : "UnknownError");
    return json({ message: "Unable to save or load study data. Please retry." }, 503);
  }
}
