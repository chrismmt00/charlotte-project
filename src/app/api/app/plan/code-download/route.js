// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/plan/code-download   Always available. A zip of the site as it runs today plus an invite to a GitHub repo
// under the owner's account. Downloading changes nothing about the plan.
// Request:  { email: string (required) }                       where to send the GitHub invite
// 200:      { downloadUrl: string | null, filename: "site-code.zip", inviteSentTo: string }
// 400:      { error: string }
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  const email = String((body && body.email) || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad("Enter an email address for the GitHub invite.");
  await delay(600);
  return Response.json({ downloadUrl: null, filename: "site-code.zip", inviteSentTo: email });
}
