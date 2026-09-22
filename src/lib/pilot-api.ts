import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PILOT_ORDERS, type PilotCondition } from "@/lib/pilot-content";
import { getDecisions, getInviteBySession, hashPilotToken } from "@/lib/pilot-store";

export const PILOT_COOKIE = "humanai_pilot_token";

export function pilotError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function isCondition(value: unknown): value is PilotCondition {
  return value === 1 || value === 2 || value === 3;
}

export function validToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{48}$/.test(value);
}

export async function getPilotSession() {
  const token = (await cookies()).get(PILOT_COOKIE)?.value;
  if (!validToken(token)) return null;
  const hash = hashPilotToken(token);
  const invite = await getInviteBySession(hash);
  if (!invite || (invite.status !== "active" && invite.status !== "complete")) return null;
  const decisions = await getDecisions(invite.token_hash);
  return { hash: invite.token_hash, invite, decisions, order: PILOT_ORDERS[invite.order_variant] };
}

export function adminAuthorized(request: Request): boolean {
  const expected = process.env.PILOT_ADMIN_KEY;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
