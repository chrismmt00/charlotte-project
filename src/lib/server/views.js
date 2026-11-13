import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "./access";
import { admin } from "./admin";
import { billing } from "./billing";
import { getSettings } from "./settings";
import { getOutreach } from "./outreach";
import { prisma } from "@/lib/prisma";
import { ticketDTO, today } from "./data";

export async function pageUser(scope = "admin", owner = false) {
  try {
    return await requireUser(scope, owner);
  } catch (e) {
    if (e.status === 401)
      redirect(scope === "admin" ? "/admin/signin" : "/portal/signin");
    if (e.status === 403) redirect(scope === "admin" ? "/portal" : "/admin");
    throw e;
  }
}
export async function adminData(section) {
  const user = await pageUser("admin", section === "settings");
  if (section === "settings") return getSettings(user);
  if (section === "outreach") return getOutreach();
  const req = new Request(`http://internal/api/admin/${section}`);
  if (["invoices", "subscriptions"].includes(section))
    return billing(req, [section], user);
  return admin(req, [section], user);
}
export async function supportTicket(id) {
  await pageUser();
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: { client: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  return t ? ticketDTO(t) : null;
}
export async function supportClients() {
  await pageUser();
  return (await prisma.client.findMany()).map((c) => ({
    id: c.id,
    name: c.business,
    planLabel: c.offerCode,
    capHours: c.data.supportHours || 1,
  }));
}
export async function getDemo(id) {
  await pageUser();
  const d = await prisma.demo.findUnique({ where: { id } });
  return d
    ? {
        ...d.data,
        id: d.id,
        status: d.status,
        services: d.data.services || [],
        sources: d.data.sources || [],
      }
    : null;
}
export { today };
