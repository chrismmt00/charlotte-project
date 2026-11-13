import { getClient } from "@/lib/admin/sample-clients";

// STUB until the back end ships this route. The real route creates a Stripe Connect account the client fully
// controls (Standard-style, full Stripe dashboard access) and returns an onboarding link. The application fee is $0.
// POST /api/admin/clients/[id]/stripe/connect
//   body { delivery: "email" | "link" }
//   -> 200 { connect: { status: "pending", accountId: "acct_[…]", onboardingUrl, sentTo: string | null, applicationFeePercent: 0 } }
//   -> 409 { error: { code: "not_needed" } } for offers with no payments (W1, W2, AI, AH, CA) | 404 unknown client
// The client finishing onboarding flips the status to "connected" through the Stripe webhook (account.updated).
export async function POST(request, { params }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) return Response.json({ error: { code: "not_found", message: "No such client." } }, { status: 404 });
  if (client.stripe.connect.status === "not-needed") {
    return Response.json({ error: { code: "not_needed", message: "This offer takes no payments." } }, { status: 409 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {}
  return Response.json({
    connect: {
      status: "pending",
      accountId: "acct_[…]",
      onboardingUrl: "https://connect.stripe.com/setup/[…]",
      sentTo: body.delivery === "email" ? "[owner email]" : null,
      applicationFeePercent: 0,
    },
  });
}
