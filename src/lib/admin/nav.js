// Admin navigation, shared by the sidebar, the phone menu and the command palette.
export const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: "dashboard" },
  { key: "leads", label: "Leads", href: "/admin/leads", icon: "leads" },
  { key: "outreach", label: "Outreach", href: "/admin/outreach", icon: "outreach" },
  { key: "clients", label: "Clients", href: "/admin/clients", icon: "clients" },
  { key: "proposals", label: "Proposals", href: "/admin/proposals", icon: "proposals" },
  { key: "projects", label: "Projects", href: "/admin/projects", icon: "projects" },
  { key: "invoices", label: "Invoices", href: "/admin/invoices", icon: "invoices" },
  { key: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: "subscriptions" },
  { key: "support", label: "Support", href: "/admin/support", icon: "support" },
  { key: "reports", label: "Reports", href: "/admin/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: "settings" },
];

// Sample count until GET /api/admin/outreach/approvals exists.
export const APPROVALS_WAITING = 4;

export const CMDK_GROUPS = [
  {
    label: "Pages",
    items: ADMIN_NAV.map((n) => ({ label: n.label, href: n.href, hint: `G ${n.label[0]}` })),
  },
  {
    label: "Actions",
    items: [
      { label: "New lead", href: "/admin/leads?new=1", hint: "N" },
      { label: "Log a call", href: "/admin/leads", hint: "L" },
      { label: "New proposal", href: "/admin/proposals?new=1", hint: "P" },
      { label: "New invoice", href: "/admin/invoices?new=1", hint: "I" },
      { label: "Run today's outreach search", href: "/admin/outreach?tab=run", hint: "R" },
    ],
  },
];
