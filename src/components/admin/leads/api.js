// Tiny fetch helper for the admin stubs. Returns { ok, status, data } and never throws.
// Dev only: `dev.fail = true` makes the next request fail so the failed states can be seen.

export const dev = { fail: false };

export async function api(method, url, body) {
  if (process.env.NODE_ENV !== "production" && dev.fail) {
    dev.fail = false;
    return { ok: false, status: 0, data: null };
  }
  try {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    const res = await fetch(url, {
      method,
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
