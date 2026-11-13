// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST { key: milestone|invoice|ticket|text, on: boolean }  ->  200 { saved: true }
import { readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not save.");
  const body = await readJson(request);
  if (!body?.key) return stubError(400, "invalid", "Missing key.");
  return Response.json({ saved: true });
}
