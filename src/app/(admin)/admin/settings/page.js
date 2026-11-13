import { Suspense } from "react";
import SettingsView from "@/components/admin/settings/SettingsView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Settings" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("settings");

  return <SettingsView initial={data} />;
}
