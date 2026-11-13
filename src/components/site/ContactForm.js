"use client";

import { useSearchParams } from "next/navigation";
import LeadForm from "./LeadForm";

// Reads ?offer=CODE so links from Pricing and the service pages preselect the offer.
// Must render inside <Suspense> because it reads the query string.
export default function ContactForm() {
  const offer = (useSearchParams().get("offer") || "").toUpperCase() || null;
  return <LeadForm key={offer || "none"} source="contact" offerCode={offer} showOffer showSiteUrl />;
}
