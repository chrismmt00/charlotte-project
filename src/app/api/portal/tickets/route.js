// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// GET  /api/portal/tickets -> 200 { tickets, hours }
//   tickets: [{ id, subject, status: open|in-progress|closed, when, messages: [{ who, when, text }] }]
//   hours: { used, cap, resetsOn }
// POST { subject, message }            ->  201 { ticket }   new request; a person replies by email
// POST { ticketId, message }           ->  201 { message }  reply on an existing ticket
//   400 { error: { code: "subject_required" } }
import { HOURS, TICKETS } from "@/lib/portal/sample";
import { readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function GET(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not load requests.");
  return Response.json({ tickets: TICKETS, hours: HOURS });
}

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not send the request.");
  const body = await readJson(request);
  const message = String(body?.message || "").trim();
  if (body?.ticketId) {
    if (!message) return stubError(400, "message_required", "Write a reply first.");
    return Response.json({ message: { who: "You", when: "Just now", text: message } }, { status: 201 });
  }
  const subject = String(body?.subject || "").trim();
  if (!subject) return stubError(400, "subject_required", "Give it a subject so we can route it.");
  return Response.json(
    { ticket: { id: "TK-041", subject, status: "open", when: "Just now", messages: [{ who: "You", when: "Just now", text: message || "(no details)" }] } },
    { status: 201 }
  );
}
