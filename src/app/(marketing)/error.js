"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import ErrorScreen, { btnPrimary, btnSecondary } from "@/app/_errors/ErrorScreen";
import { CONTACT } from "@/lib/site";

// Catches errors in marketing pages. It renders inside the (marketing) layout, so the site nav and footer stay.
// `retry` re-fetches and re-renders the segment (this Next.js version's error.js API).
export default function MarketingError({ error, retry }) {
  useEffect(() => {
    // BACKEND: send to error reporting (error.digest matches the server log line).
    console.error(error);
  }, [error]);

  return (
    <>
      <title>Something broke · Klyvora</title>
      <ErrorScreen
        as="div"
        standalone={false}
        kind="500"
        code="500"
        title="Something broke on our side."
        text="Nothing you did caused this. Try again in a minute; if it keeps happening, tell us and a person in Charlotte will look."
        actions={
          <>
            <button type="button" onClick={() => retry()} className={btnPrimary}>
              Try again
            </button>
            <Link href="/contact" className={btnSecondary}>
              Tell us what broke <span aria-hidden="true">↗</span>
            </Link>
          </>
        }
        note={
          <>
            If you were sending a form, it may not have gone through. Email{" "}
            <a href={CONTACT.emailHref} className="text-accent-light underline underline-offset-2 hover:text-fg">
              {CONTACT.email}
            </a>{" "}
            and we&apos;ll sort it.
          </>
        }
      />
    </>
  );
}
