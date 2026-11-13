import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProposalHeader from "@/components/proposal/ProposalHeader";
import ProposalView from "@/components/proposal/ProposalView";
import { getPublicProposal } from "@/lib/server/data";

export const metadata = {
  title: "Your proposal",
  robots: { index: false, follow: false },
};

// Public proposal. The token is the credential. Reads GET /api/p/[token]; the sample file stands in until the route is real.
// Sample tokens: pr9-taqueria (open, restaurant), pr8-barbershop (draft preview), pr7-nailsalon, pr6-bakery (open),
// pr5-foodtruck, pr4-braids, pr2-studio (signed), pr3-lashstudio (expired), pr1-cafe (declined).
export default function ProposalPage({ params }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content params={params} />
    </Suspense>
  );
}

function Fallback() {
  return (
    <>
      <ProposalHeader />
      <main id="main" aria-busy="true" aria-label="Loading your proposal" className="mx-auto w-full max-w-[880px] px-[clamp(16px,4vw,32px)] pt-10 flex flex-col gap-5">
        <div className="h-4 w-48 rounded-full bg-surface" />
        <div className="h-[clamp(52px,8vw,96px)] max-w-[640px] rounded-card bg-surface" />
        <div className="h-5 max-w-[520px] rounded-full bg-surface" />
        <div className="h-56 rounded-card bg-surface" />
      </main>
    </>
  );
}

async function Content({ params }) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();
  return <ProposalView key={proposal.token} proposal={proposal} />;
}
