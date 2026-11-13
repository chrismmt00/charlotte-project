import { Suspense } from "react";
import { notFound } from "next/navigation";
import ClientDetail from "@/components/admin/clients/ClientDetail";
import { Skeleton } from "@/components/admin/ui";
import { getClient } from "@/lib/server/data";

export const metadata = { title: "Client" };

// params is a Promise and cacheComponents is on, so it is awaited inside Suspense.
export default function ClientPage({ params }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content params={params} />
    </Suspense>
  );
}

function Fallback() {
  return (
    <div aria-busy="true" aria-label="Loading client" className="flex flex-col gap-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// Reads GET /api/admin/clients/[id]; the sample file stands in until the route is real.
async function Content({ params }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return <ClientDetail key={client.id} initial={client} />;
}
