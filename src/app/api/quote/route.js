import { dispatch } from "@/lib/server/route";
import { body, checkOrigin, errorResponse } from "@/lib/server/http";
import { inquirySchema, leadPayload } from "@/lib/marketing/inquiry";

// Public adapter only. The existing handler retains rate limits, honeypot handling,
// transactional lead/activity persistence, confirmation email, and owner notification.
export async function POST(request) {
  try {
    checkOrigin(request);
    const inquiry = await body(request, inquirySchema);
    const url = new URL("/api/leads", request.url);
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    headers.set("content-type", "application/json");
    return dispatch(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify(leadPayload(inquiry)),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
