// Shared bits for the portal stub route handlers (src/app/api/portal/** and /api/auth/portal/*).
// Stubs fail on purpose when the portal's dev switch sends x-stub-fail: 1, outside production only.

export function stubShouldFail(request) {
  return process.env.NODE_ENV !== "production" && request.headers.get("x-stub-fail") === "1";
}

export function stubError(status, code, message) {
  return Response.json({ error: { code, message } }, { status });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
