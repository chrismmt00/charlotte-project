// Helpers for the /api/app stub handlers. Delete with the stubs when the back end ships these routes.

// In development the client admin can force the next request to fail (header set by the dev panel),
// so every form's "failed" state can be seen. Never active in production.
export function devFail(request) {
  if (process.env.NODE_ENV !== "production" && request.headers.get("x-klyvora-dev-fail")) {
    return Response.json({ error: "Forced failure (development switch)." }, { status: 500 });
  }
  return null;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function bad(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let seq = 1000;
export function newId(prefix) {
  seq += 1;
  return `${prefix}_${seq}`;
}
