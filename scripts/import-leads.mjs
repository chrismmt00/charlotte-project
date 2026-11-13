import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { loadEnv } from "./env.mjs";
loadEnv(process.argv.includes("--production") ? "production" : "local");
const file = process.argv.find((a, i) => i > 1 && !a.startsWith("--"));
if (!file)
  throw new Error(
    "Usage: node scripts/import-leads.mjs leads.csv [--production] [--update]",
  );
const { prisma } = await import("../src/lib/prisma.js");
const rows = parse(fs.readFileSync(file), {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  max_record_size: 50000,
});
if (rows.length > 5000) throw new Error("Import at most 5,000 rows at a time");
const schema = z
  .object({
    business: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().or(z.literal("")),
    phone: z.string().max(50),
  })
  .refine((b) => b.email || b.phone);
const result = { imported: 0, updated: 0, skipped: 0 };
try {
  for (const row of rows) {
    const b = schema.safeParse({
      business: String(row.business || ""),
      name: String(row.name || row.business || ""),
      email: String(row.email || ""),
      phone: String(row.phone || "").replace(/[^\d+]/g, ""),
    });
    if (!b.success) {
      result.skipped++;
      continue;
    }
    const data = {
      ...b.data,
      message: String(row.notes || "").slice(0, 10000),
      source: "CSV import",
    };
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });
    if (existing) {
      if (process.argv.includes("--update")) {
        await prisma.lead.update({ where: { id: existing.id }, data });
        result.updated++;
      } else result.skipped++;
    } else {
      await prisma.lead.create({ data });
      result.imported++;
    }
  }
  await prisma.auditLog.create({
    data: {
      action: "leads.csv_imported",
      entity: "Lead",
      entityId: "csv",
      meta: result,
    },
  });
  console.log(result);
} finally {
  await prisma.$disconnect();
}
