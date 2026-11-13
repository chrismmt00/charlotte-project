"use client";

import { consumeFailNext } from "./useBusiness";

// Calls a /api/app stub. Throws on any non-2xx so every caller handles failure.
export async function api(url, { method = "POST", body } = {}) {
  const headers = { "content-type": "application/json" };
  if (consumeFailNext()) headers["x-klyvora-dev-fail"] = "1";
  const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Downloads a file from a stub (CSV export). Throws on failure.
export async function download(url, filename) {
  const headers = {};
  if (consumeFailNext()) headers["x-klyvora-dev-fail"] = "1";
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const blob = await res.blob();
  saveBlob(blob, filename);
}

export function saveBlob(blob, filename) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
