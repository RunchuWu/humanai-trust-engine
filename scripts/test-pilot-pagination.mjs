import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const now = new Date().toISOString();
const tokenHash = "a".repeat(64);
const events = Array.from({ length: 1201 }, (_, index) => ({
  id: randomUUID(), token_hash: tokenHash, type: "stage", trial_id: "ops_01",
  stage: "situation", client_ms: index, server_at: now, details: {},
}));
const tables = {
  pilot_invites: [{ token_hash: tokenHash, session_hash: null, condition: 1, order_variant: "A", status: "complete", created_at: now, consented_at: now, completed_at: now }],
  pilot_events: events,
  pilot_decisions: [],
  pilot_surveys: [],
};
const eventOffsets = [];
const mock = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const table = url.pathname.split("/").at(-1);
  if (request.headers.apikey !== "sb_secret_test" || request.headers.authorization || !(table in tables)) {
    response.writeHead(401).end();
    return;
  }
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 1000), 500);
  if (table === "pilot_events") eventOffsets.push(offset);
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(tables[table].slice(offset, offset + limit)));
});

async function availablePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

await new Promise((resolve) => mock.listen(0, "127.0.0.1", resolve));
const mockPort = mock.address().port;
const appPort = await availablePort();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(appPort)], {
  cwd: process.cwd(),
  env: {
    ...process.env, SUPABASE_URL: `http://127.0.0.1:${mockPort}`,
    SUPABASE_SECRET_KEY: "sb_secret_test", PILOT_ADMIN_KEY: "pagination-local-test-key",
    PILOT_NEXT_DIST_DIR: ".next",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
child.stdout.on("data", (chunk) => { logs += chunk.toString(); });
child.stderr.on("data", (chunk) => { logs += chunk.toString(); });

try {
  let result;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/api/pilot/admin/export?kind=json`, {
        headers: { Authorization: "Bearer pagination-local-test-key" },
      });
      if (response.ok) { result = await response.json(); break; }
      if (response.status !== 503) throw new Error(`Unexpected export status ${response.status}`);
    } catch (error) {
      if (child.exitCode !== null) throw new Error(`Next.js exited early: ${logs}`, { cause: error });
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(result, `Pilot export did not become ready: ${logs}`);
  assert.equal(result.events.length, 1201);
  assert.deepEqual(eventOffsets, [0, 500, 1000]);
  assert.equal(result.participants.length, 1);
  console.log("Pilot Supabase adapter passed: new secret-key headers and 1201 paginated event rows.");
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }
  await new Promise((resolve) => mock.close(resolve));
}
