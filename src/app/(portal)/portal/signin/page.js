import { Suspense } from "react";
import SignIn from "@/components/portal/SignIn";

export const metadata = { title: "Sign in" };

// /portal/signin            magic-link request
// /portal/signin?expired    the link expired
// /portal/signin?unknown    signed in with an email no project lists
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignIn />
    </Suspense>
  );
}
