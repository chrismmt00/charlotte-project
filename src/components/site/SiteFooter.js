import Link from "next/link";
import { CONTACT } from "@/lib/site";
import { INDUSTRIES } from "@/lib/marketing/catalog";

const linkCls =
  "footer-link text-sm text-muted inline-flex items-center min-h-10 transition-colors duration-200 hover:text-fg";

function Col({ title, children }) {
  return (
    <div className="flex-[1_1_150px] min-w-0">
      <h2 className="footer-col-title eyebrow font-normal m-0 mb-2.5">
        {title}
      </h2>
      <ul className="list-none m-0 p-0 flex flex-col">{children}</ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer bg-bg text-fg border-t border-border px-4 sm:px-6 pt-[72px] pb-8">
      <div className="container-site flex flex-col gap-14">
        <div className="flex flex-wrap gap-12 justify-between">
          <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4 items-start">
            <span className="font-display italic text-[40px] leading-none">
              Klyvora
            </span>
            <p className="text-sm leading-[1.65] text-muted-2 m-0 max-w-[320px]">
              Custom websites and connected business software for independent
              businesses. Based in Charlotte, NC.
            </p>
            <Link
              href="/contact"
              className="footer-cta mt-2 rounded-full text-sm font-medium px-6 py-3 bg-fg text-bg inline-flex items-center gap-2 min-h-11 box-border transition-transform duration-300 hover:-translate-y-0.5"
            >
              Get a Quote <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="flex-[2_1_520px] min-w-0 flex flex-wrap gap-8">
            <Col title="Industry Solutions">
              {INDUSTRIES.map((g) => (
                <li key={g.id}>
                  <Link href={g.href} className={linkCls}>
                    {g.name}
                  </Link>
                </li>
              ))}
            </Col>
            <Col title="Company">
              {[
                ["/pricing", "Pricing"],
                ["/websites", "Custom Websites"],
                ["/ai-software", "AI & Software"],
                ["/about", "About"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={linkCls}>
                    {label}
                  </Link>
                </li>
              ))}
            </Col>
            <Col title="Get in touch">
              <li>
                <a
                  href={CONTACT.emailHref}
                  className={`${linkCls} footer-link-accent !text-accent-light hover:!text-fg`}
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                {CONTACT.phoneHref ? (
                  <a
                    href={CONTACT.phoneHref}
                    className={`${linkCls} footer-link-accent !text-accent-light hover:!text-fg`}
                  >
                    {CONTACT.phone}
                  </a>
                ) : (
                  <span className="text-sm text-muted inline-flex items-center min-h-10">
                    {CONTACT.phone}
                  </span>
                )}
              </li>
              <li>
                <span className="text-sm text-muted inline-flex items-center min-h-10">
                  {CONTACT.city}
                </span>
              </li>
            </Col>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-wrap justify-between items-center gap-x-6 gap-y-3 text-[13px] text-muted-2">
          <span>© 2026 Klyvora · Charlotte, NC</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link
              href="/privacy"
              className="footer-legal-link min-h-10 inline-flex items-center hover:text-fg"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="footer-legal-link min-h-10 inline-flex items-center hover:text-fg"
            >
              Terms
            </Link>
            <Link
              href="/portal"
              className="footer-legal-link min-h-10 inline-flex items-center hover:text-fg"
            >
              Client sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
