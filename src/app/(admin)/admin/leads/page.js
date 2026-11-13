import { Suspense } from "react";
import { PageHead, Skeleton } from "@/components/admin/ui";
import LeadsView from "@/components/admin/leads/LeadsView";
import { listLeads } from "@/lib/admin/sample-leads";

export const metadata = { title: "Leads" };

// The client view reads ?view=board and ?new=1 with useSearchParams, so it sits inside Suspense.
// Rows come from listLeads() (sample data) until GET /api/admin/leads is real.
export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsFallback />}>
      <LeadsView initial={listLeads()} />
    </Suspense>
  );
}

function LeadsFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <PageHead eyebrow="Leads" title="Leads" />
      <div className="border border-border rounded-admin bg-surface p-5 flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-5" />
        ))}
      </div>
    </div>
  );
}
