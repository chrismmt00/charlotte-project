import { Suspense } from "react";
import { PageHead, Skeleton } from "@/components/admin/ui";
import LeadsView from "@/components/admin/leads/LeadsView";
import { adminData } from "@/lib/server/views";

export const metadata = { title: "Leads" };

// The client view reads ?view=board and ?new=1 with useSearchParams, so it sits inside Suspense.
export default function Page() {
  return (
    <Suspense fallback={<LeadsFallback />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const data = await adminData("leads");
  return <LeadsView initial={data.leads} />;
}

function LeadsFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <PageHead eyebrow="Leads" title="Leads" sample={false} />
      <div className="border border-border rounded-admin bg-surface p-5 flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-5" />
        ))}
      </div>
    </div>
  );
}
