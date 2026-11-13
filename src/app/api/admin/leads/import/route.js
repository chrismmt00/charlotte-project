// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// POST /api/admin/leads/import   (multipart/form-data)
//   fields: file        CSV or XLSX, up to 5 MB
//           mapping     JSON { business, name, email, phone, offer, source, notes } -> column header, or "" to skip
//           duplicates  "update" | "skip" | "import"
//   -> 200 { imported: number, updated: number, skipped: number, source: "Import · <file name>" }
//   -> 422 { error: "invalid", message }   (missing file, file over 5 MB, required field not mapped)
// Every imported lead starts as New, owned by Chris. Until the back end parses the file itself, the stub
// trusts the counts the browser sends (rows, duplicates_found, missing_email) so the done step shows real numbers.
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid", message: "Send the file as multipart/form-data." }, { status: 422 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "invalid", message: "Pick a file to import." }, { status: 422 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "invalid", message: "That file is over 5 MB." }, { status: 422 });
  let mapping = {};
  try {
    mapping = JSON.parse(form.get("mapping") || "{}");
  } catch {}
  for (const f of ["business", "name", "email"]) {
    if (mapping[f] === "") return Response.json({ error: "invalid", message: `Map a column to ${f}; it is required.` }, { status: 422 });
  }
  const rows = Number(form.get("rows")) || 0;
  const dupes = Number(form.get("duplicates_found")) || 0;
  const missing = Number(form.get("missing_email")) || 0;
  const mode = form.get("duplicates") || "update";
  const valid = Math.max(0, rows - missing);
  const imported = mode === "import" ? valid : Math.max(0, valid - dupes);
  const updated = mode === "update" ? dupes : 0;
  return Response.json({ imported, updated, skipped: missing + (mode === "skip" ? dupes : 0), source: `Import · ${file.name}` });
}
