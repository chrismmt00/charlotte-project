"use client";

import { useSearchParams } from "next/navigation";
import ProposalsApp from "./ProposalsApp";

export default function ProposalsEntry() {
  const sp = useSearchParams();
  const id = sp.get("id");
  const route = sp.get("new") === "1" ? { view: "builder", fresh: true, leadId: sp.get("lead") || "" } : id ? { view: "builder", id } : { view: "list" };
  return <ProposalsApp key={sp.toString()} initialRoute={route} />;
}
