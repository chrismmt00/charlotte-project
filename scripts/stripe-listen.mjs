import fs from "node:fs";
import { spawn } from "node:child_process";
import { loadEnv } from "./env.mjs";
loadEnv("local");
if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || ""))
  throw new Error("Local webhook forwarding requires a Stripe test-mode key.");
const configure = process.argv.includes("--configure");
const args = [
  "listen",
  "--skip-update",
  ...(configure
    ? ["--print-secret"]
    : ["--forward-to", "localhost:3000/api/stripe/webhook"]),
];
const child = spawn("stripe", args, {
  env: { ...process.env, STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (data) => {
    output += data.toString();
    if (!configure)
      process.stdout.write(
        data.toString().replace(/whsec_\S+/g, "[signing secret hidden]"),
      );
  });
child.on("error", () => {
  console.error("Stripe CLI is not available.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  if (configure) {
    const secret = output.match(/whsec_[A-Za-z0-9]+/)?.[0];
    if (code || !secret) {
      console.error(
        "Could not obtain a test signing secret; verify Stripe CLI authentication.",
      );
      process.exitCode = 1;
      return;
    }
    let t = fs.readFileSync(".env.local", "utf8");
    const line = `STRIPE_WEBHOOK_SECRET=${JSON.stringify(secret)}`;
    t = /^STRIPE_WEBHOOK_SECRET=.*$/m.test(t)
      ? t.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, () => line)
      : t + "\n" + line + "\n";
    fs.writeFileSync(".env.local", t);
    console.log(
      "Configured the Stripe CLI test signing secret in the existing .env.local.",
    );
  } else process.exitCode = code || 0;
});
