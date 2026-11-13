"use client";

import { Fragment, useState } from "react";
import { CATALOG_COPY } from "@/lib/app/kinds";
import { Card, CardTitle, Checkbox, DevStateSwitch, EmptyState, ErrorState, FieldError, FormGroup, Icon, Page, PageHeader, SkeletonRows, Spinner, Switch, btnPrimary, btnSecondary, inputCls } from "./ui";
import Dialog, { CancelButton } from "./Dialog";
import { useToast } from "./Toast";
import { useAction, useListStatus } from "./hooks";
import { api } from "./api";
import { IS_DEV, useBusiness } from "./useBusiness";

export default function CatalogScreen() {
  const biz = useBusiness();
  return <Catalog key={biz.kind} biz={biz} />;
}

function AddItemDialog({ copy, groups, onClose, onDone }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [meta, setMeta] = useState("");
  const [group, setGroup] = useState(groups[0] || "");
  const [visible, setVisible] = useState(true);
  const [file, setFile] = useState(null);
  const [bad, setBad] = useState(false);
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setBad(true);
      return;
    }
    const r = await run(async () => {
      let photo;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/app/site/uploads", { method: "POST", body: fd });
        if (!up.ok) throw new Error(up.status === 413 ? "That photo is too big (over 25 MB). Pick a smaller one or leave it out." : "The photo didn’t upload. Try again or leave it out.");
        photo = (await up.json()).id;
      }
      return api("/api/app/catalog/items", {
        body: { name: name.trim(), price: price.trim() || undefined, desc: desc.trim() || undefined, meta: copy.metaIsGroup ? group : meta.trim() || undefined, group, visible, photo },
      });
    }, "Couldn’t add it. Nothing was published. Try again.");
    if (r.ok) onDone(r.data);
  };

  return (
    <Dialog
      size="medium"
      eyebrow={copy.title}
      title={copy.add}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Adding…" : copy.add}
          </button>
        </>
      }
    >
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <FormGroup id="ad-name" label="Name" error={bad ? "Give it a name; it shows on your site." : ""}>
          <input
            id="ad-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setBad(false);
            }}
            placeholder={copy.placeholder[0]}
            aria-invalid={bad ? true : undefined}
            aria-describedby={bad ? "ad-name-err" : undefined}
            className={inputCls}
          />
        </FormGroup>
        <FormGroup id="ad-price" label="Price">
          <input id="ad-price" type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$0" className={inputCls} />
        </FormGroup>
      </div>
      <FormGroup id="ad-desc" label="Short description">
        <input id="ad-desc" type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One line under the name" className={inputCls} />
      </FormGroup>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {copy.metaIsGroup ? null : (
          <FormGroup id="ad-meta" label={copy.col2}>
            <input id="ad-meta" type="text" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={copy.placeholder[1]} className={inputCls} />
          </FormGroup>
        )}
        <FormGroup id="ad-group" label={copy.groupsTitle}>
          <select id="ad-group" value={group} onChange={(e) => setGroup(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </FormGroup>
      </div>
      <Checkbox id="ad-vis" checked={visible} onChange={(e) => setVisible(e.target.checked)}>
        {copy.col4} right away
      </Checkbox>
      <div className="upload-tile flex flex-wrap items-center justify-between gap-3 border border-dashed border-border-2 rounded-input px-4 py-3 text-[13px] text-muted-2">
        <span className="min-w-0 truncate">{file ? file.name : "Photo (optional) · JPG or PNG"}</span>
        <label htmlFor="ad-photo" className={`${btnSecondary} focus-within:outline focus-within:outline-2 focus-within:outline-accent-light`}>
          {file ? "Change" : "Choose"}
          <input id="ad-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

function Catalog({ biz }) {
  const kind = biz.kind;
  const copy = CATALOG_COPY[kind];
  const toast = useToast();
  const [status, setStatus, retry] = useListStatus("live");
  const [groups, setGroups] = useState(biz.catalog.groups);
  const [items, setItems] = useState(biz.catalog.items);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [groupAdding, setGroupAdding] = useState(false);
  const [groupName, setGroupName] = useState("");
  const groupAction = useAction();
  const [drag, setDrag] = useState(null); // { id, overId, after }
  const [dragPreview, setDragPreview] = useState(false);

  const hasGroupCol = !copy.metaIsGroup;
  const cols = hasGroupCol ? 6 : 5;

  const inGroup = (g) => items.filter((i) => i.group === g);

  const saveOrder = async (group, ids, before) => {
    try {
      await api("/api/app/catalog/order", { method: "PUT", body: { group, ids } });
    } catch {
      setItems(before);
      toast("Couldn’t save the new order. It’s back where it was.");
    }
  };

  // Move `id` to sit before/after `targetId` (same group), or one step with delta.
  const reorder = (id, { targetId, after, delta }) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const before = items;
    const list = inGroup(item.group);
    const from = list.findIndex((i) => i.id === id);
    let to;
    if (delta) to = from + delta;
    else {
      const t = list.findIndex((i) => i.id === targetId);
      to = after ? t + 1 : t;
      if (from < to) to -= 1;
    }
    if (to < 0 || to >= list.length || to === from) return;
    const moved = list.filter((i) => i.id !== id);
    moved.splice(to, 0, item);
    // Keep other groups where they are; replace this group's items in place.
    const next = [];
    let used = false;
    for (const it of items) {
      if (it.group === item.group) {
        if (!used) {
          next.push(...moved);
          used = true;
        }
      } else next.push(it);
    }
    setItems(next);
    if (delta) toast(`${item.name} moved ${delta < 0 ? "up" : "down"} to position ${to + 1}`);
    saveOrder(item.group, moved.map((i) => i.id), before);
  };

  const toggleVisible = async (item, on) => {
    const before = items;
    setItems((l) => l.map((i) => (i.id === item.id ? { ...i, visible: on } : i)));
    try {
      await api(`/api/app/catalog/items/${encodeURIComponent(item.id)}`, { method: "PATCH", body: { visible: on } });
    } catch {
      setItems(before);
      toast(`Couldn’t ${on ? "show" : "hide"} ${item.name}. Try again.`);
    }
  };

  const saveName = async (item, name) => {
    const n = name.trim();
    if (!n || n === item.name) return;
    const before = items;
    setItems((l) => l.map((i) => (i.id === item.id ? { ...i, name: n } : i)));
    try {
      await api(`/api/app/catalog/items/${encodeURIComponent(item.id)}`, { method: "PATCH", body: { name: n } });
    } catch {
      setItems(before);
      toast("Couldn’t rename it. Try again.");
    }
  };

  const addGroup = async (e) => {
    e.preventDefault();
    const g = groupName.trim();
    if (!g) {
      setGroupAdding(false);
      return;
    }
    if (groups.some((x) => x.toLowerCase() === g.toLowerCase())) {
      groupAction.setError(`You already have a ${copy.groupWord} called ${g}.`);
      return;
    }
    const r = await groupAction.run(() => api("/api/app/catalog/groups", { body: { name: g } }), `Couldn’t add that ${copy.groupWord}. Try again.`);
    if (r.ok) {
      setGroups((l) => [...l, g]);
      setGroupAdding(false);
      setGroupName("");
      toast(`${g} added`);
    }
  };

  const shown = status === "live" && items.length === 0 ? "empty" : status;
  const addButton = (
    <button type="button" className={btnPrimary} onClick={() => setAdding(true)}>
      {copy.add}
    </button>
  );

  return (
    <Page className="page-app-catalog">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title}>
        {addButton}
      </PageHeader>

      <Card as="div" className="card-catalog overflow-hidden">
        {shown === "loading" ? <SkeletonRows /> : null}
        {shown === "error" ? (
          <div className="p-4">
            <ErrorState onRetry={retry} />
          </div>
        ) : null}
        {shown === "empty" ? (
          <div className="p-4">
            <EmptyState title={copy.empty[0]} action={<button type="button" className={btnPrimary} onClick={() => setAdding(true)}>{copy.add}</button>}>
              {copy.empty[1]}
            </EmptyState>
          </div>
        ) : null}
        {shown === "live" ? (
          <div className="overflow-x-auto">
            <table className="catalog-table w-full min-w-[760px] border-collapse text-sm">
              <caption className="sr-only">
                {copy.title}, by {copy.groupWord}. Use the up and down buttons to reorder.
              </caption>
              <thead>
                <tr className="bg-surface-2">
                  <th scope="col" className="text-left font-medium text-[13px] text-muted-2 px-4 py-3.5">
                    Order
                  </th>
                  <th scope="col" className="text-left font-medium text-[13px] text-muted-2 px-4 py-3.5">
                    {copy.col1}
                  </th>
                  {hasGroupCol ? (
                    <th scope="col" className="text-left font-medium text-[13px] text-muted-2 px-4 py-3.5">
                      {copy.col2}
                    </th>
                  ) : null}
                  <th scope="col" className="text-right font-medium text-[13px] text-muted-2 px-4 py-3.5">
                    Price
                  </th>
                  <th scope="col" className="text-left font-medium text-[13px] text-muted-2 px-4 py-3.5">
                    {copy.col4}
                  </th>
                  <th scope="col" className="text-right font-medium text-[13px] text-muted-2 px-4 py-3.5">
                    Actions
                  </th>
                </tr>
              </thead>
              {groups.map((g, gi) => {
                const list = inGroup(g);
                return (
                  <tbody key={g}>
                    <tr className="border-t border-border bg-surface-2/60">
                      <th scope="colgroup" colSpan={cols} className="text-left text-xs tracking-[.15em] uppercase text-muted-2 font-medium px-4 py-2.5">
                        {g}
                      </th>
                    </tr>
                    {list.length === 0 ? (
                      <tr className="border-t border-border">
                        <td colSpan={cols} className="px-4 py-4 text-[13px] text-muted-2">
                          Nothing in {g} yet.
                        </td>
                      </tr>
                    ) : null}
                    {list.map((it, i) => {
                      const previewLift = dragPreview && gi === 0 && i === 1;
                      const previewDrop = dragPreview && gi === 0 && i === 3;
                      const lifted = (drag && drag.id === it.id) || previewLift;
                      const dropBefore = (drag && drag.overId === it.id && !drag.after && drag.id !== it.id) || previewDrop;
                      const dropAfter = drag && drag.overId === it.id && drag.after && drag.id !== it.id;
                      const isEditing = editing === it.id;
                      return (
                        <Fragment key={it.id}>
                          {dropBefore ? (
                            <tr aria-hidden="true" className="drop-indicator">
                              <td colSpan={cols} className="p-0 h-[3px] bg-accent-light" />
                            </tr>
                          ) : null}
                          <tr
                            className={`catalog-row border-t border-border relative ${lifted ? "bg-surface-2 scale-[1.01] shadow-[0_16px_40px_rgba(0,0,0,calc(.4*var(--shadow-k)))]" : ""} ${it.visible ? "" : "opacity-60"}`}
                            aria-grabbed={lifted ? "true" : "false"}
                            data-dragging={lifted ? "true" : undefined}
                            onDragOver={(e) => {
                              if (!drag) return;
                              const dragged = items.find((x) => x.id === drag.id);
                              if (!dragged || dragged.group !== it.group) return;
                              e.preventDefault();
                              const r = e.currentTarget.getBoundingClientRect();
                              setDrag({ ...drag, overId: it.id, after: e.clientY > r.top + r.height / 2 });
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (drag && drag.overId) reorder(drag.id, { targetId: drag.overId, after: drag.after });
                              setDrag(null);
                            }}
                          >
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <span className="inline-flex items-center">
                                <button
                                  type="button"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", it.id);
                                    const row = e.currentTarget.closest("tr");
                                    if (row) e.dataTransfer.setDragImage(row, 20, 20);
                                    setDrag({ id: it.id, overId: null, after: false });
                                  }}
                                  onDragEnd={() => setDrag(null)}
                                  className={`drag-handle w-11 h-11 inline-flex items-center justify-center bg-transparent border-0 cursor-grab ${lifted ? "text-accent-light" : "text-muted-2"}`}
                                  aria-label={`Drag to reorder ${it.name}`}
                                  tabIndex={-1}
                                >
                                  <Icon name="grip" />
                                </button>
                                <button type="button" onClick={() => reorder(it.id, { delta: -1 })} disabled={i === 0} aria-label={`Move ${it.name} up`} className="w-11 h-11 inline-flex items-center justify-center bg-transparent border-0 text-fg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                                  <Icon name="up" />
                                </button>
                                <button type="button" onClick={() => reorder(it.id, { delta: 1 })} disabled={i === list.length - 1} aria-label={`Move ${it.name} down`} className="w-11 h-11 inline-flex items-center justify-center bg-transparent border-0 text-fg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                                  <Icon name="down" />
                                </button>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <>
                                  <label htmlFor={`cat-name-${it.id}`} className="sr-only">
                                    Name
                                  </label>
                                  <input
                                    id={`cat-name-${it.id}`}
                                    type="text"
                                    defaultValue={it.name}
                                    onBlur={(e) => saveName(it, e.target.value)}
                                    className={`${inputCls} border-accent-light`}
                                  />
                                </>
                              ) : (
                                <span className="flex flex-col gap-0.5">
                                  <span className="font-medium">{it.name}</span>
                                  <span className="text-[13px] text-muted-2">{it.desc}</span>
                                </span>
                              )}
                            </td>
                            {hasGroupCol ? <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{it.meta}</td> : null}
                            <td className="px-4 py-3 text-right tabular-nums">{it.price}</td>
                            <td className="px-4 py-1.5">
                              <Switch on={it.visible} onChange={(v) => toggleVisible(it, v)} label={`${it.visible ? "Hide" : "Show"} ${it.name}`} />
                            </td>
                            <td className="px-4 py-1.5 text-right whitespace-nowrap">
                              <button type="button" className={btnSecondary} aria-pressed={isEditing} onClick={() => setEditing(isEditing ? null : it.id)}>
                                {isEditing ? "Done" : "Edit"}
                                <span className="sr-only"> {it.name}</span>
                              </button>
                            </td>
                          </tr>
                          {dropAfter ? (
                            <tr aria-hidden="true" className="drop-indicator">
                              <td colSpan={cols} className="p-0 h-[3px] bg-accent-light" />
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                );
              })}
            </table>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-4">
        <Card aria-labelledby="cat-h" className="card-groups flex-[1_1_320px] px-6 py-5 flex flex-col gap-2">
          <CardTitle id="cat-h">{copy.groupsTitle}</CardTitle>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5 items-center">
            {groups.map((g) => (
              <li key={g} className="text-xs border border-border-2 rounded-full px-2.5 min-h-9 inline-flex items-center text-muted-2 whitespace-nowrap">
                {g}
              </li>
            ))}
            <li>
              {groupAdding ? (
                <form onSubmit={addGroup} className="inline-flex flex-wrap gap-1.5 items-center">
                  <label htmlFor="grp-new" className="sr-only">
                    New {copy.groupWord}
                  </label>
                  <input
                    id="grp-new"
                    autoFocus
                    type="text"
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      groupAction.setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setGroupAdding(false);
                    }}
                    placeholder="Name"
                    aria-invalid={groupAction.error ? true : undefined}
                    className={`${inputCls} w-36`}
                  />
                  <button type="submit" className={btnSecondary} disabled={groupAction.busy}>
                    {groupAction.busy ? <Spinner size={14} /> : null}
                    Save
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setGroupAdding(true);
                    setGroupName("");
                    groupAction.setError("");
                  }}
                >
                  + Add
                </button>
              )}
            </li>
          </ul>
          {groupAction.error ? <FieldError>{groupAction.error}</FieldError> : null}
        </Card>
        <Card aria-labelledby="tip-h" className="card-tip flex-[1_1_320px] px-6 py-5 flex flex-col gap-2">
          <CardTitle id="tip-h">How changes work</CardTitle>
          <p className="m-0 text-sm leading-relaxed text-muted-2">{copy.tip}</p>
        </Card>
      </div>

      <DevStateSwitch value={status} onChange={setStatus} options={["live", "empty", "loading", "error"]} />
      {IS_DEV ? (
        <label className="flex items-center gap-2 text-xs text-muted-2 min-h-11 cursor-pointer">
          <input type="checkbox" checked={dragPreview} onChange={(e) => setDragPreview(e.target.checked)} className="w-[18px] h-[18px] accent-[#4E85BF]" />
          Preview the dragging state · dev only
        </label>
      ) : null}

      {adding ? (
        <AddItemDialog
          copy={copy}
          groups={groups}
          onClose={() => setAdding(false)}
          onDone={(it) => {
            setItems((l) => {
              // New items go to the top of their group.
              const idx = l.findIndex((x) => x.group === it.group);
              const copyList = [...l];
              copyList.splice(idx < 0 ? copyList.length : idx, 0, it);
              return copyList;
            });
            setAdding(false);
            toast(`${it.name} added${it.visible ? " and live" : ""}`);
          }}
        />
      ) : null}
    </Page>
  );
}
