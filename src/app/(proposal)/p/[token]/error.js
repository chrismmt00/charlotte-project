"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import ErrorScreen, { btnPrimary, btnSecondary } from "@/app/_errors/ErrorScreen";
import { CONTACT } from "@/lib/site";

// The proposal could not load. Nothing was signed or charged.
export default function ProposalError({ error, retry }) {
  useEffect(() => {
    // BACKEND: send to error reporting (error.digest matches the server log line).
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      as="div"
      standalone={false}
      kind="500"
      code="500"
      title="We couldn’t load your proposal."
      text="Nothing was signed and nothing was charged. Try again in a moment; if it keeps happening, call us and we’ll walk through it with you."
      actions={
        <>
          <button type="button" onClick={() => retry()} className={btnPrimary}>
            Try again
          </button>
          <a href={CONTACT.emailHref} className={btnSecondary}>
            Email us <span aria-hidden="true">↗</span>
          </a>
        </>
      }
      note={<>Or call {CONTACT.phone}. Klyvora · {CONTACT.city}</>}
    />
  );
}
