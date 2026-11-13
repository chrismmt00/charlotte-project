import { Suspense } from "react";
import { notFound } from "next/navigation";
import LeadDetail from "@/components/admin/leads/LeadDetail";
import { Skeleton } from "@/components/admin/ui";
import { getLead } from "@/lib/admin/sample-leads";

export const metadata = { title: "Lead" };

export default function LeadPage({ params }) {
  return (
    <Suspense fallback={<LeadFallback />}>
      <LeadContent params={params} />
    </Suspense>
  );
}

function LeadFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-40" />
    </div>
  );
}

// Unknown id -> notFound(). The data is sample until GET /api/admin/leads/[id] is real.
async function LeadContent({ params }) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();
  return <LeadDetail lead={lead} />;
}
