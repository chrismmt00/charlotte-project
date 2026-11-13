import { Suspense } from "react";
import SettingsView from "@/components/admin/settings/SettingsView";
import { Skeleton } from "@/components/admin/ui";
import { getSettings } from "@/lib/admin/sample-settings";

export const metadata = { title: "Settings" };

function Fallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

// Reads ?tab= (the account menu links to /admin/settings?tab=team) through useSearchParams in a client
// child, so it sits inside Suspense. The first paint uses the sample file; the back end serves the same
// shape from GET /api/admin/settings, and the session decides whether this person is an owner or a builder.
export default function SettingsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SettingsView initial={getSettings()} />
    </Suspense>
  );
}
