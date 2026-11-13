export function Eyebrow({ as: Tag = "div", className = "", children, accent = false }) {
  return <Tag className={`eyebrow ${accent ? "!text-accent-light" : ""} ${className}`}>{children}</Tag>;
}

// Eyebrow + display heading + lede, inside the 1200px container with the standard section padding.
export default function Section({
  id,
  eyebrow,
  title,
  titleItalic = false,
  lede,
  headingId,
  className = "",
  innerClassName = "",
  children,
  as: Heading = "h2",
}) {
  const hid = headingId || (id ? `${id}-h` : undefined);
  return (
    <section id={id} aria-labelledby={title ? hid : undefined} className={`px-4 sm:px-6 pt-[110px] pb-10 ${className}`}>
      <div className={`container-site ${innerClassName}`}>
        {eyebrow ? <Eyebrow className="mb-[18px]">{eyebrow}</Eyebrow> : null}
        {title ? (
          <Heading id={hid} className={`display-2 m-0 mb-3.5 ${titleItalic ? "italic" : ""}`}>
            {title}
          </Heading>
        ) : null}
        {lede ? <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[560px] m-0 mb-12">{lede}</p> : null}
        {children}
      </div>
    </section>
  );
}

// Top of an inner page: eyebrow, display-page H1, lede.
export function PageHeader({ eyebrow, title, lede, children }) {
  return (
    <header className="px-4 sm:px-6 pt-[160px] pb-6">
      <div className="container-site">
        {eyebrow ? <Eyebrow className="mb-6">{eyebrow}</Eyebrow> : null}
        <h1 className="display-page m-0 mb-6 max-w-[980px]">{title}</h1>
        {lede ? <p className="text-[15px] sm:text-base leading-[1.7] text-muted-2 max-w-[620px] m-0">{lede}</p> : null}
        {children}
      </div>
    </header>
  );
}
