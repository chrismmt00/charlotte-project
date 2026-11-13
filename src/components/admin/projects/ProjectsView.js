"use client";

import Link from "next/link";
import { useState } from "react";
import { Bar, Chip, Empty, PageHead, btnPrimary, btnSecondary, btnDanger, btnGhost, money } from "@/components/admin/ui";
import {
  DevStates,
  Drawer,
  FieldRow,
  FormError,
  Icon,
  Kpi,
  ListError,
  ListSkeleton,
  Segmented,
  TableBox,
  Toast,
  api,
  checkClass,
  clientLink,
  daysBetween,
  hours,
  inputClass,
  shortDate,
  tdClass,
  textareaClass,
  thClass,
  useListState,
  useSubmit,
  useToast,
} from "@/components/admin/billing/kit";
import { AssignDialog, DeleteTaskDialog, LogTimeDialog, MilestoneDialog, NewTaskDialog } from "@/components/admin/projects/ProjectDialogs";
import { MILESTONE_IDS, MILESTONE_NAMES, TASK_STATUSES } from "@/lib/admin/sample-projects";

const STAGE_TONE = { kickoff: "muted", demo: "accent", launch: "fg", live: "success" };
const STAGE_NAME = { kickoff: "Kickoff", demo: "Working demo", launch: "Launch", live: "Live" };
const HEALTH_TONE = { "on track": "success", "at risk": "warning", blocked: "danger" };
const COL_DOT = { "To do": "bg-muted-2", Doing: "bg-accent", Review: "bg-accent-light", Done: "bg-success" };

const taskHours = (t) => Math.round(t.time.reduce((a, e) => a + e.hours, 0) * 10) / 10;
const currentMilestone = (p) => p.milestones.find((m) => m.status === "current") || null;
const clientHref = (p) => clientLink(p.client);

// Blocked: an open blocked task under the current milestone. At risk: the current milestone's target is within
// 3 days and it still has open tasks. Otherwise on track.
function healthOf(p, today) {
  const cur = currentMilestone(p);
  if (!cur) return "on track";
  const open = p.tasks.filter((t) => t.milestone === cur.id && t.status !== "Done");
  if (open.some((t) => t.blocked)) return "blocked";
  if (cur.target && daysBetween(today, cur.target) <= 3 && open.length) return "at risk";
  return "on track";
}

function nextLabel(p) {
  const m = currentMilestone(p);
  if (!m) return "Launched";
  return `${MILESTONE_NAMES[m.id]} · ${m.percent}% · ${m.target ? `target ${shortDate(m.target)}` : m.note}`;
}

export default function ProjectsView({ initialProjects, team, today }) {
  const [projects, setProjects] = useState(initialProjects);
  const [view, setView] = useState("list");
  const [projId, setProjId] = useState(initialProjects[0]?.id ?? null);
  const [who, setWho] = useState("All");
  const [taskId, setTaskId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [message, toast] = useToast();
  const list = useListState("/api/admin/projects");
  const [dev, setDev] = useState("live");
  const state = dev === "live" ? list.state : dev;

  const project = projects.find((p) => p.id === projId) || projects[0] || null;
  const task = project?.tasks.find((t) => t.id === taskId) || null;
  const allTasks = projects.flatMap((p) => p.tasks);
  const openTasks = allTasks.filter((t) => t.status !== "Done");
  const dueSoon = openTasks.filter((t) => daysBetween(today, t.due) <= 2).length;
  const blockedCount = allTasks.filter((t) => t.blocked && t.status !== "Done").length;
  const dueThisWeek = projects.map(currentMilestone).filter((m) => m && m.target && daysBetween(today, m.target) <= 7);
  const dueAmount = dueThisWeek.reduce((a, m) => a + m.amount, 0);
  const hoursLogged = Math.round(allTasks.reduce((a, t) => a + taskHours(t), 0) * 10) / 10;

  const mutate = (projectId, fn) => setProjects((ps) => ps.map((p) => (p.id === projectId ? fn(p) : p)));
  const patchTask = (projectId, id, patch) => mutate(projectId, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const openBoard = (id) => {
    setProjId(id);
    setView("board");
  };
  const closeDialog = () => setDialog(null);

  const loads = Object.fromEntries(
    team.map((m) => {
      const mine = allTasks.filter((t) => t.who === m.name && t.status !== "Done");
      return [m.name, `${mine.length} open · ${hours(mine.reduce((a, t) => a + t.est, 0))} h estimated`];
    })
  );

  // Board: moving a card with drag and drop (the drawer's status field is the keyboard route).
  const moveTask = async (id, status) => {
    if (!project) return;
    const t = project.tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    const prev = t.status;
    patchTask(project.id, id, { status });
    try {
      await api(`/api/admin/projects/${project.id}/tasks`, { method: "PATCH", body: { taskId: id, patch: { status } } });
      toast(`Moved to ${status}`);
    } catch (e) {
      patchTask(project.id, id, { status: prev });
      toast(`Couldn’t move the task. ${e.message}`);
    }
  };

  const completeMilestone = (out) => {
    const m = dialog.milestone;
    const order = MILESTONE_IDS;
    const nextId = order[order.indexOf(m.id) + 1];
    mutate(project.id, (p) => ({
      ...p,
      stage: nextId || "live",
      milestones: p.milestones.map((x) => (x.id === m.id ? { ...x, status: "done", note: `Complete · invoice ${out.invoice.number} sent` } : x.id === nextId ? { ...x, status: "current" } : x)),
      tasks: p.tasks.map((t) => (t.milestone === m.id && t.status !== "Done" && nextId ? { ...t, milestone: nextId } : t)),
    }));
    closeDialog();
    toast(m.id === "demo" ? `Demo accepted · ${m.percent}% invoice (${money(m.amount)}) sent` : `Launched · ${m.percent}% invoice (${money(m.amount)}) sent${out.monthlyStarted ? " · monthly plan started" : ""}`);
  };

  return (
    <>
      <PageHead eyebrow={`Projects · ${projects.length} ${projects.length === 1 ? "build" : "builds"} in flight`} title="Projects">
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: "List" },
            { value: "board", label: "Board" },
          ]}
        />
        <button type="button" className={btnPrimary} disabled={!project} onClick={() => setDialog({ type: "new" })}>
          <Icon name="plus" size={14} />
          New task
        </button>
      </PageHead>

      <section aria-label="Totals" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi label="Milestones due this week" value={dueThisWeek.length} note={`${money(dueAmount)} invoiced when done`} />
        <Kpi label="Tasks open" value={openTasks.length} note={`${dueSoon} due in 2 days`} />
        <Kpi label="Build hours logged" value={hoursLogged} note="informational · fixed price" />
        <Kpi label="Blocked" value={blockedCount} note="waiting on client content" tone={blockedCount ? "warning" : undefined} />
      </section>

      <DevStates value={dev} onChange={setDev} />

      {state === "loading" ? <ListSkeleton label="Loading projects" rows={4} /> : null}
      {state === "error" ? (
        <ListError title="Couldn’t load projects" retrying={list.retrying} onRetry={async () => { setDev("live"); await list.retry(); }}>
          <code className="text-[12px]">GET /api/admin/projects</code> failed. Tasks you already changed are still on this page. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && projects.length === 0) ? (
        <Empty title="No projects yet" action={<Link href="/admin/proposals" className={btnSecondary}>Open proposals</Link>}>
          A project is created when a proposal is accepted. It starts with the kickoff invoice and the 50 / 30 / 20 milestones.
        </Empty>
      ) : null}

      {state === "live" && projects.length > 0 && view === "list" ? (
        <>
          <TableBox>
            <table className="w-full border-collapse min-w-[860px]">
              <caption className="sr-only">Projects</caption>
              <thead>
                <tr>
                  {["Project", "Stage", "Progress", "Next milestone", "Owner", "Health", "Actions"].map((h) => (
                    <th key={h} scope="col" className={thClass}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const done = p.tasks.filter((t) => t.status === "Done").length;
                  const h = healthOf(p, today);
                  return (
                    <tr key={p.id} className="hover:bg-surface-2">
                      <td className={tdClass}>
                        <button type="button" onClick={() => openBoard(p.id)} className="bg-transparent border-0 p-0 text-left text-fg font-medium cursor-pointer hover:text-accent-light">
                          {p.client}
                        </button>
                        <div className="text-[12px] text-muted-2">
                          {p.offer} · started {p.startedAt}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <Chip tone={STAGE_TONE[p.stage]}>{STAGE_NAME[p.stage]}</Chip>
                      </td>
                      <td className={`${tdClass} w-[150px]`}>
                        <div className="text-[12px] text-muted-2 mb-1.5">
                          {done}/{p.tasks.length} tasks
                        </div>
                        <Bar pct={p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0} label={`${p.client} task progress`} />
                      </td>
                      <td className={`${tdClass} text-muted-2 max-w-[260px]`}>{nextLabel(p)}</td>
                      <td className={tdClass}>{p.owner}</td>
                      <td className={tdClass}>
                        <Chip tone={HEALTH_TONE[h]}>{h}</Chip>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <Link href={clientHref(p)} className={btnGhost}>
                          Client
                        </Link>
                        <button type="button" className={btnGhost} onClick={() => openBoard(p.id)}>
                          Board
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableBox>
          <p className="text-[12px] text-muted-2 mt-4 mb-0 max-w-[760px]">
            A project is created when a proposal is accepted. Health: on track · at risk (a milestone within 3 days with open tasks) · blocked (waiting on the client).
          </p>
        </>
      ) : null}

      {state === "live" && project && view === "board" ? (
        <Board
          projects={projects}
          project={project}
          team={team}
          today={today}
          who={who}
          setWho={setWho}
          setProjId={setProjId}
          onOpenTask={setTaskId}
          onMove={moveTask}
          onNew={() => setDialog({ type: "new" })}
          onComplete={(milestone) => setDialog({ type: "milestone", milestone })}
        />
      ) : null}

      {task && project ? (
        <TaskDrawer
          key={task.id}
          project={project}
          task={task}
          team={team}
          onClose={() => setTaskId(null)}
          onSaved={(patch) => {
            patchTask(project.id, task.id, patch);
            setTaskId(null);
            toast("Task saved");
          }}
          onAssign={() => setDialog({ type: "assign" })}
          onLogTime={() => setDialog({ type: "time" })}
          onDelete={() => setDialog({ type: "delete" })}
          toast={toast}
        />
      ) : null}

      {dialog?.type === "new" && project ? (
        <NewTaskDialog
          project={project}
          team={team}
          today={today}
          onClose={closeDialog}
          onCreated={(t) => {
            mutate(project.id, (p) => ({ ...p, tasks: [...p.tasks, t] }));
            setView("board");
            closeDialog();
            toast(`Task added · ${t.title}`);
          }}
        />
      ) : null}
      {dialog?.type === "assign" && task && project ? (
        <AssignDialog
          project={project}
          task={task}
          team={team}
          loads={loads}
          onClose={closeDialog}
          onAssigned={(name, notify) => {
            patchTask(project.id, task.id, { who: name });
            closeDialog();
            toast(`Assigned to ${name}${notify ? " · notified" : ""}`);
          }}
        />
      ) : null}
      {dialog?.type === "time" && task && project ? (
        <LogTimeDialog
          project={project}
          task={task}
          onClose={closeDialog}
          onLogged={(entry) => {
            patchTask(project.id, task.id, { time: [...task.time, entry] });
            closeDialog();
            toast(`${entry.hours} h logged`);
          }}
        />
      ) : null}
      {dialog?.type === "delete" && task && project ? (
        <DeleteTaskDialog
          project={project}
          task={task}
          onClose={closeDialog}
          onDeleted={() => {
            mutate(project.id, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== task.id) }));
            setTaskId(null);
            closeDialog();
            toast("Task deleted");
          }}
        />
      ) : null}
      {dialog?.type === "milestone" && project ? (
        <MilestoneDialog
          project={project}
          milestone={dialog.milestone}
          openTasks={project.tasks.filter((t) => t.milestone === dialog.milestone.id && t.status !== "Done").length}
          onClose={closeDialog}
          onCompleted={completeMilestone}
        />
      ) : null}

      <Toast message={message} />
    </>
  );
}

function Board({ projects, project, team, today, who, setWho, setProjId, onOpenTask, onMove, onNew, onComplete }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const vis = project.tasks.filter((t) => who === "All" || t.who === who);
  const initials = Object.fromEntries(team.map((p) => [p.name, p.initials]));
  return (
    <>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-muted-2" id="pj-chips">
            Project
          </span>
          <div role="group" aria-labelledby="pj-chips" className="flex flex-wrap gap-2">
            {projects.map((p) => {
              const on = p.id === project.id;
              return (
                <button key={p.id} type="button" aria-pressed={on} onClick={() => setProjId(p.id)} className={`min-h-9 px-3 rounded-full text-[13px] border cursor-pointer ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}>
                  {p.client}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pj-who" className="text-[12px] text-muted-2">
            Filter by person
          </label>
          <select id="pj-who" value={who} onChange={(e) => setWho(e.target.value)} className={`${inputClass} min-w-[160px]`}>
            <option value="All">Everyone</option>
            {team.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <section aria-label="Milestones" className="bg-surface border border-border rounded-admin p-4 sm:p-5 mb-5">
        <ol className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          {project.milestones.map((m) => {
            const canComplete = m.status === "current" && m.id !== "kickoff";
            return (
              <li key={m.id} aria-current={m.status === "current" ? "step" : undefined} className="flex flex-col gap-2 min-w-0">
                <div className={`h-1 rounded-full ${m.status === "done" ? "bg-success" : m.status === "current" ? "bg-fg" : "bg-border-2"}`} aria-hidden="true" />
                <div className={`font-medium ${m.status === "todo" ? "text-muted-2" : "text-fg"}`}>
                  {m.label}
                  <span className="sr-only"> ({m.status === "done" ? "done" : m.status === "current" ? "current" : "not started"})</span>
                </div>
                <div className="text-[12px] text-muted-2">
                  {money(m.amount)} · {m.note}
                </div>
                {canComplete ? (
                  <div>
                    <button type="button" className={btnSecondary} onClick={() => onComplete(m)}>
                      {m.id === "demo" ? "Mark demo accepted" : "Mark launched"}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {TASK_STATUSES.map((col) => {
          const cards = vis.filter((t) => t.status === col);
          const id = `col-${col.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <section
              key={col}
              aria-labelledby={id}
              onDragOver={(e) => {
                if (dragId) {
                  e.preventDefault();
                  setOverCol(col);
                }
              }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) onMove(dragId, col);
                setDragId(null);
                setOverCol(null);
              }}
              className={`bg-surface border rounded-admin p-3 flex flex-col gap-2.5 min-w-0 ${overCol === col ? "border-accent" : "border-border"}`}
            >
              <div className="flex items-center gap-2 px-1">
                <span aria-hidden="true" className={`w-2 h-2 rounded-full ${COL_DOT[col]}`} />
                <h2 id={id} className="text-[13px] font-medium m-0 flex-1">
                  {col}
                </h2>
                <span className="text-[12px] text-muted-2">{cards.length}</span>
              </div>
              {cards.map((t) => {
                const late = t.status !== "Done" && daysBetween(today, t.due) <= 1;
                return (
                  <button
                    key={t.id}
                    type="button"
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onOpenTask(t.id)}
                    className="text-left bg-surface-2 border border-border rounded-[12px] p-3 flex flex-col gap-2 cursor-pointer hover:border-border-2 text-fg font-[inherit]"
                  >
                    <span className="text-[13px] leading-snug">{t.title}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Chip tone={t.milestone === "demo" ? "accent" : "muted"}>{MILESTONE_NAMES[t.milestone]}</Chip>
                      {t.blocked ? <Chip tone="warning">Blocked</Chip> : null}
                    </span>
                    <span className="flex items-center gap-2 text-[12px] text-muted-2">
                      <span aria-hidden="true" className="w-6 h-6 rounded-full bg-surface border border-border-2 inline-flex items-center justify-center text-[10px] flex-none">
                        {initials[t.who] || "—"}
                      </span>
                      <span className="sr-only">Assigned to {t.who}. </span>
                      <span className={late ? "text-warning" : ""}>{shortDate(t.due)}</span>
                      <span>·</span>
                      <span>
                        {hours(taskHours(t))}/{hours(t.est)}h
                      </span>
                    </span>
                  </button>
                );
              })}
              {cards.length === 0 ? <div className="text-[12px] text-muted-2 px-1 py-2">Nothing here</div> : null}
              <button type="button" onClick={onNew} className="bg-transparent border border-dashed border-border-2 rounded-[10px] text-muted-2 hover:text-fg text-[13px] min-h-9 cursor-pointer">
                + Add task
              </button>
            </section>
          );
        })}
      </div>
      <p className="text-[12px] text-muted-2 mt-4 mb-0 max-w-[760px]">
        Cards open the task drawer, where status can change from the keyboard. Drag a card between columns with a mouse. Hours logged on tasks roll up to the project and the client page.
      </p>
    </>
  );
}

function TaskDrawer({ project, task, team, onClose, onSaved, onAssign, onLogTime, onDelete, toast }) {
  const [d, setD] = useState({ status: task.status, who: task.who, due: task.due, milestone: task.milestone, desc: task.desc, blocked: task.blocked, checklist: task.checklist });
  const [item, setItem] = useState("");
  const sub = useSubmit();
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const save = async () => {
    const out = await sub.run(() => api(`/api/admin/projects/${project.id}/tasks`, { method: "PATCH", body: { taskId: task.id, patch: d } }));
    if (out) onSaved(d);
  };
  const addItem = () => {
    const text = item.trim();
    if (!text) {
      toast("Type the checklist item first");
      return;
    }
    setD((x) => ({ ...x, checklist: [...x.checklist, { id: `cl_${Date.now().toString(36)}`, text, done: false }] }));
    setItem("");
  };
  const total = taskHours(task);
  return (
    <Drawer
      id="td"
      eyebrow={`Task · ${project.client}`}
      title={task.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnPrimary} onClick={save} disabled={sub.submitting}>
            {sub.submitting ? "Saving…" : "Save"}
          </button>
          <button type="button" className={btnSecondary} onClick={onAssign}>
            Reassign…
          </button>
          <button type="button" className={`${btnDanger} ml-auto`} onClick={onDelete}>
            Delete
          </button>
        </>
      }
    >
      <FormError message={sub.status === "failed" ? sub.error : ""} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <FieldRow id="td-status" label="Status">
          <select id="td-status" value={d.status} onChange={set("status")} className={inputClass}>
            {TASK_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="td-who" label="Assigned">
          <select id="td-who" value={d.who} onChange={set("who")} className={inputClass}>
            {team.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="td-due" label="Due">
          <input id="td-due" type="date" value={d.due} onChange={set("due")} className={inputClass} />
        </FieldRow>
        <FieldRow id="td-ms" label="Milestone">
          <select id="td-ms" value={d.milestone} onChange={set("milestone")} className={inputClass}>
            {MILESTONE_IDS.map((m) => (
              <option key={m} value={m}>
                {MILESTONE_NAMES[m]}
              </option>
            ))}
          </select>
        </FieldRow>
      </div>
      <FieldRow id="td-desc" label="Description">
        <textarea id="td-desc" rows={3} value={d.desc} onChange={set("desc")} className={textareaClass} />
      </FieldRow>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={d.blocked} onChange={set("blocked")} className={`${checkClass} mt-0.5`} />
        <span>Blocked · waiting on the client (shows in the portal as “we need…”)</span>
      </label>

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-1">
        <legend className="text-[12px] text-muted-2 mb-1.5 p-0">Checklist</legend>
        {d.checklist.map((c) => (
          <label key={c.id} className="flex items-center gap-2.5 cursor-pointer min-h-9">
            <input type="checkbox" checked={c.done} onChange={() => setD((x) => ({ ...x, checklist: x.checklist.map((y) => (y.id === c.id ? { ...y, done: !y.done } : y)) }))} className={checkClass} />
            <span className={c.done ? "line-through text-muted" : ""}>{c.text}</span>
          </label>
        ))}
        <div className="flex gap-2 mt-1.5">
          <label htmlFor="td-item" className="sr-only">
            New checklist item
          </label>
          <input
            id="td-item"
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder="Add an item"
            className={inputClass}
          />
          <button type="button" className={btnSecondary} onClick={addItem}>
            + Add
          </button>
        </div>
      </fieldset>

      <section aria-labelledby="td-time">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 id="td-time" className="text-[13px] font-medium m-0">
            Time · {hours(total)} h of {hours(task.est)} h estimated
          </h3>
          <button type="button" className={btnSecondary} onClick={onLogTime}>
            <Icon name="clock" size={14} />
            Log time
          </button>
        </div>
        <ul className="list-none p-0 m-0">
          {task.time.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 border-t border-border py-2 text-[13px]">
              <span className="min-w-0 truncate">
                {e.what} <span className="text-muted-2">· {e.who}</span>
              </span>
              <span className="text-muted-2 flex-none">{hours(e.hours)} h</span>
            </li>
          ))}
          {task.time.length === 0 ? <li className="text-[12px] text-muted-2 border-t border-border pt-2">No time logged yet.</li> : null}
        </ul>
      </section>
    </Drawer>
  );
}
