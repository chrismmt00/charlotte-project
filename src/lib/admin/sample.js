// SAMPLE DATA for the admin UI until the back end ships its routes (docs/prompts/BACKEND-LOOP.md).
// Every name is a bracketed placeholder. The shapes are the contract the back end must return.

export const TARGETS = { signed: 20000, cash: 17000, mrr: 1500 };

// GET /api/admin/metrics -> { signed, cash, mrr, targets, contactsThisWeek, overdueInvoices, openTickets, activeClients }
export function getMetrics() {
  return {
    signed: 6497,
    cash: 4248,
    mrr: 227,
    targets: TARGETS,
    contactsThisWeek: 4,
    overdueInvoices: 1,
    openTickets: 2,
    activeClients: 3,
  };
}

export const LEAD_STATUSES = ["New", "Contacted", "Demo booked", "Proposal sent", "Signed", "Lost"];

// GET /api/admin/leads -> { leads: Lead[] }
// Lead: { id, business, name, email, phone, offerCode, offer, source, status, score, owner, nextActionAt, createdAt, when }
export const LEADS = [
  { id: "ld_1", business: "Barbershop [1]", name: "[Owner 1]", offerCode: "WB", offer: "Website + Booking", source: "Site form", status: "New", score: 5, owner: "Chris", next: "Call today", when: "2h ago" },
  { id: "ld_2", business: "Taqueria [2]", name: "[Owner 2]", offerCode: "RC", offer: "Restaurant core", source: "Referral", status: "Demo booked", score: 5, owner: "Chris", next: "Demo Thu 3:00", when: "Today" },
  { id: "ld_3", business: "Nail salon [3]", name: "[Owner 3]", offerCode: "BK", offer: "Booking add-on", source: "Instagram", status: "Contacted", score: 4, owner: "Geoffrey", next: "Follow up Fri", when: "Yesterday" },
  { id: "ld_4", business: "Detailing [4]", name: "[Owner 4]", offerCode: "W1", offer: "Starter Website", source: "Google", status: "New", score: 3, owner: "Demetrius", next: "Email intro", when: "Yesterday" },
  { id: "ld_5", business: "Bakery [5]", name: "[Owner 5]", offerCode: "EC", offer: "Ecommerce store", source: "Walk-in", status: "Proposal sent", score: 4, owner: "Chris", next: "Check proposal viewed", when: "3d ago" },
  { id: "ld_6", business: "Food truck [6]", name: "[Owner 6]", offerCode: "RK", offer: "Restaurant core + 1 kiosk", source: "Partner", status: "Signed", score: 5, owner: "Geoffrey", next: "Kickoff", when: "1w ago" },
  { id: "ld_7", business: "Braids studio [7]", name: "[Owner 7]", offerCode: "WB", offer: "Website + Booking", source: "Outreach", status: "Signed", score: 5, owner: "Chris", next: "Content checklist", when: "1w ago" },
  { id: "ld_8", business: "Boutique [8]", name: "[Owner 8]", offerCode: "EC", offer: "Ecommerce store", source: "Check my site", status: "New", score: 4, owner: "Demetrius", next: "Send report", when: "2d ago" },
  { id: "ld_9", business: "Lash studio [9]", name: "[Owner 9]", offerCode: "WB", offer: "Website + Booking", source: "Estimator", status: "Contacted", score: 3, owner: "Geoffrey", next: "Call Mon", when: "4d ago" },
  { id: "ld_10", business: "Cafe [10]", name: "[Owner 10]", offerCode: "AI", offer: "AI automation", source: "Workbook import", status: "Lost", score: 2, owner: "Chris", next: "—", when: "2w ago" },
];

export const TASKS = [
  { text: "Call Taqueria [2] before the demo", from: "Lead", who: "Chris", due: "Today", urgent: true },
  { text: "Approve 4 outreach drafts", from: "Outreach", who: "Chris", due: "Today", urgent: true },
  { text: "Send INV-0011 reminder to Food truck [6]", from: "Invoice", who: "Geoffrey", due: "Tomorrow" },
  { text: "Ship Studio [9] demo for review", from: "Project", who: "Geoffrey", due: "Thu" },
  { text: "Reply to TK-041 (holiday hours)", from: "Ticket", who: "Demetrius", due: "Fri" },
];

export const OUTREACH_TODAY = { ranAt: "8:00", found: 4, foundGoal: 10, toApprove: 4, demosInProgress: 2, replies: 1 };
