import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function sendEmail({
  to,
  subject,
  text,
  templateId,
  params = {},
  template,
}) {
  if (template) {
    const saved = await prisma.setting.findUnique({
      where: { key: `template:${template}` },
    });
    if (saved) {
      const values = {
        first_name: to.split("@")[0],
        sender_name: "Klyvora",
        sender_phone: "(919) 391-0982",
        message: text,
        ...params,
      };
      const render = (value) =>
        String(value).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, key) => {
          if (values[key] === undefined)
            throw new Error("Email template has an unsupported variable");
          return String(values[key]);
        });
      subject = render(saved.value.subject || subject);
      text = render(saved.value.body || text);
      templateId = saved.value.templateId || templateId;
    }
  }
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("Email sender is not configured");
  if (process.env.BREVO_API_KEY) {
    const match = /^(.*?)\s*<([^>]+)>$/.exec(from);
    const sender = match
      ? { name: match[1].trim(), email: match[2] }
      : { email: from };
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        ...(templateId
          ? { templateId, params }
          : {
              subject,
              textContent: text,
              htmlContent: `<p>${escape(text).replaceAll("\n", "<br>")}</p>`,
            }),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Email provider rejected delivery");
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS)
    throw new Error("SMTP is not configured");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    await transport.sendMail({ from, to, subject, text });
  } finally {
    transport.close();
  }
}
