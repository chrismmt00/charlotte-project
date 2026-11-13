"use client";

import { useRef, useState } from "react";
import { Dialog, Icon, Alert, fieldCls } from "./Overlay";
import { api } from "./api";
import { btnPrimary, btnSecondary } from "@/components/admin/ui";
import { OFFERS } from "@/lib/offers";
import { plainEmail } from "@/lib/admin/sample-leads";

const STEPS = ["upload", "mapping", "dedupe", "done"];
const LABELS = ["Upload", "Map columns", "Duplicates", "Done"];
const TITLES = ["Upload a file", "Map the columns", "Handle duplicates", "Import finished"];
const FIELDS = [
  { key: "business", label: "Business", req: true, alias: ["business", "company", "shop", "name of business"] },
  { key: "name", label: "Contact name", req: true, alias: ["contact", "name", "owner"] },
  { key: "email", label: "Email", req: true, alias: ["email", "e-mail"] },
  { key: "phone", label: "Phone", alias: ["phone", "mobile", "tel"] },
  { key: "offer", label: "Offer", alias: ["service", "offer", "interest"] },
  { key: "source", label: "Source", alias: ["source", "channel"] },
  { key: "notes", label: "Notes", alias: ["notes", "message", "comments"] },
];
const TEMPLATE = "data:text/csv;charset=utf-8," + encodeURIComponent("Business,Name,Email,Phone,Service,Source,Notes\n");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

function guess(headers) {
  const out = {};
  for (const f of FIELDS) {
    const exact = headers.find((h) => f.alias.includes(h.trim().toLowerCase()));
    const part = headers.find((h) => f.alias.some((a) => h.toLowerCase().includes(a)));
    out[f.key] = exact || part || "";
  }
  return out;
}

function sampleCsv(existing) {
  const lines = ["Business,Name,Email,Phone,Service,Source,Notes"];
  for (let i = 1; i <= 12; i++) {
    const dupe = existing[i % existing.length];
    lines.push(`Sample shop [${i + 20}],[Owner ${i + 20}],${i <= 3 ? plainEmail(dupe) : `owner${i + 20}@example.com`},[Phone],Website + Booking,Google,Imported from the sample file`);
  }
  return lines.join("\n");
}

function sizeLabel(n) {
  return n < 1024 ? `${n} B` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

// Import dialog: upload, mapping, dedupe, done. POST /api/admin/leads/import (multipart) on the last step.
export default function ImportDialog({ existingEmails, onClose, onImported }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null); // { raw, name, size, headers, rows, csv }
  const [map, setMap] = useState({});
  const [dupe, setDupe] = useState("update");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const load = async (raw) => {
    setErr("");
    if (!raw) return;
    const csv = /\.csv$/i.test(raw.name);
    if (!csv && !/\.xlsx$/i.test(raw.name)) return setErr("Pick a CSV or XLSX file.");
    if (raw.size > 5 * 1024 * 1024) return setErr("That file is over 5 MB. Split it and import in parts.");
    if (csv) {
      const rows = parseCsv(await raw.text());
      if (rows.length < 2) return setErr("We couldn’t find any rows under the header row.");
      const headers = rows[0].map((h) => h.trim());
      const data = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()])));
      setFile({ raw, name: raw.name, size: raw.size, headers, rows: data, csv: true });
      setMap(guess(headers));
    } else {
      const headers = FIELDS.map((f) => f.label);
      setFile({ raw, name: raw.name, size: raw.size, headers, rows: [], csv: false });
      setMap(Object.fromEntries(FIELDS.map((f) => [f.key, f.label])));
    }
  };

  const missingReq = FIELDS.filter((f) => f.req && !map[f.key]);
  const emailCol = map.email;
  const rows = file?.rows || [];
  const dupes = rows.filter((r) => emailCol && existingEmails.has((r[emailCol] || "").toLowerCase()));
  const missingEmail = rows.filter((r) => !emailCol || !(r[emailCol] || "").trim()).length;

  const next = async () => {
    setErr("");
    if (step === 0) {
      if (!file) return setErr("Pick a file first.");
      return setStep(1);
    }
    if (step === 1) {
      if (missingReq.length) return setErr(`Match a column to ${missingReq.map((f) => f.label.toLowerCase()).join(", ")}; ${missingReq.length > 1 ? "they are" : "it is"} required.`);
      return setStep(2);
    }
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file.raw);
    fd.set("mapping", JSON.stringify(map));
    fd.set("duplicates", dupe);
    fd.set("rows", String(rows.length));
    fd.set("duplicates_found", String(dupes.length));
    fd.set("missing_email", String(missingEmail));
    const res = await api("POST", "/api/admin/leads/import", fd);
    setBusy(false);
    if (!res.ok) return setErr(res.data?.message || "The import didn’t go through and nothing was changed. Try again.");
    const dupeKeys = new Set(dupes);
    const created = rows
      .filter((r) => (r[map.email] || "").trim() && (dupe === "import" || !dupeKeys.has(r)))
      .map((r, i) => {
        const offer = OFFERS.find((o) => o.name.toLowerCase() === (r[map.offer] || "").toLowerCase());
        return {
          id: `ld_imp_${i}_${file.size}`,
          business: r[map.business] || "[Business]",
          name: r[map.name] || "",
          email: r[map.email],
          phone: r[map.phone] || "",
          offerCode: offer ? offer.code : null,
          offer: offer ? offer.name : r[map.offer] || "Not sure yet",
          source: `Import · ${file.name}`,
          status: "New",
          score: 3,
          owner: "Chris",
          next: "—",
          when: "Just now",
          ageHours: 0,
          message: r[map.notes] || "",
        };
      });
    setResult(res.data);
    setStep(3);
    onImported(res.data, created);
  };

  const done = step === 3;
  return (
    <Dialog
      eyebrow="Import leads"
      title={TITLES[step]}
      size="lg"
      onClose={onClose}
      busy={busy}
      footer={
        done ? (
          <button type="button" className={btnPrimary} onClick={onClose}>
            View leads
          </button>
        ) : (
          <>
            <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className={btnSecondary} disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
            <button type="button" className={btnPrimary} onClick={next} disabled={busy}>
              {busy ? "Importing…" : step === 2 ? `Import ${rows.length || ""} rows`.replace("  ", " ") : "Next"}
            </button>
          </>
        )
      }
    >
      <ol aria-label="Import steps" className="list-none p-0 m-0 grid grid-cols-4 gap-2">
        {LABELS.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined} className="flex flex-col gap-1.5">
            <span className={`h-1 rounded-full ${i < step ? "bg-success" : i === step ? "bg-fg" : "bg-border-2"}`} />
            <span className={`text-[12px] ${i <= step ? "text-fg" : "text-muted-2"}`}>
              {i + 1} · {l}
            </span>
          </li>
        ))}
      </ol>

      {err ? <Alert>{err}</Alert> : null}

      {step === 0 ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              load(e.dataTransfer.files?.[0]);
            }}
            className={`border border-dashed rounded-admin p-6 flex flex-col items-center text-center gap-2 ${over ? "border-fg bg-surface-2" : "border-border-2"}`}
          >
            <Icon name="upload" size={28} />
            <div>
              Drop a CSV or XLSX here, or{" "}
              <button type="button" onClick={() => input.current?.click()} className="bg-transparent border-0 p-0 text-accent-light underline cursor-pointer text-[13px]">
                browse
              </button>
            </div>
            <input ref={input} type="file" accept=".csv,.xlsx" className="sr-only" aria-label="Choose a CSV or XLSX file" onChange={(e) => load(e.target.files?.[0])} />
            <p className="m-0 text-muted-2 max-w-[460px]">
              Up to 5 MB. We read business, contact name, email, phone, offer, source and notes.{" "}
              <a href={TEMPLATE} download="klyvora-leads-template.csv" className="text-accent-light underline">
                Download the template
              </a>
            </p>
            {process.env.NODE_ENV !== "production" ? (
              <button
                type="button"
                className="mt-1 text-[12px] text-muted-2 border border-dashed border-border-2 rounded-full px-3 min-h-8 bg-transparent cursor-pointer"
                onClick={() => load(new File([sampleCsv(existingEmails.size ? [...existingEmails] : ["owner@example.com"])], "[leads-november].csv", { type: "text/csv" }))}
              >
                Dev only: use a sample file
              </button>
            ) : null}
          </div>
          {file ? (
            <div className="flex items-center gap-3 border border-border rounded-admin px-4 py-3">
              <span className="text-[11px] border border-border-2 rounded-md px-1.5 py-0.5 text-muted-2">{file.csv ? "CSV" : "XLSX"}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate">{file.name}</div>
                <div className="text-[12px] text-muted-2">
                  {file.csv ? `${rows.length} rows · ${file.headers.length} columns · ` : "Rows are counted on the server · "}
                  {sizeLabel(file.size)}
                </div>
              </div>
              <span className="text-success text-[12px]">Ready</span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  if (input.current) input.current.value = "";
                }}
                className="w-9 h-9 rounded-[10px] border-0 bg-transparent text-muted-2 hover:text-fg hover:bg-surface-2 inline-flex items-center justify-center cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <p className="m-0 text-muted-2">Match each Klyvora field to a column in the file. We guessed from the header row; fix anything that looks off.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className="text-left text-muted-2 text-[12px]">
                  <th scope="col" className="py-2 pr-3 font-normal">Klyvora field</th>
                  <th scope="col" className="py-2 pr-3 font-normal">Column in file</th>
                  <th scope="col" className="py-2 font-normal">First value</th>
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f) => (
                  <tr key={f.key} className="border-t border-border">
                    <td className="py-2 pr-3">
                      {f.label} {f.req ? <span className="text-[11px] text-muted-2">required</span> : null}
                    </td>
                    <td className="py-2 pr-3">
                      <label htmlFor={`map-${f.key}`} className="sr-only">
                        {f.label} column
                      </label>
                      <select id={`map-${f.key}`} className={fieldCls} value={map[f.key] || ""} onChange={(e) => setMap((m) => ({ ...m, [f.key]: e.target.value }))}>
                        {file.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                        <option value="">— skip —</option>
                      </select>
                    </td>
                    <td className="py-2 text-muted-2 break-all">{(map[f.key] && rows[0]?.[map[f.key]]) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          {file.csv && dupes.length ? (
            <>
              <p className="m-0">
                <strong>
                  {dupes.length} of {rows.length} rows
                </strong>{" "}
                match leads you already have (same email). Pick what to do with them.
              </p>
              <div role="radiogroup" aria-label="Duplicate handling" className="flex flex-col gap-2">
                {[
                  ["update", "Update the existing lead", "Fill empty fields from the file; keep status, owner and notes."],
                  ["skip", "Skip them", `Import the other ${rows.length - dupes.length} only.`],
                  ["import", "Import as new rows anyway", "You will have two cards for the same business."],
                ].map(([k, l, h]) => (
                  <label key={k} className={`flex items-start gap-3 border rounded-admin px-4 py-3 cursor-pointer ${dupe === k ? "border-fg bg-surface-2" : "border-border-2"}`}>
                    <input type="radio" name="dupe" checked={dupe === k} onChange={() => setDupe(k)} className="mt-0.5 accent-[var(--accent)]" />
                    <span>
                      <span className="block">{l}</span>
                      <span className="block text-[12px] text-muted-2">{h}</span>
                    </span>
                  </label>
                ))}
              </div>
              <details className="text-muted-2">
                <summary className="cursor-pointer min-h-9 inline-flex items-center">Show the {dupes.length} matches</summary>
                <ul className="m-0 mt-1 pl-5">
                  {dupes.map((d, i) => (
                    <li key={i}>
                      {d[map.email]} · {d[map.business]}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <p className="m-0">{file.csv ? `No rows match leads you already have, so all ${rows.length} will be added as new.` : "We check for duplicates on the server by email and update the existing lead instead of adding a second card."}</p>
          )}
          {missingEmail ? <p className="m-0 text-muted-2">{missingEmail} rows have no email and will be skipped.</p> : null}
        </>
      ) : null}

      {done && result ? (
        <div className="flex flex-col items-center text-center gap-2 py-4">
          <span className="w-12 h-12 rounded-full border border-[rgba(var(--success-rgb),.5)] text-success inline-flex items-center justify-center">
            <Icon name="check" size={22} />
          </span>
          <h3 className="m-0 text-[18px] font-medium">
            {result.imported} leads imported, {result.updated} updated
          </h3>
          <p className="m-0 text-muted-2 max-w-[460px]">
            All {result.imported} start as <strong className="text-fg">New</strong>, owned by Chris, source “{result.source}”. {result.skipped} rows were skipped.
          </p>
        </div>
      ) : null}
    </Dialog>
  );
}
