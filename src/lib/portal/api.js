// Fetch helper for portal mutations. Throws on network errors and non-2xx responses so callers
// can show their failed state. In development the portal's dev switch can ask stubs to fail
// (header x-stub-fail: 1); the real back end ignores the header.

export async function portalApi(path, { method = "POST", body, fail = false } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {};
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (fail && process.env.NODE_ENV !== "production") headers["x-stub-fail"] = "1";
  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.error?.code || null;
    throw err;
  }
  return data;
}
