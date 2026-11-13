import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: { default: "Admin", template: "%s · Klyvora Admin" },
  robots: { index: false, follow: false },
};

// Auth: the back end adds the session check in src/proxy.js (optimistic redirect to /admin/signin)
// and real authorization in every handler. Until then every admin page shows sample data.
// The shell reads the current path, so it sits inside Suspense for dynamic routes like /admin/clients/[id].
export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-deep" aria-busy="true" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
