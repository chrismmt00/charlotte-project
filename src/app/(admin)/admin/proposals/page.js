import { Suspense } from "react";
import { Skeleton } from "@/components/admin/ui";
import ProposalsEntry from "@/components/admin/proposals/ProposalsEntry";

export const metadata = { title: "Proposals" };

// ?new=1&lead=<id> opens a new builder, ?id=PR-0007 opens one proposal. Reading search params needs Suspense.
export default function ProposalsPage() {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading proposals" className="flex flex-col gap-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ProposalsEntry />
    </Suspense>
  );
}
