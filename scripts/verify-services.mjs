import { loadEnv } from "./env.mjs";
loadEnv(process.argv.includes("--production") ? "production" : "local");
const { default: Stripe } = await import("stripe");
const { default: nodemailer } = await import("nodemailer");
const results = await Promise.allSettled([
  (async () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!/^(sk|rk)_(test|live)_/.test(key || ""))
      return "Stripe: key format is not recognized; verify the configured secret key.";
    await new Stripe(key, { timeout: 15000 }).balance.retrieve();
    return "Stripe: authenticated (read-only balance check).";
  })(),
  (async () => {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    await transport.verify();
    transport.close();
    return "SMTP: authenticated; no email sent.";
  })(),
  (async () => {
    if (
      !process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID ||
      !process.env.CLOUDFLARE_IMAGES_API_TOKEN
    )
      return "Cloudflare Images: not configured.";
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v1/stats`,
      {
        headers: {
          authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!r.ok) throw new Error("Cloudflare authentication failed");
    const d = await r.json();
    if (!d.success) throw new Error("Cloudflare authentication failed");
    return "Cloudflare Images: authenticated (read-only check).";
  })(),
]);
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  console.log(
    r.status === "fulfilled"
      ? r.value
      : ["Stripe", "SMTP", "Cloudflare Images"][i] +
          ": verification failed; check provider credentials and permissions.",
  );
}
console.log(
  "Stripe webhook: " +
    (process.env.STRIPE_WEBHOOK_SECRET
      ? "configured"
      : "signing secret still required"),
);
console.log(
  "Private file storage: " +
    (process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID
      ? "configured"
      : "R2 bucket and credentials still required"),
);
