"use client";

import Link from "next/link";
import { HOME_COPY } from "@/lib/app/kinds";
import { Card, CardTitle, DevStateSwitch, EmptyState, Icon, Page, PageHeader, SkeletonRows, StatTile, StatusPill, btnPrimary, btnSecondary } from "./ui";
import { useListStatus } from "./hooks";
import { useBusiness } from "./useBusiness";

export default function HomeScreen() {
  const biz = useBusiness();
  return <Home key={biz.kind} biz={biz} />;
}

function Home({ biz }) {
  const copy = HOME_COPY[biz.kind];
  const [status, setStatus] = useListStatus("live");
  const empty = status === "empty";
  const [s1, s2] = biz.home.stats;

  return (
    <Page className="page-app-home">
      <PageHeader eyebrow="[Weekday, date] · [Business name]" title={`Hello, ${biz.owner}.`}>
        <a href={biz.liveUrl} target="_blank" rel="noreferrer" className={btnSecondary}>
          View my site
          <Icon name="external" size={15} />
        </a>
        <Link href="/app/site" className={btnPrimary}>
          Change today’s hours
        </Link>
      </PageHeader>

      <div className="tiles grid gap-4 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        <StatTile label={s1.label} value={empty ? "0" : s1.value} note={empty ? s1.emptyNote : s1.note} href={s1.href} />
        <StatTile label={s2.label} value={s2.value} note={s2.note} />
        <StatTile label="Site visits this week" value="[n]" note="from analytics, if enabled" />
        <StatTile label="Messages" value={String(biz.home.messages)} note="from your contact form" />
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        <Card aria-labelledby="today-h" className="card-today flex-[3_1_520px] overflow-hidden">
          <div className="flex justify-between items-center gap-3 px-6 pt-5 pb-3">
            <CardTitle id="today-h">{copy.todayTitle}</CardTitle>
            <Link href="/app/bookings" className="text-[13px] text-accent-light min-h-11 inline-flex items-center">
              See all →
            </Link>
          </div>
          {status === "loading" ? <SkeletonRows /> : null}
          {status === "error" ? (
            <div className="px-4 pb-4">
              <EmptyState title="Couldn’t load today" action={<button type="button" className={btnSecondary} onClick={() => setStatus("loading")}>Retry</button>}>
                Your site is still up; this is just the list.
              </EmptyState>
            </div>
          ) : null}
          {empty ? (
            <div className="px-4 pb-4">
              <EmptyState
                title={copy.empty[0]}
                action={
                  <Link href="/app/site" className={btnSecondary}>
                    Change today’s hours
                  </Link>
                }
              >
                {copy.empty[1]}
              </EmptyState>
            </div>
          ) : null}
          {status === "live" ? (
            <ul className="today-list list-none m-0 px-2 pb-2">
              {biz.home.today.map((b) => (
                <li key={b.id} className="today-row flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-input min-h-14 box-border">
                  <span className="text-sm tabular-nums min-w-16 text-muted-2">{b.time}</span>
                  <span className="flex-[1_1_200px] min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{b.who}</span>
                    <span className="text-[13px] text-muted-2">{b.what}</span>
                  </span>
                  <StatusPill status={b.status} />
                  <span className="text-[13px] text-muted-2 min-w-14 text-right">{b.amount}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <div className="flex-[2_1_320px] min-w-0 flex flex-col gap-4">
          <Card aria-labelledby="quick-h" className="card-quick-changes px-6 pt-5 pb-6 flex flex-col gap-1">
            <CardTitle id="quick-h" className="mb-1.5">
              Quick changes
            </CardTitle>
            {[
              ["Change hours or close a day", "/app/site"],
              [copy.quick2, "/app/catalog"],
              ["Add photos", "/app/site"],
              ["Ask Klyvora to change something", "/app/plan"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="flex justify-between items-center min-h-12 border-t border-border text-sm text-fg">
                {label}
                <span aria-hidden="true" className="text-muted">
                  →
                </span>
              </Link>
            ))}
          </Card>
          <Card aria-labelledby="live-h" className="card-site-live px-6 py-5 flex flex-col gap-2">
            <CardTitle id="live-h" className="flex items-center gap-2.5">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-success inline-block" />
              Your site is live
            </CardTitle>
            <span className="text-sm text-muted-2">{biz.domain} · changes you make here go live in about a minute.</span>
            <span className="text-[13px] text-muted-2">Last change: hours updated, [date].</span>
          </Card>
        </div>
      </div>

      <DevStateSwitch value={status} onChange={setStatus} options={["live", "empty", "loading", "error"]} />
    </Page>
  );
}
