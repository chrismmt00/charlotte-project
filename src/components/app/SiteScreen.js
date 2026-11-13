"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Dialog, { CancelButton } from "./Dialog";
import { Card, CardTitle, DevStateSwitch, FieldError, FormGroup, Icon, Page, PageHeader, Spinner, btnPrimary, btnSecondary, inputCls } from "./ui";
import { useToast } from "./Toast";
import { useAction } from "./hooks";
import { api } from "./api";
import { consumeFailNext, useBusiness } from "./useBusiness";

const MAX_BYTES = 25 * 1024 * 1024;
const TODAY_INDEX = 3; // Thursday on the sample week
const TINTS = ["bg-accent/25", "bg-accent-light/20", "bg-surface-2", "bg-accent/15", "bg-bg-deep", "bg-accent-light/10"];

export default function SiteScreen() {
  const biz = useBusiness();
  return <Site key={biz.kind} biz={biz} />;
}

function EditTextDialog({ page, onClose, onSave }) {
  const [headline, setHeadline] = useState(page.headline);
  const [intro, setIntro] = useState(page.intro);
  const [cta, setCta] = useState(page.cta);
  return (
    <Dialog
      size="large"
      eyebrow="Pages and text"
      title={`Edit text · ${page.name}`}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ headline: headline.trim(), intro: intro.trim(), cta: cta.trim() });
      }}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <button type="submit" className={btnPrimary}>
            Save text
          </button>
        </>
      }
    >
      <div className="two-col grid gap-5 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <div className="flex flex-col gap-3.5">
          <FormGroup id="et-head" label="Headline">
            <input id="et-head" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} />
          </FormGroup>
          <FormGroup id="et-intro" label="Intro">
            <textarea id="et-intro" rows={6} value={intro} onChange={(e) => setIntro(e.target.value)} className={`${inputCls} py-3 leading-relaxed resize-y`} />
          </FormGroup>
          <FormGroup id="et-cta" label="Button text">
            <input id="et-cta" type="text" value={cta} onChange={(e) => setCta(e.target.value)} className={inputCls} />
          </FormGroup>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted-2">How it reads</span>
          <div className="preview flex flex-col gap-3 bg-bg-deep border border-border rounded-input p-5 min-h-48">
            <span className="font-display text-[28px] leading-tight break-words">{headline || "Headline"}</span>
            <span className="text-sm text-muted-2 leading-relaxed whitespace-pre-line break-words">{intro}</span>
            <span className="self-start inline-flex items-center min-h-10 px-4 rounded-full bg-fg text-bg text-[13px] font-medium">{cta || "Button"}</span>
          </div>
          <span className="text-xs text-muted-2">Layout, colors and new sections are a request to Klyvora.</span>
        </div>
      </div>
    </Dialog>
  );
}

let uploadSeq = 0;

function Site({ biz }) {
  const toast = useToast();
  const [hours, setHours] = useState(biz.hours);
  const [notice, setNotice] = useState("");
  const [info, setInfo] = useState(biz.info);
  const [pages, setPages] = useState(biz.pages);
  const [photos, setPhotos] = useState(biz.photos);
  const [uploads, setUploads] = useState([]); // { key, name, state: "uploading" | "failed", message, file }
  const [preview, setPreview] = useState("idle"); // dev only: idle | uploading | failed
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(false);
  const [editId, setEditId] = useState(null);
  const [over, setOver] = useState(false);
  const publish = useAction();
  const fileInput = useRef(null);

  const touch = () => {
    setDirty(true);
    setPublished(false);
  };
  const setHour = (i, patch) => {
    setHours((h) => h.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    touch();
  };
  const setInfoField = (k, v) => {
    setInfo((x) => ({ ...x, [k]: v }));
    touch();
  };

  const setUpload = (key, patch) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const sendUpload = async (key, file) => {
    if (file.size > MAX_BYTES) {
      setUpload(key, { state: "failed", message: "Too big (over 25 MB)", tooBig: true });
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      setUpload(key, { state: "failed", message: "That isn’t an image", tooBig: true });
      return;
    }
    setUpload(key, { state: "uploading", message: "" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const headers = consumeFailNext() ? { "x-klyvora-dev-fail": "1" } : undefined;
      const res = await fetch("/api/app/site/uploads", { method: "POST", body: fd, headers });
      if (!res.ok) {
        let message = "Upload failed";
        try {
          message = (await res.json()).error || message;
        } catch {}
        setUpload(key, { state: "failed", message, tooBig: res.status === 413 || res.status === 415 });
        return;
      }
      const data = await res.json();
      setUploads((u) => u.filter((x) => x.key !== key));
      setPhotos((p) => [...p, { id: data.id, label: data.name, tint: p.length % TINTS.length }]);
      touch();
      toast("Photo added; publish to show it on the site");
    } catch {
      setUpload(key, { state: "failed", message: "Upload failed" });
    }
  };

  const startUploads = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const added = list.map((file) => {
      uploadSeq += 1;
      return { key: `up_${uploadSeq}`, name: file.name, state: "uploading", message: "", file };
    });
    setUploads((u) => [...u, ...added]);
    added.forEach((u) => sendUpload(u.key, u.file));
  };

  const retryUpload = (u) => {
    if (u.tooBig) {
      setUploads((l) => l.filter((x) => x.key !== u.key));
      toast("Pick a smaller file (under 25 MB)");
      fileInput.current?.click();
      return;
    }
    sendUpload(u.key, u.file);
  };

  const doPublish = async () => {
    if (!dirty) return;
    const r = await publish.run(
      () =>
        api("/api/app/site/publish", {
          body: {
            hours: hours.map((h) => ({ day: h.day, open: h.open, close: h.close, closed: h.closed })),
            notice,
            info,
            pages: pages.map((p) => ({ id: p.id, headline: p.headline, intro: p.intro, cta: p.cta })),
            photos: photos.map((p) => p.id),
          },
        }),
      "Couldn’t publish. Your changes are still here and your site hasn’t changed. Try again."
    );
    if (r.ok) {
      setDirty(false);
      setPublished(true);
      toast("Published · live in about a minute");
    }
  };

  const todayClosed = hours[TODAY_INDEX].closed;
  const editPage = pages.find((p) => p.id === editId);
  const publishLabel = publish.busy ? "Publishing…" : dirty ? "Publish changes" : published ? "Published" : "Nothing to publish";
  const showUploading = preview === "uploading";
  const showFailed = preview === "failed";

  return (
    <Page className="page-app-site">
      <PageHeader eyebrow="Hours, info and photos" title="Your site’s details">
        <span role="status" className="text-[13px] text-muted-2">
          {dirty ? "Unsaved changes" : "Everything is live"}
        </span>
        <a href={biz.liveUrl} target="_blank" rel="noreferrer" className={btnSecondary}>
          View my site
          <Icon name="external" size={15} />
        </a>
        <button type="button" className={btnPrimary} onClick={doPublish} disabled={!dirty || publish.busy}>
          {publish.busy ? <Spinner /> : null}
          {publishLabel}
        </button>
      </PageHeader>
      {publish.error ? <FieldError>{publish.error}</FieldError> : null}

      <div className="grid gap-4 items-start grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))]">
        <Card aria-labelledby="hrs-h" className="card-hours p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center gap-3">
            <CardTitle id="hrs-h">Hours</CardTitle>
            <button type="button" className={btnSecondary} onClick={() => setHour(TODAY_INDEX, { closed: !todayClosed })}>
              {todayClosed ? "Reopen today" : "Close today"}
            </button>
          </div>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Opening hours by day</caption>
            <tbody>
              {hours.map((h, i) => (
                <tr key={h.day} className="border-t border-border">
                  <th scope="row" className="text-left font-normal py-2 w-14">
                    {h.day}
                  </th>
                  <td className="p-1">
                    <label htmlFor={`o-${i}`} className="sr-only">
                      {h.day} opens
                    </label>
                    <input id={`o-${i}`} type="time" value={h.open} disabled={h.closed} onChange={(e) => setHour(i, { open: e.target.value })} className={`${inputCls} px-2.5 ${h.closed ? "opacity-40" : ""}`} />
                  </td>
                  <td className="p-1">
                    <label htmlFor={`c-${i}`} className="sr-only">
                      {h.day} closes
                    </label>
                    <input id={`c-${i}`} type="time" value={h.close} disabled={h.closed} onChange={(e) => setHour(i, { close: e.target.value })} className={`${inputCls} px-2.5 ${h.closed ? "opacity-40" : ""}`} />
                  </td>
                  <td className="py-1 pl-2 text-right">
                    <button
                      type="button"
                      aria-pressed={h.closed}
                      aria-label={`${h.day}: ${h.closed ? "closed, tap to open" : "open, tap to close"}`}
                      onClick={() => setHour(i, { closed: !h.closed })}
                      className={`${btnSecondary} ${h.closed ? "text-muted-2" : ""}`}
                    >
                      {h.closed ? "Closed" : "Open"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <FormGroup id="hol" label="Holiday or special notice" hint="Shows at the top of your site until you clear it.">
            <input
              id="hol"
              type="text"
              value={notice}
              onChange={(e) => {
                setNotice(e.target.value);
                touch();
              }}
              placeholder="Closed [date] for [reason]"
              aria-describedby="hol-hint"
              className={inputCls}
            />
          </FormGroup>
        </Card>

        <Card aria-labelledby="info-h" className="card-business-info p-6 flex flex-col gap-3.5">
          <CardTitle id="info-h">Business info</CardTitle>
          <FormGroup id="i-name" label="Business name">
            <input id="i-name" type="text" value={info.name} onChange={(e) => setInfoField("name", e.target.value)} className={inputCls} />
          </FormGroup>
          <FormGroup id="i-tag" label="One-line description">
            <input id="i-tag" type="text" value={info.tagline} onChange={(e) => setInfoField("tagline", e.target.value)} className={inputCls} />
          </FormGroup>
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            <FormGroup id="i-phone" label="Phone">
              <input id="i-phone" type="tel" value={info.phone} onChange={(e) => setInfoField("phone", e.target.value)} className={inputCls} />
            </FormGroup>
            <FormGroup id="i-email" label="Email">
              <input id="i-email" type="email" value={info.email} onChange={(e) => setInfoField("email", e.target.value)} className={inputCls} />
            </FormGroup>
          </div>
          <FormGroup id="i-addr" label="Address" hint="Drives the map and directions link.">
            <input id="i-addr" type="text" value={info.address} onChange={(e) => setInfoField("address", e.target.value)} aria-describedby="i-addr-hint" className={inputCls} />
          </FormGroup>
          <FormGroup id="i-ig" label="Instagram">
            <input id="i-ig" type="text" value={info.instagram} onChange={(e) => setInfoField("instagram", e.target.value)} className={inputCls} />
          </FormGroup>
        </Card>

        <Card aria-labelledby="ph-h" className="card-photos p-6 flex flex-col gap-3.5">
          <div className="flex justify-between items-center gap-3">
            <CardTitle id="ph-h">Photos</CardTitle>
            <label htmlFor="ph-up" className={`${btnSecondary} focus-within:outline focus-within:outline-2 focus-within:outline-accent-light`}>
              <Icon name="upload" size={16} />
              Upload
              <input
                id="ph-up"
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  startUploads(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <ul className="list-none m-0 p-0 grid grid-cols-3 gap-2.5">
            {photos.map((p, i) => (
              <li key={p.id} className={`photo-tile relative aspect-square rounded-input border border-border ${TINTS[p.tint % TINTS.length]} flex items-end p-2 box-border overflow-hidden`}>
                <span className="text-[11px] text-muted-2 bg-[rgba(var(--bg-rgb),.7)] rounded-full px-2 py-0.5 max-w-full truncate">{i === 0 ? "Hero" : p.label}</span>
              </li>
            ))}
            {uploads.map((u) =>
              u.state === "uploading" ? (
                <UploadingTile key={u.key} name={u.name} />
              ) : (
                <FailedTile key={u.key} message={u.message} onRetry={() => retryUpload(u)} />
              )
            )}
            {showUploading ? <UploadingTile name="[IMG_0427.jpg]" /> : null}
            {showFailed ? <FailedTile message="Too big (over 25 MB)" onRetry={() => toast("Pick a smaller file (under 25 MB)")} /> : null}
            <li
              className={`photo-drop aspect-square rounded-input border border-dashed ${over ? "border-accent-light text-fg" : "border-border-2 text-muted-2"} flex items-center justify-center text-[13px] text-center p-2 box-border`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                startUploads(e.dataTransfer.files);
              }}
            >
              Drop photos here
            </li>
          </ul>
          <span className="text-xs text-muted-2">First photo is the hero. Photos are resized and served through Cloudflare. Up to 25 MB each.</span>
          <DevStateSwitch label="Preview upload" value={preview} onChange={setPreview} options={["idle", "uploading", "failed"]} />
        </Card>

        <Card aria-labelledby="pg-h" className="card-pages p-6 flex flex-col gap-3">
          <CardTitle id="pg-h">Pages and text</CardTitle>
          <ul className="list-none m-0 p-0 flex flex-col">
            {pages.map((pg) => (
              <li key={pg.id} className="page-row flex items-center justify-between gap-3 border-t border-border py-2">
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium">{pg.name}</span>
                  <span className="text-[13px] text-muted-2">{pg.note}</span>
                </span>
                <button type="button" className={btnSecondary} onClick={() => setEditId(pg.id)}>
                  Edit text<span className="sr-only"> · {pg.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
            You edit the words and photos. Layout and new pages are a request to Klyvora: small ones are in your plan, bigger ones get a quote.{" "}
            <Link href="/app/plan" className="text-accent-light">
              Ask Klyvora
            </Link>
          </p>
        </Card>
      </div>

      {editPage ? (
        <EditTextDialog
          key={editPage.id}
          page={editPage}
          onClose={() => setEditId(null)}
          onSave={(v) => {
            setPages((l) => l.map((p) => (p.id === editPage.id ? { ...p, ...v } : p)));
            touch();
            setEditId(null);
            toast(`${editPage.name} text saved; publish to make it live`);
          }}
        />
      ) : null}
    </Page>
  );
}

function UploadingTile({ name }) {
  return (
    <li className="photo-uploading aspect-square rounded-input border border-accent-light bg-surface-2 flex flex-col items-center justify-center gap-2 text-xs text-muted-2 text-center p-2.5 box-border" aria-busy="true">
      <Spinner />
      <span className="max-w-full truncate">Uploading {name}</span>
      <span aria-hidden="true" className="w-[70%] h-1 rounded-full bg-border overflow-hidden">
        <span className="block h-full w-[70%] bg-accent" />
      </span>
    </li>
  );
}

function FailedTile({ message, onRetry }) {
  return (
    <li role="alert" className="photo-failed aspect-square rounded-input border border-danger bg-danger/5 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-2 text-center p-2 box-border">
      <span className="text-danger">
        <Icon name="alert" size={20} />
      </span>
      <span>{message}</span>
      <button type="button" className={`${btnSecondary} !min-h-11 !px-3`} onClick={onRetry}>
        Try again
      </button>
    </li>
  );
}
