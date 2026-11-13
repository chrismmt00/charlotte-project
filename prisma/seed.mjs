import { OFFERS, RESTAURANT_ADD_ONS } from "../src/lib/offers.js";
import { loadEnv } from "../scripts/env.mjs";
loadEnv(process.argv.includes("--production") ? "production" : "local");
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }),
});
try {
  let i = 0;
  for (const entry of [
    ...OFFERS,
    ...RESTAURANT_ADD_ONS.map((a) => ({
      ...a,
      slug: "restaurants",
      addOnOf: "RC,RK",
      monthlyRequired: true,
    })),
  ]) {
    const {
      setup,
      monthly,
      code,
      name,
      slug,
      monthlyRequired,
      setupFrom,
      addOnOf,
      ...data
    } = entry;
    await db.offer.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name,
        slug,
        setupCents: Math.round(setup * 100),
        monthlyCents: Math.round(monthly * 100),
        monthlyRequired: !!monthlyRequired,
        setupFrom: !!setupFrom,
        addOnOf: addOnOf || null,
        sortOrder: i++,
        data,
      },
    });
  }
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const emails = new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (owner) emails.add(owner);
  for (const address of emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
      throw new Error("Invalid admin email configuration");
    await db.user.upsert({
      where: { email: address },
      update: {},
      create: {
        email: address,
        name: address.split("@")[0].replaceAll(".", " "),
        role: address === owner ? "owner" : "builder",
      },
    });
  }
  await db.setting.upsert({
    where: { key: "general" },
    update: {},
    create: {
      key: "general",
      value: {
        signedTarget: 20000,
        cashTarget: 17000,
        mrrTarget: 1500,
        weeklyLow: 65,
        weeklyHigh: 95,
        company: "Klyvora",
        url: "https://klyvorastudio.com",
        supportHours: 1,
      },
    },
  });
  console.log(
    `Seeded ${i} offers and configured admin accounts. Existing data and edited prices preserved.`,
  );
} catch {
  console.error(
    "Seed failed; inspect configuration and database availability.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
