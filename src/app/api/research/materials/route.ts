import { json, requireAdmin, respond } from "@/lib/research/api";
import { dataset } from "@/lib/research/materials";
export const runtime = "nodejs";
export async function GET(request: Request) { return respond(async () => { requireAdmin(request); return json(dataset); }); }
