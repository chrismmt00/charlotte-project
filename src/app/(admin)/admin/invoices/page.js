import { Suspense } from "react";
import InvoicesView from "@/components/admin/billing/InvoicesView";
import { ListSkeleton } from "@/components/admin/billing/kit";
import { PageHead } from "@/components/admin/ui";
import { INVOICES, SAMPLE_TODAY, SUBSCRIPTIONS } from "@/lib/admin/sample-billing";

export const metadata = { title: "Invoices" };

// The view reads ?status=overdue|due|paid|draft and ?new=1 with useSearchParams, so it sits inside Suspense
// (cacheComponents is on). Reads GET /api/admin/invoices once the back end ships it; sample data until then.
// Money is whole dollars here, cents in the API.
export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesFallback />}>
      <InvoicesView initialInvoices={INVOICES} subscriptions={SUBSCRIPTIONS} today={SAMPLE_TODAY} />
    </Suspense>
  );
}

function InvoicesFallback() {
  return (
    <>
      <PageHead eyebrow="Invoices · this month" title="Invoices" />
      <ListSkeleton label="Loading invoices" />
    </>
  );
}
