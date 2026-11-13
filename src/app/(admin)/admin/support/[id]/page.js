import { Suspense } from "react";
import { notFound } from "next/navigation";
import TicketView from "@/components/admin/support/TicketView";
import { supportTicket, today } from "@/lib/server/views";
export const metadata={title:"Ticket"};
export default function Page({params}){return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content params={params}/></Suspense>;}
async function Content({params}){const {id}=await params;const ticket=await supportTicket(id);if(!ticket)notFound();return <TicketView ticket={ticket} capHours={1} usedByOthers={0} today={today()}/>;}
