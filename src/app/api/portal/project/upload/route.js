// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST multipart/form-data { itemId, files[] }  ->  201 { received: <count> }
//   Content checklist upload. The real route stores files in Cloudflare R2 and ticks the checklist item.
//   413 { error: { code: "too_large" } } for a file over 50 MB.
import { UPLOAD_MAX_MB } from "@/lib/portal/sample";
import { stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(413, "too_large", `A file was over ${UPLOAD_MAX_MB} MB.`);
  let count = 1;
  try {
    const form = await request.formData();
    count = form.getAll("files").length || 1;
  } catch {}
  return Response.json({ received: count }, { status: 201 });
}
