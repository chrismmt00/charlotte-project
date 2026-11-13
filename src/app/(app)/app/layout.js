import { Suspense } from "react";
import { BusinessProvider } from "@/components/app/useBusiness";
import ClientShell from "@/components/app/ClientShell";

export const metadata = {
  title: { default: "Your site", template: "%s · Klyvora" },
  robots: { index: false, follow: false },
};

// The client admin: what a business owner's monthly plan buys. Own shell, no public nav or footer.
// Auth: the back end adds the session check in src/proxy.js (optimistic redirect to /portal/signin)
// and real authorization in every /api/app handler. Until then every page shows the sample business.
export default function AppLayout({ children }) {
  return <Suspense fallback={<div aria-busy="true">Loading…</div>}><BusinessProvider><ClientShell>{children}</ClientShell></BusinessProvider></Suspense>;
}
