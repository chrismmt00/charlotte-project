import Link from "next/link";
import {
  LAUNCH_OFFER,
  money,
  setupPrice,
  launchHeadline,
  launchQualifier,
  launchDetails,
} from "@/lib/marketing/catalog";

// Shared by server-rendered marketing pages and the client inquiry form.
export function SetupAmount({ service }) {
  return (
    <>
      {LAUNCH_OFFER.active && (
        <>
          <span className="sr-only">Regular setup </span>
          <del className="text-sm font-normal text-muted-2 mr-2">
            {money(service.setup)}
          </del>
          <span className="sr-only">Launch setup </span>
        </>
      )}
      <strong>{money(setupPrice(service))}</strong>
    </>
  );
}

export function OfferQualifier() {
  return LAUNCH_OFFER.active ? (
    <span className="mk-small block mt-2">{launchQualifier()}</span>
  ) : null;
}

export function LaunchOffer({ detailed = false, id }) {
  if (!LAUNCH_OFFER.active) return null;
  return (
    <aside
      id={id}
      aria-label={detailed ? "Launch offer details" : "Launch offer"}
      className={`mk-note mb-6 ${detailed ? "mt-10" : ""}`}
    >
      <p>
        <strong>Launch offer: {launchHeadline()}</strong>
      </p>
      <p>
        {detailed
          ? launchDetails()
          : "Available across all services. Monthly subscriptions stay at their regular prices. Reserve your spot with a signed proposal and kickoff payment."}
      </p>
      {!detailed && (
        <Link
          href="/pricing#launch-offer"
          className="inline-flex items-center min-h-11 text-sm text-accent-light underline underline-offset-4"
        >
          View launch offer details <span aria-hidden="true">&nbsp;→</span>
        </Link>
      )}
    </aside>
  );
}
