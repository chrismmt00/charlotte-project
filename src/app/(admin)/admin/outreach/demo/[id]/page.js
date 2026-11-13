import { Suspense } from "react";
import DemoReview from "@/components/admin/outreach/DemoReview";
import { Skeleton } from "@/components/admin/ui";
import { getDemo } from "@/lib/server/views";

export const metadata = { title: "Review demo" };

export default function DemoPage({ params }) {
  return (
    <Suspense fallback={<DemoFallback />}>
      <DemoContent params={params} />
    </Suspense>
  );
}

function DemoFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-72 rounded-admin" />
    </div>
  );
}

// An unknown id shows the board's "No demo with that id" state inside the admin shell (demo = null).
// The data is sample until GET /api/admin/outreach/demos/[id] is real.
async function DemoContent({ params }) {
  const { id } = await params;
  return <DemoReview demo={await getDemo(id)} />;
}
