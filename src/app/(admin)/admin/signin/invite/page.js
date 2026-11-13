import { Suspense } from "react";
import { InviteScreen } from "@/components/auth/AdminForms";
import { CardFallback } from "@/components/auth/parts";

export const metadata = { title: "Accept your invitation" };

// The card reads ?token= with useSearchParams, so it sits inside Suspense.
export default function AdminInvitePage() {
  return (
    <Suspense fallback={<CardFallback />}>
      <InviteScreen />
    </Suspense>
  );
}
