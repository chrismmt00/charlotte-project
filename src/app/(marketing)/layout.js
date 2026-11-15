import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import "./marketing.css";

export default function MarketingLayout({ children }) {
  return (
    <div className="marketing-site flex flex-col flex-1">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-fg focus:text-bg focus:rounded-full focus:px-5 focus:py-3 focus:text-sm"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1 flex flex-col">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
