import { Suspense } from "react";
import { ResetScreen } from "@/components/auth/AdminForms";
import { CardFallback } from "@/components/auth/parts";

export const metadata = { title: "Reset password" };

// The card reads ?token= with useSearchParams, so it sits inside Suspense.
export default function AdminResetPage() {
  return (
    <Suspense fallback={<CardFallback />}>
      <ResetScreen />
    </Suspense>
  );
}
