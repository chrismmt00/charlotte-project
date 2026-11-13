"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead, btnPrimary, money } from "@/components/admin/ui";
import {
  DevStates,
  Drawer,
  EmptyCard,
  FieldRow,
  FormError,
  Kpi,
  KpiGrid,
  ListError,
  ListSkeleton,
  Segmented,
  TableBox,
  Toast,
  api,
  btnSm,
  btnSmDanger,
  btnXs,
  checkClass,
  checkLabelClass,
  clientLink,
  daysBetween,
  hours,
  inputClass,
  linkInline,
  shortDate,
  tableClass,
  tdClass,
  textareaClass,
  theadRowClass,
  thSmClass,
  trClass,
  useListState,
  useSubmit,
  useToast,
} from "@/components/admin/billing/kit";
import { AssignDialog, DeleteTaskDialog, LogTimeDialog, MilestoneDialog, NewTaskDialog } from "@/components/admin/projects/ProjectDialogs";
import { MILESTONE_IDS, MILESTONE_NAMES, TASK_STATUSES } from "@/lib/admin/sample-projects";

const STAGE_COLOR = { kickoff: "text-muted-2", demo: "text-accent-light", launch: "text-accent", live: "text-success" };
const STAGE_NAME = { kickoff: "Kickoff", demo: "Working demo", launch: "Launch", live: "Live" };
const HEALTH_COLOR = { "on track": "text-success", "at risk": "text-warning", blocked: "text-danger" };
const HEALTH_DOT = { "on track": "bg-success", "at risk": "bg-warning", blocked: "bg-danger" };
const COL_DOT = { "To do": "bg-muted-2", Doing: "bg-accent", Review: "bg-accent-light", Done: "bg-success" };

const taskHours = (t) => Math.round(t.time.reduce((a, e) => a + e.hours, 0) * 10) / 10;
const currentMilestone = (p) => p.milestones.find((m) => m.status === "current") || null;

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

const footnote = "m-0 text-[13px] text-muted";

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
    const nextId = MILESTONE_IDS[MILESTONE_IDS.indexOf(m.id) + 1];
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
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted flex items-center gap-2">
        <Link href="/admin/clients" className="text-muted-2 hover:text-fg">
          Clients
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          Projects
        </span>
      </nav>

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
          New task
        </button>
      </PageHead>

      <KpiGrid label="Totals">
        <Kpi compact label="Milestones due this week" value={dueThisWeek.length} note={`${money(dueAmount)} invoiced when done`} />
        <Kpi compact label="Tasks open" value={openTasks.length} note={`${dueSoon} due in 2 days`} />
        <Kpi compact label="Build hours logged" value={hoursLogged} note="informational · fixed price" />
        <Kpi compact label="Blocked" value={blockedCount} note="waiting on client content" tone={blockedCount ? "warning" : undefined} />
      </KpiGrid>

      {state === "loading" ? <ListSkeleton label="Loading projects" rows={4} cols="1.6fr 1fr 1.4fr 2fr 1fr 1fr .9fr" /> : null}
      {state === "error" ? (
        <ListError
          title="Couldn’t load projects"
          retrying={list.retrying}
          onRetry={async () => {
            setDev("live");
            await list.retry();
          }}
        >
          <code className="font-mono text-xs">GET /api/admin/projects</code> failed. Tasks you already changed are still on this page. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && projects.length === 0) ? (
        <EmptyCard
          title="No projects yet"
          actions={
            <Link href="/admin/proposals" className={btnPrimary}>
              Open proposals
            </Link>
          }
        >
          A project is created when a proposal is accepted. It starts with the kickoff invoice and the 50 / 30 / 20 milestones.
        </EmptyCard>
      ) : null}

      {state === "live" && projects.length > 0 && view === "list" ? (
        <>
          <TableBox>
            <table className={`${tableClass} min-w-[980px]`}>
              <caption className="sr-only">Projects</caption>
              <thead>
                <tr className={theadRowClass}>
                  {["Project", "Stage", "Progress", "Next milestone", "Owner", "Health", "Actions"].map((h) => (
                    <th key={h} scope="col" className={`${thSmClass} ${h === "Progress" ? "min-w-[180px]" : ""} ${h === "Actions" ? "text-right" : ""}`}>
                      {h === "Actions" ? <span className="sr-only">Actions</span> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const done = p.tasks.filter((t) => t.status === "Done").length;
                  const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
                  const h = healthOf(p, today);
                  return (
                    <tr key={p.id} className={trClass}>
                      <td className={tdClass}>
                        <span className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => openBoard(p.id)} className="bg-transparent border-0 p-0 font-[inherit] font-medium text-fg cursor-pointer text-left">
                            {p.client}
                          </button>
                          <span className="text-muted">
                            {p.offer} · started {p.startedAt}
                          </span>
                        </span>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <span className={`text-xs border border-border-2 rounded-full px-2.5 py-1 ${STAGE_COLOR[p.stage]}`}>{STAGE_NAME[p.stage]}</span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2.5">
                          <div role="progressbar" aria-label={`${p.client} task progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="flex-1 h-1 rounded-sm bg-border">
                            <div className="h-full rounded-sm bg-fg" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="tabular-nums text-muted-2 whitespace-nowrap">
                            {done}/{p.tasks.length} tasks
                          </span>
                        </div>
                      </td>
                      <td className={`${tdClass} text-muted-2`}>{nextLabel(p)}</td>
                      <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{p.owner}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <span className={`inline-flex items-center gap-1.5 ${HEALTH_COLOR[h]}`}>
                          <span aria-hidden="true" className={`w-2 h-2 rounded-full ${HEALTH_DOT[h]}`} />
                          {h}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right whitespace-nowrap`}>
                        <span className="inline-flex gap-1.5">
                          <Link href={clientLink(p.client)} className={btnSm}>
                            Client
                          </Link>
                          <button type="button" className={btnSm} onClick={() => openBoard(p.id)}>
                            Board
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableBox>
          <p className={footnote}>A project is created when a proposal is accepted. Health: on track · at risk (a milestone within 3 days with open tasks) · blocked (waiting on the client).</p>
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

      <p className={footnote}>
        Reads <code className="font-mono text-xs text-muted-2">GET /api/admin/projects</code>; completing a milestone sends the next milestone’s invoice (demo accepted → 30%, launched → 20% and the monthly plan starts if chosen). Amounts are whole dollars here; the API stores cents.
      </p>

      <DevStates value={dev} onChange={setDev} />

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
      <div className="flex flex-wrap items-center gap-2">
        <span id="pj-chips" className="text-[13px] text-muted-2">
          Project
        </span>
        <div role="group" aria-labelledby="pj-chips" className="flex flex-wrap gap-2">
          {projects.map((p) => {
            const on = p.id === project.id;
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => setProjId(p.id)} className={`min-h-9 px-3.5 rounded-full text-[13px] border cursor-pointer ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}>
                {p.client}
              </button>
            );
          })}
        </div>
        <span className="flex-1" />
        <label htmlFor="pj-who" className="sr-only">
          Filter by person
        </label>
        <select id="pj-who" value={who} onChange={(e) => setWho(e.target.value)} className="min-h-9 rounded-full border border-border-2 bg-surface text-fg px-3 text-[13px] cursor-pointer">
          <option value="All">Everyone</option>
          {team.map((p) => (
            <option key={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      <section aria-label="Milestones" className="bg-surface border border-border rounded-admin px-5 py-[18px] box-border">
        <ol className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-3 gap-3">
          {project.milestones.map((m) => {
            const canComplete = m.status === "current" && m.id !== "kickoff";
            return (
              <li key={m.id} aria-current={m.status === "current" ? "step" : undefined} className="flex flex-col gap-2 text-[13px] min-w-0">
                <span aria-hidden="true" className={`h-[3px] rounded-sm ${m.status === "done" ? "bg-success" : m.status === "current" ? "bg-fg" : "bg-border-2"}`} />
                <span className="flex items-center justify-between gap-2">
                  <span className={`font-medium ${m.status === "todo" ? "text-muted" : "text-fg"}`}>
                    {m.label}
                    <span className="sr-only"> ({m.status === "done" ? "done" : m.status === "current" ? "current" : "not started"})</span>
                  </span>
                  {canComplete ? (
                    <button type="button" className={btnXs} onClick={() => onComplete(m)}>
                      {m.id === "demo" ? "Mark demo accepted" : "Mark launched"}
                    </button>
                  ) : null}
                </span>
                <span className="text-muted">
                  {money(m.amount)} · {m.note}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
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
              className={`bg-surface-2 border rounded-admin p-3 flex flex-col gap-2.5 min-h-80 min-w-0 box-border ${overCol === col ? "border-accent" : "border-border"}`}
            >
              <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5 pb-1">
                <h2 id={id} className="text-[13px] font-medium m-0 flex items-center gap-2">
                  <span aria-hidden="true" className={`w-2 h-2 rounded-full ${COL_DOT[col]}`} />
                  {col}
                </h2>
                <span className="text-xs text-muted tabular-nums">{cards.length}</span>
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
                    className="text-left bg-surface border border-border rounded-[14px] p-3 flex flex-col gap-2 text-fg cursor-pointer w-full font-[inherit] box-border hover:border-border-2"
                  >
                    <span className="text-[13px] font-medium leading-[1.35]">{t.title}</span>
                    <span className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-muted-2 border border-border-2 rounded-full px-2 py-0.5">{MILESTONE_NAMES[t.milestone]}</span>
                      {t.blocked ? <span className="text-[11px] text-warning border border-border-2 rounded-full px-2 py-0.5">Blocked</span> : null}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="w-5 h-5 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[9px] font-medium text-fg">
                          {initials[t.who] || "—"}
                        </span>
                        {t.who}
                      </span>
                      <span className={late ? "text-warning" : ""}>
                        {shortDate(t.due)} · {hours(taskHours(t))}/{hours(t.est)}h
                      </span>
                    </span>
                  </button>
                );
              })}
              {cards.length === 0 ? <span className="text-[13px] text-muted border border-dashed border-border-2 rounded-[14px] px-3.5 py-[18px] text-center">Nothing here</span> : null}
              <button type="button" onClick={onNew} className="bg-transparent border-0 p-1.5 font-[inherit] text-[13px] text-muted-2 cursor-pointer text-left hover:text-fg">
                + Add task
              </button>
            </section>
          );
        })}
      </div>
      <p className={footnote}>Cards open the task drawer, where status can change from the keyboard. Drag a card between columns with a mouse. Hours logged on tasks roll up to the project and the client page.</p>
    </>
  );
}

function TaskDrawer({ project, task, team, onClose, onSaved, onAssign, onLogTime, onDelete, toast }) {
  const [d, setD] = useState({ status: task.status, who: task.who, due: task.due, milestone: task.milestone, desc: task.desc, blocked: task.blocked, checklist: task.checklist });
  const [item, setItem] = useState("");
  const [adding, setAdding] = useState(false);
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
  return (
    <Drawer
      id="td"
      eyebrow={`Task · ${project.client}`}
      title={task.title}
      titleSize="text-xl"
      closeLabel="Close task"
      bodyClass="pt-[18px] gap-4"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={`${btnPrimary} mt-2`} onClick={save} disabled={sub.submitting}>
            {sub.submitting ? "Saving…" : "Save"}
          </button>
          <button type="button" className={`${btnSm} mt-2`} onClick={onAssign}>
            Reassign…
          </button>
          <button type="button" className={`${btnSmDanger} mt-2 ml-auto`} onClick={onDelete}>
            Delete
          </button>
        </>
      }
    >
      <FormError message={sub.status === "failed" ? sub.error : ""} />
      <div className="grid grid-cols-2 gap-3">
        <FieldRow id="td-status" label="Status">
          <select id="td-status" value={d.status} onChange={set("status")} className={`${inputClass} cursor-pointer`}>
            {TASK_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="td-who" label="Assigned">
          <select id="td-who" value={d.who} onChange={set("who")} className={`${inputClass} cursor-pointer`}>
            {team.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="td-due" label="Due">
          <input id="td-due" type="date" value={d.due} onChange={set("due")} className={inputClass} />
        </FieldRow>
        <FieldRow id="td-ms" label="Milestone">
          <select id="td-ms" value={d.milestone} onChange={set("milestone")} className={`${inputClass} cursor-pointer`}>
            {MILESTONE_IDS.map((m) => (
              <option key={m} value={m}>
                {MILESTONE_NAMES[m]}
              </option>
            ))}
          </select>
        </FieldRow>
      </div>
      <FieldRow id="td-desc" label="Description">
        <textarea id="td-desc" rows={3} value={d.desc} onChange={set("desc")} className={`${textareaClass} leading-normal`} />
      </FieldRow>
      <label className={checkLabelClass}>
        <input type="checkbox" checked={d.blocked} onChange={set("blocked")} className={checkClass} />
        Blocked · waiting on the client (shows in the portal as “we need…”)
      </label>

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-2 min-w-0">
        <legend className="text-xs text-muted-2 p-0 mb-2">Checklist</legend>
        {d.checklist.map((c) => (
          <label key={c.id} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={c.done} onChange={() => setD((x) => ({ ...x, checklist: x.checklist.map((y) => (y.id === c.id ? { ...y, done: !y.done } : y)) }))} className={checkClass} />
            <span className={c.done ? "line-through text-muted" : "text-fg"}>{c.text}</span>
          </label>
        ))}
        {adding ? (
          <div className="flex gap-2">
            <label htmlFor="td-item" className="sr-only">
              New checklist item
            </label>
            <input
              id="td-item"
              data-autofocus
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
            <button type="button" className={btnSm} onClick={addItem}>
              Add
            </button>
          </div>
        ) : (
          <button type="button" className={`${linkInline} text-left self-start`} onClick={() => setAdding(true)}>
            + Add item
          </button>
        )}
      </fieldset>

      <section aria-labelledby="td-time" className="flex flex-col gap-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <h3 id="td-time" className="text-xs font-normal text-muted-2 m-0">
            Time · {hours(taskHours(task))} h of {hours(task.est)} h estimated
          </h3>
          <button type="button" className={btnXs} onClick={onLogTime}>
            Log time
          </button>
        </div>
        {task.time.map((e) => (
          <span key={e.id} className="flex justify-between gap-2.5 text-muted-2">
            <span>
              {e.what} · {e.who}
            </span>
            <span className="tabular-nums">{hours(e.hours)} h</span>
          </span>
        ))}
        {task.time.length === 0 ? <span className="text-muted">No time logged yet.</span> : null}
      </section>
    </Drawer>
  );
}
