import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getCatalog } from "@/lib/server/catalog";
import CatalogProvider from "@/components/site/CatalogProvider";

// Only protected admin tools need historical, editable offer data. Keep the
// same catalog available to the proposal builder without gating public pages on a DB read.
async function AdminCatalog({ children }) {
  const offers = await getCatalog();
  return (
    <CatalogProvider offers={offers} withSession={false}>
      {children}
    </CatalogProvider>
  );
}

export const metadata = {
  title: { default: "Admin", template: "%s · Klyvora Admin" },
  robots: { index: false, follow: false },
};

// Auth: the back end adds the session check in src/proxy.js (optimistic redirect to /admin/signin)
// and real authorization in every handler. Until then every admin page shows sample data.
// The shell reads the current path, so it sits inside Suspense for dynamic routes like /admin/clients/[id].
export default function AdminLayout({ children }) {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-bg-deep" aria-busy="true" />}
    >
      <AdminCatalog>
        <AdminShell>{children}</AdminShell>
      </AdminCatalog>
    </Suspense>
  );
}
