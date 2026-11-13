export const metadata = {
  title: "Your proposal",
  robots: { index: false, follow: false },
};

// Minimal layout for the public proposal: no site nav, no footer. Each page renders its own ProposalHeader
// (Klyvora wordmark, status chip, theme switch) and <main id="main">.
export default function ProposalLayout({ children }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-fg focus:text-bg focus:rounded-full focus:px-5 focus:py-3 focus:text-sm">
        Skip to content
      </a>
      {children}
    </>
  );
}
