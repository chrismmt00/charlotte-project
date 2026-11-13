"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Inter, Instrument_Serif } from "next/font/google";
import ErrorScreen, { BrandHeader, btnPrimary } from "@/app/_errors/ErrorScreen";
import { CONTACT } from "@/lib/site";
import { THEME_KEY } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });

// Replaces the root layout when it fails, so it brings its own <html>, <body>, styles, fonts and theme.
// metadata exports are not supported here; React's <title> is used instead.
export default function GlobalError({ error, retry }) {
  useEffect(() => {
    // BACKEND: send to error reporting (error.digest matches the server log line).
    console.error(error);
  }, [error]);

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    } catch {
      // Storage blocked: keep dark.
    }
  }, []);

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <title>Something broke · Klyvora</title>
        <BrandHeader />
        <ErrorScreen
          kind="500"
          code="500"
          title="Something broke on our side."
          text="Nothing you did caused this. Try again in a minute; if it keeps happening, email us and a person in Charlotte will look."
          actions={
            <button type="button" onClick={() => retry()} className={btnPrimary}>
              Try again
            </button>
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
      </body>
    </html>
  );
}
