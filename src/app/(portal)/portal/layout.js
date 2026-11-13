import PortalShell from "@/components/portal/PortalShell";

export const metadata = {
  title: { default: "Client portal", template: "%s · Klyvora portal" },
  robots: { index: false, follow: false },
};

// Own shell: the public site nav and footer do not wrap the portal (they live in the (marketing) group).
// Auth: the back end adds the session check in src/proxy.js (redirect to /portal/signin) and real
// authorization in every handler. Until then every portal page shows sample data.
export default function PortalLayout({ children }) {
  return <PortalShell>{children}</PortalShell>;
}
