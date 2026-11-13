import { getSettings, DEFAULT_VALUES, numberError } from "@/lib/admin/sample-settings";

// STUB until the back end ships this route. The real route reads the role from the session (never from the
// request), writes an audit row for every change, and returns 403 { error: { code: "owner_only" } } when a builder
// edits anything but their own notification settings.
//
// GET /api/admin/settings
//   200 -> { me, values, integrations, team, catalog, history, proposalTemplates, emailTemplates, lastRun }
//          (shape documented in src/lib/admin/sample-settings.js)
// PATCH /api/admin/settings
//   body { values: { "<section>.<field>": string | boolean } }   section = general | targets | outreach | notify
//     200 -> { values }  the merged values
//     400 -> { error: { code: "invalid", message, fields: { [key]: message } } }
//   body { template: { id, subject?, body } }
//     200 -> { template: { id, subject?, body, custom: true } }
//     400 when body is empty
export function GET() {
  return Response.json(getSettings());
}

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  if (body?.template) {
    const t = body.template;
    if (!t.id || !String(t.body || "").trim()) {
      return Response.json({ error: { code: "invalid", message: "A template needs a body." } }, { status: 400 });
    }
    return Response.json({ template: { id: t.id, subject: t.subject, body: t.body, custom: true } });
  }
  const incoming = body?.values;
  if (!incoming || typeof incoming !== "object") {
    return Response.json({ error: { code: "invalid", message: "Send { values } or { template }." } }, { status: 400 });
  }
  const fields = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (!(k in DEFAULT_VALUES)) fields[k] = "Unknown setting.";
    else {
      const e = numberError(k, v);
      if (e) fields[k] = e;
    }
  }
  if (Object.keys(fields).length) {
    return Response.json({ error: { code: "invalid", message: "Some fields need a fix.", fields } }, { status: 400 });
  }
  return Response.json({ values: { ...DEFAULT_VALUES, ...incoming } });
}
