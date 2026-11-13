"use client";

import { useSearchParams } from "next/navigation";
import QuoteEstimator from "@/components/quote/QuoteEstimator";

// Reads ?offer=CODE and preselects that offer. Must render inside <Suspense> (cacheComponents is on).
export default function QuoteFromParams() {
  const params = useSearchParams();
  const code = (params.get("offer") || "").trim().toUpperCase() || null;
  return <QuoteEstimator key={code || "default"} initialOffer={code} />;
}
