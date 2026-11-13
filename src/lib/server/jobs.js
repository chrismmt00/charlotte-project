import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/brevo";
import { issueInvoice, startSubscription } from "@/lib/stripe";

export async function runJobs(limit = 10) {
  const results = [];
  for (let i = 0; i < limit; i++) {
    const now = new Date();
    const job = await prisma.$transaction(async (db) => {
      const rows =
        await db.$queryRaw`SELECT "id" FROM "Job" WHERE (("status"='pending' AND "runAt"<=${now}) OR ("status"='running' AND "lockedAt"<${new Date(now.getTime() - 300000)})) AND "attempts"<8 ORDER BY "runAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!rows.length) return null;
      return db.job.update({
        where: { id: rows[0].id },
        data: { status: "running", lockedAt: now, attempts: { increment: 1 } },
      });
    });
    if (!job) break;
    try {
      if (job.type === "email") await sendEmail(job.payload);
      else if (job.type === "invoice") await issueInvoice(job.payload.id);
      else if (job.type === "subscription")
        await startSubscription(job.payload.id);
      else throw new Error("Unsupported job type");
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "complete", lockedAt: null, lastError: null },
      });
      results.push({ id: job.id, status: "complete" });
    } catch {
      // Store a non-sensitive summary only; provider responses may include credentials and recipients.
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 8 ? "failed" : "pending",
          lockedAt: null,
          lastError:
            "Provider delivery failed; verify configuration and retry.",
          runAt: new Date(
            Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts),
          ),
        },
      });
      results.push({ id: job.id, status: "retry" });
    }
  }
  await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
  });
  return results;
}
