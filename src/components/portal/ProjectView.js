"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGE_COPY, UPLOAD_MAX_MB, money2, partAmount } from "@/lib/portal/sample";
import { listState, planStartLine, usePortal } from "./PortalContext";
import { Card, Chip, Icon, ListStatus, PageHead, RingCard, Spinner, btnPrimary, btnSecondary, linkBtn } from "./ui";
import ApproveDialog from "./ApproveDialog";
import SignOffDialog from "./SignOffDialog";

const CK_TONE = { received: ["Received", "success"], needed: ["Needed", "warning"], uploading: ["Uploading", "accent"], failed: ["Failed", "danger"] };

function StageActions({ p, openDialog }) {
  const prev = p.project.previewUrl;
  if (p.stage === "demo")
    return (
      <>
        <a href={prev} className={btnSecondary}>
          Open the demo ↗
        </a>
        <button type="button" onClick={() => openDialog("approve")} className={btnPrimary}>
          Approve the demo
        </button>
      </>
    );
  if (p.stage === "launch")
    return (
      <>
        <a href={prev} className={btnSecondary}>
          Preview the final site ↗
        </a>
        <button type="button" onClick={() => openDialog("signoff")} className={btnPrimary}>
          Sign off on the launch
        </button>
      </>
    );
  if (p.stage === "kickoff")
    return (
      <a href="#content" className={btnPrimary}>
        Send your content
      </a>
    );
  return (
    <>
      <a href={p.project.liveUrl} className={btnSecondary}>
        Open your live site ↗
      </a>
      <a href="#files" className={btnPrimary}>
        Download the handover pack
      </a>
    </>
  );
}

export default function ProjectView() {
  const p = usePortal();
  const [dialog, setDialog] = useState(null); // approve | signoff
  const [uploads, setUploads] = useState({}); // id -> { state: uploading | failed, message }
  const copy = STAGE_COPY[p.stage];
  const tl = p.timeline;
  const fl = p.files;
  const ckStatus = listState(p, p.checklist.length);
  const done = p.checklist.filter((c) => c.state === "received").length;

  async function upload(item, list) {
    const chosen = Array.from(list || []);
    if (!chosen.length) return;
    if (chosen.some((f) => f.size > UPLOAD_MAX_MB * 1024 * 1024)) {
      setUploads((u) => ({ ...u, [item.id]: { state: "failed", message: `Upload failed: a file was over ${UPLOAD_MAX_MB} MB. Try smaller files, or email them.` } }));
      return;
    }
    setUploads((u) => ({ ...u, [item.id]: { state: "uploading" } }));
    const form = new FormData();
    form.append("itemId", item.id);
    chosen.forEach((f) => form.append("files", f));
    try {
      await p.api("/api/portal/project/upload", { body: form });
      setUploads((u) => Object.fromEntries(Object.entries(u).filter(([k]) => k !== item.id)));
      p.patch((s) => ({ checklist: s.checklist.map((c) => (c.id === item.id ? { ...c, state: "received", sub: `[${chosen.length} ${chosen.length === 1 ? "file" : "files"}] · just now` } : c)) }));
      p.toast("Uploaded. We will tidy and place them.");
    } catch {
      setUploads((u) => ({ ...u, [item.id]: { state: "failed", message: `Upload failed: the file was over ${UPLOAD_MAX_MB} MB, or the connection dropped. Try smaller files, or email them.` } }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow="Project" title={p.offer.name} lede="Three weeks, three milestones. Everything you need to do is on this page." />

      <RingCard titleId="stage-h" className="gap-[18px]">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex flex-col gap-2 max-w-[640px]">
            <Chip tone="accent" className="self-start">
              {copy.chip}
            </Chip>
            <h2 id="stage-h" className="font-display font-normal text-[30px] leading-[1.1] m-0">
              {copy.title}
            </h2>
            <p className="m-0 text-[15px] leading-[1.6] text-muted-2">{copy.text}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <StageActions p={p} openDialog={setDialog} />
          </div>
        </div>
        {p.stage === "demo" ? (
          <p className="m-0 text-[13px] text-muted-2">
            Something off?{" "}
            <Link href="/portal/support" className="text-accent-light">
              Send notes
            </Link>{" "}
            and we fix them before you approve. Approving creates the 30% invoice ({money2(partAmount(p.offer, 30))}).
          </p>
        ) : null}
        {p.stage === "launch" ? (
          <p className="m-0 text-[13px] text-muted-2">
            Signing accepts the launch, makes the 20% invoice ({money2(partAmount(p.offer, 20))}) due, and hands you the code. {planStartLine(p)}
          </p>
        ) : null}
      </RingCard>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Card titleId="tl-h" title="How the three weeks go">
            <ol className="list-none m-0 p-0 flex flex-col">
              {tl.map((t) => (
                <li key={t.title} aria-current={t.now ? "step" : undefined} className="grid grid-cols-[24px_minmax(0,1fr)_auto] gap-3.5 py-3 border-t border-border items-start">
                  <span aria-hidden="true" className={`w-[22px] h-[22px] mt-px rounded-full border-2 inline-flex items-center justify-center ${t.done ? "border-success bg-success text-bg" : t.now ? "border-accent-light" : "border-border-2"}`}>
                    {t.done ? <Icon name="check" size={12} strokeWidth={3} /> : null}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className={`text-[15px] font-medium ${t.done || t.now ? "text-fg" : "text-muted-2"}`}>
                      {t.title}
                      {t.done ? <span className="sr-only"> (done)</span> : null}
                      {t.now ? <span className="sr-only"> (now)</span> : null}
                    </span>
                    <span className="text-[13px] leading-normal text-muted-2">{t.sub}</span>
                  </span>
                  <span className={`text-xs whitespace-nowrap ${t.now ? "text-accent-light" : "text-muted-2"}`}>{t.when}</span>
                </li>
              ))}
            </ol>
          </Card>

          {!p.privateUploadsEnabled?<p className="text-sm text-muted-2">Please email project files to <a href={`mailto:${p.uploadEmail}`} className="text-accent-light underline">{p.uploadEmail}</a>. Private uploads are currently disabled.</p>:null}
          <Card id="content" titleId="ck-h" title={`Your content · ${done} of ${p.checklist.length}`} className="scroll-mt-24" action={<span className="text-[13px] text-muted-2">Photos: JPG or HEIC, as big as you have. Text: anything, we tidy it.</span>}>
            {ckStatus !== "live" ? (
              <ListStatus status={ckStatus} rows={4} label="your content list" empty={{ text: "Nothing to send yet. We will list what we need here.", action: <Link href="/portal/support" className={linkBtn}>Ask a question</Link> }} onRetry={p.retry} />
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col">
                {p.checklist.map((c) => {
                  const up = uploads[c.id];
                  const state = up?.state || c.state;
                  const [label, tone] = CK_TONE[state];
                  const inputId = `up-${c.id}`;
                  return (
                    <li key={c.id} className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 min-h-14 border-t border-border py-2">
                      <span className="flex flex-col gap-0.5 flex-[1_1_220px] min-w-0">
                        <span className="text-sm">{c.title}</span>
                        <span className={`text-[13px] ${state === "failed" ? "text-danger" : "text-muted-2"}`} role={state === "failed" ? "alert" : undefined}>
                          {state === "failed" ? up?.message : state === "uploading" ? "Uploading…" : c.sub}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2.5">
                        <Chip tone={tone}>{label}</Chip>
                        {c.state !== "received" && p.privateUploadsEnabled ? (
                          <>
                            <input id={inputId} type="file" multiple accept={c.id === "logo" ? "image/*,.svg" : "image/*,.heic,.pdf,.doc,.docx,.txt"} className="sr-only" tabIndex={-1} aria-label={`Choose files for ${c.title}`} onChange={(e) => { upload(c, e.target.files); e.target.value = ""; }} />
                            <button type="button" disabled={state === "uploading"} aria-busy={state === "uploading"} onClick={() => document.getElementById(inputId)?.click()} className={btnSecondary}>
                              {state === "uploading" ? (
                                <>
                                  <Spinner />
                                  Uploading…
                                </>
                              ) : (
                                <>
                                  <Icon name="upload" size={16} />
                                  {state === "failed" ? "Try again" : "Upload"}
                                </>
                              )}
                            </button>
                          </>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="m-0 text-[13px] text-muted-2">Rather email it? Send to contact@klyvorastudio.com with your business name and we tick it off here.</p>
          </Card>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <Card id="files" titleId="files-h" title="Files" className="scroll-mt-24">
            <ul className="list-none m-0 p-0 flex flex-col">
              {fl.map((f) => (
                <li key={f.id} className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 min-h-14 border-t border-border py-2">
                  <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-sm">{f.name}</span>
                    <span className="text-[13px] text-muted-2">{f.sub}</span>
                  </span>
                  {f.ready ? (
                    <a href={f.href} {...(f.external ? { target: "_blank", rel: "noreferrer" } : { download: true })} className={linkBtn}>
                      {f.action}
                      {f.external ? <span aria-hidden="true"> ↗</span> : null}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-2">
                      <Icon name="lock" size={14} />
                      {f.action}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="m-0 text-[13px] text-muted-2">The code lands in a GitHub repository under your account at final payment; a zip is here too. Klyvora templates inside it stay licensed to you.</p>
          </Card>

          <Card titleId="team-h" title="Your team at Klyvora">
            <ul className="list-none m-0 p-0 flex flex-col">
              {p.team.map((m) => (
                <li key={m.name} className="flex items-center gap-3 min-h-14 border-t border-border py-2">
                  <span aria-hidden="true" className="w-9 h-9 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[13px] font-medium flex-none">
                    {m.initial}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm">{m.name}</span>
                    <span className="text-[13px] text-muted-2">{m.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {dialog === "approve" ? <ApproveDialog onClose={() => setDialog(null)} /> : null}
      {dialog === "signoff" ? <SignOffDialog onClose={() => setDialog(null)} /> : null}
    </div>
  );
}
