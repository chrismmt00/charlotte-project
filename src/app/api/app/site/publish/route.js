// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/site/publish   Publish the edited hours, info, notice, page text and photo order. Live in about a minute.
// Request:  { hours: { day: string, open: string, close: string, closed: boolean }[],
//             notice: string,
//             info: { name, tagline, phone, email, address, instagram },
//             pages: { id: string, headline: string, intro: string, cta: string }[],
//             photos: string[] }                                   photo ids, first is the hero
// 200:      { published: true, liveInSeconds: 60 }
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body) return bad("Nothing to publish.");
  await delay(600);
  return Response.json({ published: true, liveInSeconds: 60 });
}
