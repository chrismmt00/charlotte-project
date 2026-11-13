import { Suspense } from "react";
import { PageHead, Skeleton } from "@/components/admin/ui";
import OutreachView from "@/components/admin/outreach/OutreachView";
import { adminData } from "@/lib/server/views";

export const metadata = { title: "Outreach" };

// The client view reads ?tab= with useSearchParams (the command palette links to ?tab=run), so it sits inside Suspense.
export default function Page() {
  return (
    <Suspense fallback={<OutreachFallback />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const data = await adminData("outreach");
  return <OutreachView initial={data} />;
}

function OutreachFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <PageHead eyebrow="Outreach · daily prospecting with Claude Cowork" title="Outreach" sample={false} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-admin" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-admin" />
    </div>
  );
}
