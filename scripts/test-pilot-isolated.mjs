// Run the existing Chinese pilot E2E suite against an in-memory PostgREST test
// adapter. No real Supabase service or existing local pilot file is touched.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
const tables = { pilot_invites: [], pilot_events: [], pilot_decisions: [], pilot_surveys: [] };
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost"), table = url.pathname.split("/").at(-1);
  if (req.headers.apikey !== "sb_secret_isolated_qa" || !(table in tables)) return res.writeHead(401).end();
  let body = ""; for await (const part of req) body += part;
  const matches = row => [...url.searchParams].every(([key, value]) => !value.startsWith("eq.") || String(row[key]) === value.slice(3));
  let rows = tables[table].filter(matches);
  if (req.method === "POST") {
    const value = JSON.parse(body), entries = Array.isArray(value) ? value : [value];
    const conflict = url.searchParams.get("on_conflict")?.split(",");
    for (const row of entries) if (!conflict || !tables[table].some(old => conflict.every(key => old[key] === row[key]))) tables[table].push(row);
    rows = entries;
  } else if (req.method === "PATCH") { const changes = JSON.parse(body); rows.forEach(row => Object.assign(row, changes)); }
  else if (req.method === "DELETE") { tables[table] = tables[table].filter(row => !matches(row)); rows = []; }
  else if (req.method === "GET") {
    const order = url.searchParams.get("order")?.split(",") ?? [];
    rows.sort((a,b) => { for (const spec of order) { const [key,dir] = spec.split("."); if (a[key] !== b[key]) return (a[key] < b[key] ? -1 : 1) * (dir === "desc" ? -1 : 1); } return 0; });
    const offset = Number(url.searchParams.get("offset") ?? 0), limit = Math.min(Number(url.searchParams.get("limit") ?? 500),500); rows = rows.slice(offset,offset+limit);
  }
  res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(rows));
});
await new Promise(resolve => mock.listen(0,"127.0.0.1",resolve));
const probe = createServer(); await new Promise(resolve => probe.listen(0,"127.0.0.1",resolve)); const port=probe.address().port; await new Promise(resolve=>probe.close(resolve));
const env = { ...process.env, SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`, SUPABASE_SECRET_KEY:"sb_secret_isolated_qa", PILOT_ADMIN_KEY:"pilot-isolated-qa", PILOT_RECRUITMENT_OPEN:"1", PILOT_CONTACT:"Local QA fixture", PILOT_DATA_REGION:"Local memory", PILOT_RETENTION_DAYS:"1", PILOT_NEXT_DIST_DIR:".next", PILOT_BASE_URL:`http://127.0.0.1:${port}` };
const app=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{env,stdio:["ignore","pipe","pipe"]}); let logs=""; app.stdout.on("data",chunk=>logs+=chunk);app.stderr.on("data",chunk=>logs+=chunk);
try {
  let ready=false;
  for(let i=0;i<60;i++){try{const r=await fetch(`${env.PILOT_BASE_URL}/api/pilot/admin/export?kind=json`,{headers:{Authorization:`Bearer ${env.PILOT_ADMIN_KEY}`}});if(r.ok){ready=true;break;}}catch{} if(app.exitCode!==null)break; await new Promise(resolve=>setTimeout(resolve,150));}
  assert.ok(ready,logs);
  const test=spawn(process.execPath,["scripts/test-pilot-e2e.mjs"],{env,stdio:"inherit"});const code=await new Promise(resolve=>test.on("exit",resolve));assert.equal(code,0,"Existing pilot E2E failed");
  console.log("Chinese pilot regression used an isolated in-memory adapter; existing local participant data was untouched.");
}finally{if(app.exitCode===null){app.kill("SIGTERM");await new Promise(resolve=>app.on("exit",resolve));} await new Promise(resolve=>mock.close(resolve));}
