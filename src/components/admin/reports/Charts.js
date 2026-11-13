import { useId } from "react";
import { money } from "@/components/admin/ui";

// Inline SVG charts drawn on tokens. Each SVG is role="img" with <title>/<desc>, every mark has a
// <title>, and every chart has a real data table under "Show the numbers".
// The viewBox is 600x200; on narrow screens the chart scrolls inside its box instead of shrinking the text.

const AXIS = 160; // baseline y
const H = 120; // plot height
const TXT = { fontSize: 11, fill: "var(--muted-2)", fontFamily: "inherit" };

function Frame({ title, desc, children }) {
  const id = useId();
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg viewBox="0 0 600 200" width="100%" height="200" role="img" aria-labelledby={`${id}-t ${id}-d`} className="block min-w-[520px] overflow-visible">
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>{desc}</desc>
        {children}
      </svg>
    </div>
  );
}

export function DataTable({ caption, head, rows }) {
  return (
    <details className="group text-[12px]">
      <summary className="cursor-pointer text-accent-light hover:text-fg inline-flex items-center gap-1.5 min-h-8">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-transform group-open:rotate-90">
          <path d="M9 6l6 6-6 6" />
        </svg>
        Show the numbers
      </summary>
      <div className="overflow-x-auto mt-2 border border-border rounded-[12px]">
        <table className="w-full border-collapse text-[12px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface-2">
              {head.map((h, i) => (
                <th key={h} scope="col" className={`font-medium text-muted-2 px-3 py-2 ${i ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border">
                {r.map((c, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="text-left font-normal text-fg px-3 py-2">
                      {c}
                    </th>
                  ) : (
                    <td key={i} className="text-right tabular-nums px-3 py-2">
                      {c}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12px] text-muted-2">
      {items.map(([label, cls]) =>
        cls ? (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] inline-block ${cls}`} />
            {label}
          </span>
        ) : (
          <span key={label}>{label}</span>
        )
      )}
    </div>
  );
}

// Signed (accent) and collected (success) bars per month against the monthly signed target.
export function SignedChart({ months, target }) {
  const max = Math.max(target, ...months.map((m) => Math.max(m.signed, m.cash)));
  const y = (v) => AXIS - Math.round((v / max) * H);
  const slot = 560 / Math.max(1, months.length);
  const bw = 52;
  const ty = y(target);
  return (
    <Frame
      title={`Signed and collected by month against the ${money(target)} target`}
      desc={months.map((m) => `${m.label}: signed ${money(m.signed)}, collected ${money(m.cash)}`).join("; ")}
    >
      <line x1="40" y1={AXIS} x2="600" y2={AXIS} stroke="var(--border-2)" />
      <line x1="40" y1={ty} x2="600" y2={ty} stroke="var(--muted)" strokeDasharray="4 4" />
      <text x="44" y={ty - 6} {...TXT}>
        Target {money(target)} a month
      </text>
      {months.map((m, i) => {
        const x0 = 40 + i * slot + (slot - (bw * 2 + 10)) / 2;
        return (
          <g key={m.key}>
            {[
              [m.signed, "var(--accent)", `${m.label}: signed ${money(m.signed)}`],
              [m.cash, "var(--success)", `${m.label}: collected ${money(m.cash)}`],
            ].map(([v, fill, t], j) => {
              const x = x0 + j * (bw + 10);
              return (
                <g key={j}>
                  <rect x={x} y={y(v)} width={bw} height={Math.max(0, AXIS - y(v))} rx="6" fill={fill}>
                    <title>{t}</title>
                  </rect>
                  <text x={x + bw / 2} y={y(v) - 6} textAnchor="middle" fontSize="11" fill="var(--fg)" fontFamily="inherit">
                    {money(v)}
                  </text>
                </g>
              );
            })}
            <text x={x0 + bw + 5} y="180" textAnchor="middle" {...TXT}>
              {m.label}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

// MRR billing (solid accent) then a dotted projection (accent-light) toward the target.
export function MrrChart({ points, target }) {
  const max = Math.max(target * 1.07, ...points.map((p) => p.value));
  const y = (v) => AXIS - Math.round((v / max) * H);
  const n = points.length;
  const x = (i) => (n === 1 ? 320 : 60 + i * (500 / (n - 1)));
  const billing = points.map((p, i) => ({ ...p, i })).filter((p) => !p.projected);
  const lastBill = billing[billing.length - 1];
  const proj = points.map((p, i) => ({ ...p, i })).filter((p) => p.projected);
  const solid = billing.map((p) => `${x(p.i)},${y(p.value)}`).join(" ");
  const dotted = [lastBill, ...proj].filter(Boolean).map((p) => `${x(p.i)},${y(p.value)}`).join(" ");
  const ty = y(target);
  return (
    <Frame
      title={`Monthly recurring revenue by month against the ${money(target)} target`}
      desc={points.map((p) => `${p.label}: ${money(p.value)}/mo ${p.projected ? "projected" : "billing"}`).join("; ")}
    >
      <line x1="40" y1={AXIS} x2="600" y2={AXIS} stroke="var(--border-2)" />
      <line x1="40" y1={ty} x2="600" y2={ty} stroke="var(--muted)" strokeDasharray="4 4" />
      <text x="44" y={ty - 6} {...TXT}>
        Target {money(target)} by month 3
      </text>
      {solid ? <polyline points={solid} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {proj.length ? <polyline points={dotted} fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" /> : null}
      {points.map((p, i) => (
        <g key={p.key}>
          <circle cx={x(i)} cy={y(p.value)} r="4.5" fill="var(--surface)" stroke={p.projected ? "var(--accent-light)" : "var(--accent)"} strokeWidth="2">
            <title>{`${p.label}: ${money(p.value)}/mo ${p.projected ? "projected" : "billing"}`}</title>
          </circle>
          <text x={x(i)} y={y(p.value) - 10} textAnchor="middle" fontSize="11" fill="var(--fg)" fontFamily="inherit">
            {money(p.value)}
          </text>
          <text x={x(i)} y="180" textAnchor="middle" {...TXT}>
            {p.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

// Pipeline funnel as an ordered list; the bars are decoration, the numbers are text.
export function Funnel({ stages }) {
  const top = stages[0]?.n || 1;
  return (
    <ol className="list-none m-0 p-0 flex flex-col gap-2">
      {stages.map((f, i) => {
        const conv = i === 0 || !stages[i - 1].n ? null : Math.round((f.n / stages[i - 1].n) * 100);
        const last = i === stages.length - 1;
        return (
          <li key={f.stage} className="grid grid-cols-[minmax(96px,130px)_minmax(0,1fr)_72px] gap-3 items-center text-[13px]">
            <span className="text-muted-2 truncate">{f.stage}</span>
            <span aria-hidden="true" className="h-[22px] rounded-[6px] bg-surface-2 overflow-hidden">
              <span className={`block h-full rounded-[6px] ${last ? "bg-success" : "bg-accent"}`} style={{ width: `${Math.max(2, Math.round((f.n / top) * 100))}%` }} />
            </span>
            <span className="text-right tabular-nums">
              {f.n}
              {conv != null ? (
                <span className="text-muted-2 text-[12px]">
                  {" "}
                  {conv}%<span className="sr-only"> of the stage before</span>
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Contacts per week: emails (accent) stacked with calls (accent-light) against the 65–95 band.
export function OutreachChart({ weeks, low = 65, high = 95 }) {
  const max = Math.max(high * 1.15, ...weeks.map((w) => w.emails + w.calls));
  const y = (v) => AXIS - Math.round((v / max) * H);
  const slot = 560 / Math.max(1, weeks.length);
  const bw = Math.min(32, slot * 0.5);
  return (
    <Frame
      title={`Contacts per week against the ${low} to ${high} goal band`}
      desc={weeks.map((w) => `${w.label}: ${w.emails} emails and ${w.calls} calls, ${w.emails + w.calls} contacts`).join("; ")}
    >
      <rect x="40" y={y(high)} width="560" height={y(low) - y(high)} fill="rgba(var(--success-rgb),.1)" />
      <text x="44" y={y(high) - 6} {...TXT}>
        Goal {low}–{high} contacts a week
      </text>
      <line x1="40" y1={AXIS} x2="600" y2={AXIS} stroke="var(--border-2)" />
      {weeks.map((w, i) => {
        const x = 40 + i * slot + (slot - bw) / 2;
        const total = w.emails + w.calls;
        return (
          <g key={w.key}>
            <rect x={x} y={y(w.emails)} width={bw} height={AXIS - y(w.emails)} rx="3" fill="var(--accent)">
              <title>{`${w.label}: ${w.emails} emails`}</title>
            </rect>
            <rect x={x} y={y(total)} width={bw} height={y(w.emails) - y(total)} rx="3" fill="var(--accent-light)">
              <title>{`${w.label}: ${w.calls} calls`}</title>
            </rect>
            <text x={x + bw / 2} y={y(total) - 6} textAnchor="middle" fontSize="11" fill="var(--fg)" fontFamily="inherit">
              {total}
            </text>
            <text x={x + bw / 2} y="180" textAnchor="middle" {...TXT}>
              {w.label}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}
