import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "./access";
import { required } from "./http";

export const iso = (d) => (d ? new Date(d).toISOString() : null);
export const day = (d) => iso(d)?.slice(0, 10) || null;
export const today = () => day(new Date());
export const offerDTO = (o) => ({
  ...o.data,
  code: o.code,
  slug: o.slug,
  name: o.name,
  setup: o.setupCents / 100,
  monthly: o.monthlyCents / 100,
  setupFrom: o.setupFrom,
  monthlyRequired: o.monthlyRequired,
  addOnOf: o.addOnOf,
});
export async function catalog(db = prisma) {
  return (
    await db.offer.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    })
  ).map(offerDTO);
}
export const leadDTO = (l) => ({
  ...l.data,
  id: l.id,
  business: l.business,
  name: l.name,
  email: l.email,
  phone: l.phone,
  siteUrl: l.siteUrl,
  message: l.message,
  notes: l.message,
  source: l.source,
  offerCode: l.offerCode,
  offer: l.offerCode || "Not sure yet",
  status: l.status,
  owner: l.owner,
  score: l.score,
  tags: l.tags,
  next: l.nextActionAt ? day(l.nextActionAt) : "—",
  when: day(l.createdAt),
  ageHours: (Date.now() - new Date(l.createdAt).getTime()) / 3600000,
  nextAction: l.data.nextAction || null,
  timeline: (l.activities || []).map((a) => ({
    id: a.id,
    kind: a.type,
    title: a.type,
    body: a.body,
    meta: day(a.createdAt),
  })),
  proposals: l.proposals || [],
  siteCheck: l.data.siteCheck || null,
  lost: null,
});
export function invoiceDTO(i) {
  const status =
    i.status === "Due" && i.dueAt && new Date(i.dueAt) < new Date()
      ? "Overdue"
      : i.status;
  return {
    ...i.data,
    id: i.id,
    number: i.id,
    clientId: i.clientId,
    client: i.client?.business || "",
    forLabel: i.data.memo || i.kind,
    kind: i.kind,
    due: day(i.dueAt),
    amount: i.amountCents / 100,
    paid: i.paidCents / 100,
    status,
    trigger: "",
    billingEmail:
      i.client?.contacts?.find((c) => c.role === "signer")?.email || "",
    stripe: i.stripeId,
    lines: i.data.lines || [
      {
        description: i.data.memo || i.kind,
        note: "",
        amount: i.amountCents / 100,
      },
    ],
    history: i.data.history || [],
    plan: i.data.plan || null,
  };
}
export const subscriptionDTO = (s) => ({
  id: s.id,
  client: s.client?.business || "",
  clientId: s.clientId,
  since: day(s.startedAt),
  planLabel: s.offerCode,
  offerCode: s.offerCode,
  price: s.mrrCents / 100,
  usage: 0,
  status:
    {
      active: "Active",
      pending: "Starts at launch",
      past_due: "Past due",
      paused: "Paused",
      canceled: "Canceled",
    }[s.status] || s.status,
  required: ["RC", "RK"].includes(s.offerCode),
  next: s.startedAt ? null : "on launch",
  card: "Managed through Stripe",
  includes: [],
  optionalNote: "",
  usageRows: [],
  charges: [],
});
export function projectDTO(p) {
  return {
    id: p.id,
    clientId: p.clientId,
    client: p.client?.business || "",
    offerCode: p.offerCode,
    offer: p.offerCode,
    setup: p.setupCents / 100,
    monthly: p.client?.subscriptions?.[0]?.mrrCents / 100 || 0,
    monthlyRequired: ["RC", "RK"].includes(p.offerCode),
    monthlyChosen: p.client?.monthly || false,
    startedAt: day(p.createdAt),
    stage: p.status,
    owner: p.client?.owner || "",
    next: "",
    milestones: (p.milestones || []).map((m) => ({
      id: ["kickoff", "demo", "launch"][m.position],
      databaseId: m.id,
      label: m.name,
      percent: m.percent,
      amount: m.amountCents / 100,
      status: m.acceptedAt
        ? "done"
        : ["kickoff", "demo", "launch"][m.position] === p.status
          ? "current"
          : "todo",
      target: null,
      note: m.invoice?.status || "Not yet invoiced",
      invoice: m.invoice?.id || null,
    })),
    tasks: (p.tasks || []).map((t) => ({
      id: t.id,
      ...t.data,
      title: t.title,
      status: t.done ? "Done" : t.data.status || "To do",
      who: t.assignee,
      milestone: "kickoff",
      due: day(t.dueAt),
      est: (t.data.estMinutes || 0) / 60,
      blocked: !!t.data.blocked,
      desc: t.data.desc || "",
      checklist: t.data.checklist || [],
      time: (t.data.time || []).map((e) => ({ ...e, hours: e.minutes / 60 })),
    })),
  };
}
export function proposalDTO(p) {
  return {
    ...p.data,
    id: p.id,
    token: p.token,
    leadId: p.leadId,
    clientId: p.clientId,
    name: p.name,
    business: p.business,
    email: p.email,
    offerCode: p.offerCode,
    status: p.status,
    monthly: p.monthly,
    quote: (p.items.lines[0]?.setupCents || p.setupCents) / 100,
    created: day(p.createdAt),
    signatureName: p.signatureName || "",
    sentNote: p.validUntil ? `Expires ${day(p.validUntil)}` : "Not sent",
    views: p.data.views || 0,
    addOns: p.data.addOns || {},
    scopeOff: p.data.scopeOff || [],
    extras: p.data.extras || "",
    caps: p.data.caps || {},
    validDays: p.data.validDays || 14,
    earliestStart: p.data.earliestStart || "",
    termsTemplate: p.data.termsTemplate || "standard",
    contactName: p.data.contactName || p.lead?.name || "",
    headline: p.data.headline || p.name,
  };
}
export function publicProposalDTO(p) {
  // Explicit public allowlist: internal notes, IDs, addresses and pricing administration stay private.
  const state =
    p.status === "Accepted"
      ? "signed"
      : p.status === "Declined"
        ? "declined"
        : p.validUntil && p.validUntil < new Date()
          ? "expired"
          : "open";
  return {
    id: p.id,
    token: p.token,
    state,
    business: p.business,
    contactFirst: p.data.contactName || p.lead?.name || "",
    email: p.email,
    offerCode: p.offerCode,
    headline: p.data.headline || p.name,
    preparedBy: "Klyvora",
    validUntil: day(p.validUntil),
    earliestStart: p.data.earliestStart || "To be agreed",
    timeline: "As agreed in this proposal",
    scope: p.items.scope || [],
    extras: p.data.extras || "",
    caps: p.data.caps || {},
    addOns: p.data.addOns || {},
    monthly: p.monthly,
    signedAt: iso(p.acceptedAt),
    signatureName: p.signatureName || "",
    quote: p.setupCents / 100,
    setup: p.setupCents / 100,
    monthlyAmount: p.monthlyCents / 100,
    terms: p.terms,
    lines: p.items.lines || [],
  };
}
export function clientDTO(c) {
  const sub = c.subscriptions?.[0];
  const contacts = (c.contacts || []).map((x) => ({
    id: x.id,
    name: x.name,
    email: x.email,
    phone: x.phone,
    role: x.role,
    primary: x.role === "signer",
    access: "Active",
    gets: "Project updates",
  }));
  return {
    ...c.data,
    id: c.id,
    leadId: c.leadId,
    business: c.business,
    contact: contacts[0]?.name || "",
    since: day(c.createdAt),
    source: c.lead?.source || "Direct",
    offerCode: c.offerCode,
    offer: c.offerCode,
    stage:
      {
        kickoff: "In build",
        demo: "Demo review",
        launch: "In build",
        accepted: "Live",
      }[c.stage] || c.stage,
    owner: c.owner,
    monthly: {
      on: c.monthly,
      required: ["RC", "RK"].includes(c.offerCode),
      price: (sub?.mrrCents || 0) / 100,
      status:
        sub?.status === "active"
          ? "running"
          : c.monthly
            ? "starts at launch"
            : "none",
    },
    next: "",
    mrr: sub?.status === "active" ? sub.mrrCents / 100 : 0,
    legalName: c.data.legalName || c.business,
    address: c.data.address || "",
    domain: c.data.domain || "",
    template: c.data.template ?? true,
    stripe: {
      customerId: c.stripeCustomerId,
      connect: {
        status: c.connectStatus,
        accountId: c.stripeConnectedAccountId,
      },
    },
    build: c.projects?.[0]?.setupCents / 100 || 0,
    milestones: c.projects?.[0] ? projectDTO(c.projects[0]).milestones : [],
    invoices: (c.invoices || []).map(invoiceDTO),
    contacts,
    portalUsers: contacts,
    files: (c.files || []).map((f) => [f.type, f.name, day(f.createdAt)]),
    events: [],
    tasks: [],
    tickets: {
      open: c.tickets?.filter((t) => t.status !== "Resolved").length || 0,
    },
    addOns: [],
    notes: c.data.notes || "",
    notesSavedAt: null,
    pinned: [],
  };
}
export const ticketDTO = (t) => ({
  ...t.data,
  id: t.id,
  clientId: t.clientId,
  client: t.client?.business || "",
  subject: t.subject,
  status: t.status === "Resolved" ? "Closed" : t.status,
  priority: t.priority,
  owner: t.data.owner || "",
  offerCode: t.client?.offerCode || "",
  plan: !!t.client?.monthly,
  hours: t.minutes / 60,
  when: day(t.createdAt),
  ageHours: (Date.now() - t.createdAt.getTime()) / 3600000,
  messages: (t.messages || []).map((m) => ({
    id: m.id,
    who: m.who,
    text: m.text,
    body: m.text,
    when: day(m.createdAt),
    internal: m.internal,
  })),
  assigned: t.data.owner || "",
  thread: (t.messages || []).map((m) => ({
    id: m.id,
    kind: m.internal ? "internal" : "team",
    who: m.who,
    when: day(m.createdAt),
    text: m.text,
    files: [],
  })),
  time: (t.data.time || []).map((e) => ({ ...e, hours: e.minutes / 60 })),
  requester: t.data.requester || t.client?.business || "Client",
  files: [],
});
export const clientInclude = {
  contacts: true,
  subscriptions: true,
  projects: { include: { milestones: true } },
  invoices: true,
  tickets: true,
  files: true,
  lead: true,
};
export async function listLeads() {
  await requireUser();
  return (
    await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 1000 })
  ).map(leadDTO);
}
export async function getLead(id) {
  await requireUser();
  const l = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      proposals: true,
    },
  });
  return l ? leadDTO(l) : null;
}
export async function listClients() {
  await requireUser();
  return (
    await prisma.client.findMany({
      include: clientInclude,
      orderBy: { createdAt: "desc" },
    })
  ).map(clientDTO);
}
export async function getClient(id) {
  await requireUser();
  const c = await prisma.client.findUnique({
    where: { id },
    include: clientInclude,
  });
  return c ? clientDTO(c) : null;
}
export async function getPublicProposal(token) {
  const p = await prisma.proposal.findFirst({
    where: { token, status: { not: "Draft" } },
    include: { lead: true },
  });
  return p ? publicProposalDTO(p) : null;
}
export async function metrics() {
  const week = new Date();
  week.setUTCHours(0, 0, 0, 0);
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const [
    signed,
    cash,
    mrr,
    contactsThisWeek,
    overdueInvoices,
    openTickets,
    activeClients,
    settings,
  ] = await Promise.all([
    prisma.proposal.aggregate({
      where: { status: "Accepted" },
      _sum: { setupCents: true },
    }),
    prisma.invoice.aggregate({
      where: { paidCents: { gt: 0 }, kind: { notIn: ["hardware", "usage"] } },
      _sum: { paidCents: true },
    }),
    prisma.subscription.aggregate({
      where: { status: "active" },
      _sum: { mrrCents: true },
    }),
    prisma.activity.count({
      where: {
        createdAt: { gte: week },
        type: { in: ["call", "email", "visit", "Call", "Email", "Visit"] },
      },
    }),
    prisma.invoice.count({
      where: { status: "Due", dueAt: { lt: new Date() } },
    }),
    prisma.ticket.count({ where: { status: { not: "Resolved" } } }),
    prisma.client.count({
      where: { subscriptions: { some: { status: "active" } } },
    }),
    prisma.setting.findUnique({ where: { key: "general" } }),
  ]);
  const s = settings?.value || {};
  return {
    signed: (signed._sum.setupCents || 0) / 100,
    cash: (cash._sum.paidCents || 0) / 100,
    mrr: (mrr._sum.mrrCents || 0) / 100,
    targets: {
      signed: s.signedTarget || 20000,
      cash: s.cashTarget || 17000,
      mrr: s.mrrTarget || 1500,
    },
    contactsThisWeek,
    overdueInvoices,
    openTickets,
    activeClients,
  };
}
export async function getDashboard() {
  await requireUser();
  const tasks = await prisma.task.findMany({
    where: { done: false },
    include: { project: { include: { client: true } } },
    take: 20,
    orderBy: { dueAt: "asc" },
  });
  return {
    metrics: await metrics(),
    leads: await listLeads(),
    tasks: tasks.map((t) => ({
      id: t.id,
      text: t.title,
      from: t.project.client.business,
      who: t.assignee,
      due: day(t.dueAt) || "No due date",
      urgent: !!t.dueAt && t.dueAt < new Date(),
    })),
    outreach: {
      ranAt: "not run yet",
      found: 0,
      foundGoal: 10,
      replies: 0,
      toApprove: await prisma.approval.count({ where: { status: "pending" } }),
      demosInProgress: await prisma.demo.count({
        where: { status: "building" },
      }),
    },
  };
}
export async function portalSnapshot(user) {
  const c = required(
    await prisma.client.findUnique({
      where: { id: user.contact.clientId },
      include: {
        ...clientInclude,
        projects: {
          orderBy: { createdAt: "desc" },
          include: {
            tasks: true,
            milestones: {
              orderBy: { position: "asc" },
              include: { invoice: true },
            },
          },
        },
        tickets: {
          include: {
            messages: {
              where: { internal: false },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    }),
    "Client",
  );
  const p = c.projects[0];
  const sub = c.subscriptions[0];
  const invoices = c.invoices.map((i) => ({
    id: i.id,
    name: i.data.memo || i.kind,
    percent: p?.milestones.find((m) => m.id === i.milestoneId)?.percent || 0,
    amount: i.amountCents / 100,
    status:
      i.status === "Paid" ? "paid" : i.status === "Draft" ? "not-yet" : "due",
    dueLabel: day(i.dueAt) || "Not yet due",
    note: "",
    receiptUrl:
      i.status === "Paid" ? `/api/portal/invoices/${i.id}/receipt` : null,
  }));
  return {
    privateUploadsEnabled:process.env.PRIVATE_UPLOADS_ENABLED==="true"&&!!process.env.R2_BUCKET&&!!process.env.R2_ACCESS_KEY_ID,
    uploadEmail:process.env.OWNER_EMAIL||"contact@klyvorastudio.com",
    client: {
      id: c.id,
      business: c.business,
      name: user.name || user.contact.name,
      initials: c.business.slice(0, 2).toUpperCase(),
      domain: c.data.domain || "",
      signer: user.contact.role === "signer",
      firstName: user.contact.name.split(" ")[0],
      signerName: user.contact.name,
      email: user.contact.email,
      phone: user.contact.phone,
      kind: c.kind,
    },
    project: {
      id: p?.id || null,
      offerCode: c.offerCode,
      stage: p?.status || "kickoff",
      monthlyChosen: c.monthly,
      name: p?.name || "Your project",
      setup: (p?.setupCents || 0) / 100,
      previewUrl: p?.data.previewUrl || "",
      liveUrl: c.data.liveUrl || "",
      domain: c.data.domain || "",
      repoUrl: c.data.repoUrl || "",
    },
    checklist: (p?.tasks || [])
      .filter((t) => t.clientTask)
      .map((t) => ({
        id: t.id,
        title: t.title,
        label: t.title,
        done: t.done,
        status: t.done ? "received" : "needed",
        state: t.done ? "received" : "needed",
      })),
    files: c.files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      note: day(f.createdAt),
      url: `/api/portal/files/${f.id}`,
    })),
    team: [],
    timeline: [],
    invoices,
    card: { brand: "Managed in Stripe", last4: "", exp: "" },
    plan: {
      monthly: (sub?.mrrCents || 0) / 100,
      status: sub?.status || "none",
      required: ["RC", "RK"].includes(c.offerCode),
    },
    tickets: c.tickets.map((t) => ({
      ...ticketDTO(t),
      status: t.status === "Resolved" ? "closed" : "open",
      expanded: false,
    })),
    hours: {
      used: c.tickets.reduce((n, t) => n + t.minutes, 0) / 60,
      cap: c.data.supportHours || 1,
      resetsOn: "Monthly",
    },
    people: c.contacts.map((x) => ({
      id: x.id,
      name: x.name,
      email: x.email,
      role: x.role === "signer" ? "signer" : "viewer",
      initial: x.name.slice(0, 1),
    })),
    notifications: Object.entries(user.contact.notifications).map(
      ([key, on]) => ({
        key,
        on,
        label: key[0].toUpperCase() + key.slice(1),
        sub: "Account notifications",
      }),
    ),
    offer: {
      ...(await prisma.offer
        .findUnique({ where: { code: c.offerCode } })
        .then((o) => (o ? offerDTO(o) : {}))),
      setup: (p?.setupCents || 0) / 100,
      monthly: (sub?.mrrCents || 0) / 100,
    },
  };
}
