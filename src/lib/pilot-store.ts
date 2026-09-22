import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PilotChoice, PilotCondition, PilotStage } from "@/lib/pilot-content";

export type InviteStatus = "pending" | "active" | "complete" | "withdrawn";
export interface PilotInvite {
  token_hash: string;
  session_hash: string | null;
  condition: PilotCondition;
  order_variant: "A" | "B";
  status: InviteStatus;
  created_at: string;
  consented_at: string | null;
  completed_at: string | null;
}
export interface PilotEvent {
  id: string;
  token_hash: string;
  type: "stage" | "decision" | "survey" | "withdraw";
  trial_id: string | null;
  stage: PilotStage | null;
  client_ms: number | null;
  server_at: string;
  details: Record<string, unknown>;
}
export interface PilotDecision {
  token_hash: string;
  trial_id: string;
  trial_index: number;
  choice: PilotChoice;
  stimulus_version: string;
  ai_reco: "action" | "alternative";
  ground_truth: "action" | "alternative";
  ai_correct: boolean;
  correct: boolean;
  situation_time_ms: number;
  evidence_time_ms: number;
  read_time_ms: number;
  hesitation_time_ms: number;
  total_time_ms: number;
  submitted_at: string;
}
export interface PilotSurvey {
  token_hash: string;
  answers: Record<string, number>;
  feedback: string;
  submitted_at: string;
}

type PilotDb = {
  invites: PilotInvite[];
  events: PilotEvent[];
  decisions: PilotDecision[];
  surveys: PilotSurvey[];
};

const LOCAL_FILE = path.join(process.cwd(), "data", "runs", "pilot-local", "pilot.json");
let localWriteQueue: Promise<unknown> = Promise.resolve();

export function hashPilotToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isPilotConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

function isLocalStore(): boolean {
  if (isPilotConfigured()) return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Pilot database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  return true;
}

async function readLocal(): Promise<PilotDb> {
  try {
    return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as PilotDb;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { invites: [], events: [], decisions: [], surveys: [] };
    }
    throw error;
  }
}

async function mutateLocal<T>(change: (db: PilotDb) => T): Promise<T> {
  const task = localWriteQueue.then(async () => {
    const db = await readLocal();
    const result = change(db);
    await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    const temp = `${LOCAL_FILE}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(db, null, 2)}\n`, "utf8");
    await rename(temp, LOCAL_FILE);
    return result;
  });
  localWriteQueue = task.catch(() => undefined);
  return task;
}

async function rest<T>(table: string, method: string, query = "", body?: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Pilot database is not configured.");
  const response = await fetch(`${base}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: key,
      // New sb_secret_* keys are API keys, not JWTs. Legacy service-role
      // keys remain JWTs and still need the Authorization header.
      ...(!key.startsWith("sb_secret_") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Pilot database ${table} ${method} failed (${response.status}).`);
  }
  const raw = await response.text();
  return (raw ? JSON.parse(raw) : null) as T;
}

async function restAll<T>(table: string, order: string): Promise<T[]> {
  // Supabase/PostgREST projects commonly cap rows returned per request.
  // Fetch pages instead of silently truncating the 12-trial event export.
  const pageSize = 500;
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await rest<T[]>(table, "GET", `?select=*&order=${order}&limit=${pageSize}&offset=${offset}`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function getInvite(hash: string): Promise<PilotInvite | null> {
  if (isLocalStore()) return (await readLocal()).invites.find((row) => row.token_hash === hash) ?? null;
  const rows = await rest<PilotInvite[]>("pilot_invites", "GET", `?token_hash=eq.${hash}&select=*`);
  return rows[0] ?? null;
}

export async function getInviteBySession(hash: string): Promise<PilotInvite | null> {
  if (isLocalStore()) return (await readLocal()).invites.find((row) => row.session_hash === hash) ?? null;
  const rows = await rest<PilotInvite[]>("pilot_invites", "GET", `?session_hash=eq.${hash}&select=*`);
  return rows[0] ?? null;
}

export async function createInvites(rows: PilotInvite[]): Promise<void> {
  if (isLocalStore()) {
    await mutateLocal((db) => {
      for (const row of rows) {
        if (db.invites.some((item) => item.token_hash === row.token_hash)) throw new Error("Duplicate invite token.");
        db.invites.push(row);
      }
    });
    return;
  }
  await rest("pilot_invites", "POST", "", rows);
}

export async function activateInvite(hash: string, sessionHash: string): Promise<PilotInvite | null> {
  const now = new Date().toISOString();
  if (isLocalStore()) {
    return mutateLocal((db) => {
      const row = db.invites.find((item) => item.token_hash === hash);
      if (!row || row.status !== "pending") return null;
      row.status = "active";
      row.session_hash = sessionHash;
      row.consented_at = now;
      return row;
    });
  }
  const rows = await rest<PilotInvite[]>("pilot_invites", "PATCH", `?token_hash=eq.${hash}&status=eq.pending`, { status: "active", session_hash: sessionHash, consented_at: now });
  return rows[0] ?? null;
}

export async function setInviteStatus(hash: string, status: InviteStatus): Promise<void> {
  const completed_at = status === "complete" ? new Date().toISOString() : null;
  if (isLocalStore()) {
    await mutateLocal((db) => {
      const row = db.invites.find((item) => item.token_hash === hash);
      if (!row) throw new Error("Invite not found.");
      row.status = status;
      row.completed_at = completed_at;
    });
    return;
  }
  await rest("pilot_invites", "PATCH", `?token_hash=eq.${hash}`, { status, completed_at });
}

export async function addPilotEvent(event: PilotEvent): Promise<void> {
  if (isLocalStore()) {
    await mutateLocal((db) => {
      if (!db.events.some((item) => item.id === event.id)) db.events.push(event);
    });
    return;
  }
  await rest("pilot_events", "POST", "?on_conflict=id", event, { Prefer: "resolution=ignore-duplicates,return=minimal" });
}

export async function getDecisions(hash: string): Promise<PilotDecision[]> {
  if (isLocalStore()) return (await readLocal()).decisions.filter((row) => row.token_hash === hash).sort((a, b) => a.trial_index - b.trial_index);
  return rest<PilotDecision[]>("pilot_decisions", "GET", `?token_hash=eq.${hash}&select=*&order=trial_index.asc`);
}

export async function addDecision(row: PilotDecision): Promise<PilotDecision> {
  if (isLocalStore()) {
    return mutateLocal((db) => {
      const existing = db.decisions.find((item) => item.token_hash === row.token_hash && item.trial_id === row.trial_id);
      if (existing) return existing;
      db.decisions.push(row);
      return row;
    });
  }
  await rest("pilot_decisions", "POST", "?on_conflict=token_hash,trial_id", row, { Prefer: "resolution=ignore-duplicates,return=minimal" });
  const rows = await getDecisions(row.token_hash);
  return rows.find((item) => item.trial_id === row.trial_id) ?? row;
}

export async function getSurvey(hash: string): Promise<PilotSurvey | null> {
  if (isLocalStore()) return (await readLocal()).surveys.find((row) => row.token_hash === hash) ?? null;
  const rows = await rest<PilotSurvey[]>("pilot_surveys", "GET", `?token_hash=eq.${hash}&select=*`);
  return rows[0] ?? null;
}

export async function addSurvey(row: PilotSurvey): Promise<void> {
  if (isLocalStore()) {
    await mutateLocal((db) => {
      if (db.surveys.some((item) => item.token_hash === row.token_hash)) return;
      db.surveys.push(row);
    });
    return;
  }
  await rest("pilot_surveys", "POST", "?on_conflict=token_hash", row, { Prefer: "resolution=ignore-duplicates,return=minimal" });
}

export async function withdrawPilot(hash: string): Promise<void> {
  if (isLocalStore()) {
    await mutateLocal((db) => {
      const invite = db.invites.find((item) => item.token_hash === hash);
      if (invite) invite.status = "withdrawn";
      db.decisions = db.decisions.filter((item) => item.token_hash !== hash);
      db.events = db.events.filter((item) => item.token_hash !== hash);
      db.surveys = db.surveys.filter((item) => item.token_hash !== hash);
    });
    return;
  }
  await Promise.all([
    rest("pilot_decisions", "DELETE", `?token_hash=eq.${hash}`),
    rest("pilot_events", "DELETE", `?token_hash=eq.${hash}`),
    rest("pilot_surveys", "DELETE", `?token_hash=eq.${hash}`),
  ]);
  await setInviteStatus(hash, "withdrawn");
}

export async function getPilotExport(): Promise<PilotDb> {
  if (isLocalStore()) return readLocal();
  const [invites, events, decisions, surveys] = await Promise.all([
    restAll<PilotInvite>("pilot_invites", "created_at.asc,token_hash.asc"),
    restAll<PilotEvent>("pilot_events", "server_at.asc,id.asc"),
    restAll<PilotDecision>("pilot_decisions", "submitted_at.asc,token_hash.asc,trial_id.asc"),
    restAll<PilotSurvey>("pilot_surveys", "submitted_at.asc,token_hash.asc"),
  ]);
  return { invites, events, decisions, surveys };
}
