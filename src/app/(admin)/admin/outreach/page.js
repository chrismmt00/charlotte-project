import { Suspense } from "react";
import { PageHead, Skeleton } from "@/components/admin/ui";
import OutreachView from "@/components/admin/outreach/OutreachView";
import { getOutreach } from "@/lib/admin/sample-outreach";

export const metadata = { title: "Outreach" };

// The client view reads ?tab= with useSearchParams (the command palette links to ?tab=run), so it sits inside Suspense.
// Data is sample until GET /api/admin/outreach is real.
export default function OutreachPage() {
  return (
    <Suspense fallback={<OutreachFallback />}>
      <OutreachView initial={getOutreach()} />
    </Suspense>
  );
}

function OutreachFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <PageHead eyebrow="Outreach · daily prospecting with Claude Cowork" title="Outreach" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-admin" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-admin" />
    </div>
  );
}
