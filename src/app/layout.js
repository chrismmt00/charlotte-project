import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import CatalogProvider from "@/components/site/CatalogProvider";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Custom Websites & Business Software | Klyvora Studio",
    template: "%s | Klyvora Studio",
  },
  description:
    "Custom website design and connected business software for Charlotte’s independent businesses. Industry solutions, practical automation, and transparent setup and subscription pricing.",
  openGraph: {
    siteName: "Klyvora Studio",
    type: "website",
    locale: "en_US",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <div aria-busy="true" className="p-8">
              Loading…
            </div>
          }
        >
          <CatalogProvider offers={[]}>{children}</CatalogProvider>
        </Suspense>
      </body>
    </html>
  );
}
