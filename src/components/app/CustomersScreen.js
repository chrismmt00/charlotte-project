"use client";

import { useState } from "react";
import { CUSTOMERS_COPY } from "@/lib/app/kinds";
import { Card, DevStateSwitch, EmptyState, ErrorState, FieldError, Page, PageHeader, SkeletonRows, Spinner, StatTile, btnSecondary, inputCls } from "./ui";
import { useToast } from "./Toast";
import { useAction, useListStatus } from "./hooks";
import { download } from "./api";
import { useBusiness } from "./useBusiness";

export default function CustomersScreen() {
  const biz = useBusiness();
  return <Customers key={biz.kind} biz={biz} />;
}

function Customers({ biz }) {
  const copy = CUSTOMERS_COPY[biz.kind];
  const toast = useToast();
  const [status, setStatus, retry] = useListStatus("live");
  const [q, setQ] = useState("");
  const exp = useAction();

  const all = biz.customers;
  const query = q.trim().toLowerCase();
  const rows = all.filter((c) => !query || c.name.toLowerCase().includes(query) || c.phone.includes(query));
  const empty = status === "empty" || (status === "live" && all.length === 0);
  const none = empty;
  const total = none ? 0 : all.length;
  const repeat = none ? 0 : all.filter((c) => c.visits > 1).length;
  const optin = none ? 0 : all.filter((c) => c.optIn).length;

  const exportCsv = async () => {
    const r = await exp.run(() => download("/api/app/customers/export", "customers.csv"), "Couldn’t export the list. Nothing was downloaded. Try again.");
    if (r.ok) toast("customers.csv downloaded");
  };

  const shown = empty ? "empty" : status;

  return (
    <Page className="page-app-customers">
      <PageHeader eyebrow="Customers" title={`People who ${copy.verb}`}>
        <div className="flex flex-col gap-1">
          <label htmlFor="cu-q" className="sr-only">
            Search customers
          </label>
          <input id="cu-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone" className={`${inputCls} w-64 max-w-full rounded-full px-4`} />
        </div>
        <button type="button" className={btnSecondary} onClick={exportCsv} disabled={exp.busy || shown === "empty"}>
          {exp.busy ? <Spinner /> : null}
          Export CSV
        </button>
      </PageHeader>
      {exp.error ? <FieldError>{exp.error}</FieldError> : null}

      <div className="tiles grid gap-4 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        <StatTile label="Customers" value={String(total)} />
        <StatTile label="Came back this month" value={String(repeat)} note={`repeat ${copy.noun}`} />
        <StatTile label="Opted in to texts" value={String(optin)} note="reminders and news" />
      </div>

      <Card as="div" className="card-customers overflow-hidden">
        {shown === "loading" ? <SkeletonRows /> : null}
        {shown === "error" ? (
          <div className="p-4">
            <ErrorState onRetry={retry}>Couldn’t load your customers. Your site is still up; this is just the list.</ErrorState>
          </div>
        ) : null}
        {shown === "empty" ? (
          <div className="p-4">
            <EmptyState title="No customers yet">Every online {biz.kind === "booking" ? "booking" : "order"} adds a customer here with their consent to reminders. Nothing is imported from anywhere else.</EmptyState>
          </div>
        ) : null}
        {shown === "live" ? (
          <div className="overflow-x-auto">
            <table className="customers-table w-full min-w-[820px] border-collapse text-sm">
              <caption className="sr-only">Customers</caption>
              <thead>
                <tr className="bg-surface-2">
                  {["Customer", copy.colVisits, `Last ${copy.visitWord}`, "Spent", "Notes", "Texts", "Contact"].map((h) => (
                    <th key={h} scope="col" className="text-left font-medium text-[13px] text-muted-2 px-4 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="customer-row border-t border-border">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="w-9 h-9 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[13px] flex-none">
                          {c.name.replace("[", "").charAt(0)}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-[13px] text-muted-2">{c.phone}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.visits}</td>
                    <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{c.last}</td>
                    <td className="px-4 py-3 tabular-nums">{c.spent}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-2 max-w-[200px]">{c.note || "—"}</td>
                    <td className={`px-4 py-3 ${c.optIn ? "text-success" : "text-muted-2"}`}>{c.optIn ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex gap-1.5">
                        <a href="tel:+1" className={btnSecondary} aria-label={`Call ${c.name}`}>
                          Call
                        </a>
                        <a href="sms:+1" className={btnSecondary} aria-label={`Text ${c.name}`}>
                          Text
                        </a>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="m-0 px-6 py-6 text-sm text-muted-2">No one matches “{q}”.</p> : null}
          </div>
        ) : null}
      </Card>

      <p className="m-0 text-[13px] text-muted-2">
        This list is yours: export it any time. Texts go only to people who ticked the box at checkout; “Stop” unsubscribes them automatically.
      </p>

      <DevStateSwitch value={status} onChange={setStatus} options={["live", "empty", "loading", "error"]} />
    </Page>
  );
}
