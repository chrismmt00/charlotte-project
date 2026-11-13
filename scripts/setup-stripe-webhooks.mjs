import fs from "node:fs";
import { loadEnv } from "./env.mjs";
loadEnv("production");
const base = process.argv[2];
if (!base || !base.startsWith("https://"))
  throw new Error("Pass the verified production HTTPS URL");
const health = await fetch(`${base}/api/health`, {
  signal: AbortSignal.timeout(20000),
});
if (!health.ok || (await health.json()).backend !== true)
  throw new Error("Deploy and verify the backend before registering webhooks");
const { default: Stripe } = await import("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 15000 });
function save(key, value) {
  let t = fs.readFileSync(".env.production", "utf8");
  const line = key + "=" + JSON.stringify(value);
  const pattern = new RegExp("^" + key + "=.*$", "m");
  t = pattern.test(t)
    ? t.replace(pattern, () => line)
    : t.trimEnd() + "\n" + line + "\n";
  fs.writeFileSync(".env.production", t);
  process.env[key] = value;
}
for (const connect of [false, true]) {
  const key = connect
    ? "STRIPE_CONNECT_WEBHOOK_SECRET"
    : "STRIPE_WEBHOOK_SECRET";
  const idKey = connect
    ? "STRIPE_CONNECT_WEBHOOK_ENDPOINT_ID"
    : "STRIPE_WEBHOOK_ENDPOINT_ID";
  const url = `${base}/api/stripe/webhook`;
  if (process.env[key] && process.env[idKey]) {
    await stripe.webhookEndpoints.update(process.env[idKey], { url });
    console.log(
      connect ? "Connect webhook URL updated." : "Billing webhook URL updated.",
    );
    continue;
  }
  try {
    const endpoint = await stripe.webhookEndpoints.create(
      {
        url,
        connect,
        enabled_events: connect
          ? ["account.updated"]
          : [
              "invoice.paid",
              "invoice.payment_failed",
              "invoice.finalized",
              "invoice.voided",
              "customer.subscription.created",
              "customer.subscription.updated",
              "customer.subscription.deleted",
            ],
        metadata: { project: "klyvora" },
      },
      {
        idempotencyKey: `klyvora-webhook:${connect ? "connect" : "billing"}:${new URL(base).hostname}`,
      },
    );
    save(key, endpoint.secret);
    save(idKey, endpoint.id);
    console.log(
      connect
        ? "Registered Connect webhook; signing secret saved without display."
        : "Registered billing webhook; signing secret saved without display.",
    );
  } catch {
    console.error(
      connect
        ? "Connect webhook needs Stripe platform access; verify Connect is enabled."
        : "Billing webhook registration failed; verify Stripe permissions.",
    );
    process.exitCode = 1;
  }
}
