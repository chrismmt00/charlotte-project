import Link from "next/link";
import ErrorScreen, { BrandHeader, btnPrimary, btnSecondary } from "@/app/_errors/ErrorScreen";

export const metadata = {
  title: "Page not found",
  description: "That page isn’t here. Head back to the home page, browse our services, or tell us which link sent you.",
};

const noteLink = "text-accent-light underline underline-offset-2 hover:text-fg";

// Renders inside the root layout but outside (marketing), so it has its own brand header instead of the site nav.
export default function NotFound() {
  return (
    <>
      <BrandHeader />
      <ErrorScreen
        kind="404"
        code="404"
        title="That page isn’t here."
        text="The link may be old, or we moved the page. Nothing you did caused this."
        actions={
          <>
            <Link href="/" className={btnPrimary}>
              Back to the home page
            </Link>
            <Link href="/contact" className={btnSecondary}>
              Tell us what broke <span aria-hidden="true">↗</span>
            </Link>
          </>
        }
        note={
          <>
            Looking for prices? They&apos;re on every{" "}
            <Link href="/services" className={noteLink}>
              service page
            </Link>{" "}
            and on{" "}
            <Link href="/pricing" className={noteLink}>
              /pricing
            </Link>
            .
          </>
        }
      />
    </>
  );
}
