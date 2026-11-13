import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const project = JSON.parse(fs.readFileSync(".vercel/project.json", "utf8"));
const auth = JSON.parse(
  fs.readFileSync(
    path.join(process.env.APPDATA, "com.vercel.cli", "Data", "auth.json"),
    "utf8",
  ),
);
if (!auth.token || project.projectName !== "klyvora")
  throw new Error("Link and authenticate the Klyvora Vercel project first");
const production = parseEnv(fs.readFileSync(".env.production", "utf8"));
async function api(route, method = "GET", body) {
  const response = await fetch(
    `https://api.vercel.com${route}${route.includes("?") ? "&" : "?"}teamId=${project.orgId}`,
    {
      method,
      headers: {
        authorization: `Bearer ${auth.token}`,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      `Vercel operation failed (${response.status}; ${data.error?.code || "unknown"})`,
    );
  return data;
}
const variables = Object.entries(production)
  .filter(
    ([key, value]) =>
      value && !key.startsWith("VERCEL_") && !key.includes("CONSULT"),
  )
  .map(([key, value]) => ({
    key,
    value,
    type: "encrypted",
    target: ["production"],
  }));
await api(
  `/v10/projects/${project.projectId}/env?upsert=true`,
  "POST",
  variables,
);
await api(`/v9/projects/${project.projectId}`, "PATCH", {
  nodeVersion: "24.x",
});
console.log(
  `Configured ${variables.length} encrypted production variables and Node.js 24; values hidden.`,
);
for (const name of ["klyvorastudio.com", "www.klyvorastudio.com"]) {
  try {
    await api(`/v10/projects/${project.projectId}/domains`, "POST", {
      name,
      ...(name.startsWith("www.")
        ? { redirect: "klyvorastudio.com", redirectStatusCode: 308 }
        : {}),
    });
    console.log(`Attached ${name}.`);
  } catch (e) {
    console.log(`Domain attachment: ${e.message}`);
  }
}
const config = await api("/v6/domains/klyvorastudio.com/config");
console.log(
  "Domain DNS status:",
  config.misconfigured ? "DNS changes required" : "configured",
);
console.log(
  "Recommended A records:",
  JSON.stringify(config.recommendedIPv4 || []),
);
console.log(
  "Recommended CNAME records:",
  JSON.stringify(config.recommendedCNAME || []),
);
