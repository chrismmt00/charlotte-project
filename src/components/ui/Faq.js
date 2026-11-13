// Accordion built on <details>, so it works without JavaScript and with the keyboard.
export default function Faq({ items, openFirst = true }) {
  return (
    <div className="border-t border-border">
      {items.map((it, i) => (
        <details key={it.q} open={openFirst && i === 0} className="faq-item group border-b border-border">
          <summary className="cursor-pointer flex justify-between items-center gap-4 py-[22px] min-h-11 text-lg font-medium leading-[1.4]">
            {it.q}
            <span aria-hidden="true" className="text-accent-light text-[22px] leading-none transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="text-[15px] leading-[1.7] text-muted-2 m-0 mb-[22px] max-w-[680px]">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
