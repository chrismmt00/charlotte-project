"use client";

import { useState } from "react";
import { btnDanger, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import { FieldRow, FormError, Modal, Note, api, checkClass, checkLabelClass, inputClass, textareaClass, useSubmit } from "@/components/admin/billing/kit";
import { MILESTONE_IDS, MILESTONE_NAMES } from "@/lib/admin/sample-projects";

const BUILDERS = ["Chris", "Geoffrey", "Demetrius"];
const err = (e) => (e ? "!border-danger" : "");

// ---------- New task ----------
export function NewTaskDialog({ project, team, today, onClose, onCreated }) {
  const [f, setF] = useState({ title: "", who: "Geoffrey", milestone: "demo", due: today, est: "2", notes: "", needsClient: false });
  const [errors, setErrors] = useState({});
  const sub = useSubmit();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!f.title.trim()) next.title = "Give the task a title.";
    if (f.est !== "" && !(Number(f.est) >= 0)) next.est = "Estimate is a number of hours, like 2 or 0.5.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const out = await sub.run(() => api(`/api/admin/projects/${project.id}/tasks`, { method: "POST", body: { ...f, title: f.title.trim(), est: Number(f.est) || 0 } }));
    if (out) onCreated({ ...out.task, due: f.due, milestone: f.milestone, who: f.who, est: Number(f.est) || 0, desc: f.notes, blocked: f.needsClient });
  };
  return (
    <Modal
      id="nt"
      eyebrow={project.client}
      title="New task"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="nt-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Adding…" : "Add task"}
          </button>
        </>
      }
    >
      <form id="nt-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <FieldRow id="nt-title" label="Title" error={errors.title}>
          <input id="nt-title" data-autofocus type="text" value={f.title} onChange={set("title")} placeholder="Write the services page copy" aria-invalid={!!errors.title} aria-describedby={errors.title ? "nt-title-err" : undefined} className={`${inputClass} ${err(errors.title)}`} />
        </FieldRow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="nt-who" label="Assign">
            <select id="nt-who" value={f.who} onChange={set("who")} className={`${inputClass} cursor-pointer`}>
              {team.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-ms" label="Milestone">
            <select id="nt-ms" value={f.milestone} onChange={set("milestone")} className={`${inputClass} cursor-pointer`}>
              {MILESTONE_IDS.map((m) => (
                <option key={m} value={m}>
                  {MILESTONE_NAMES[m]}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-due" label="Due">
            <input id="nt-due" type="date" value={f.due} onChange={set("due")} className={inputClass} />
          </FieldRow>
          <FieldRow id="nt-est" label="Estimate (h)" error={errors.est}>
            <input id="nt-est" type="text" inputMode="decimal" value={f.est} onChange={set("est")} aria-invalid={!!errors.est} aria-describedby={errors.est ? "nt-est-err" : undefined} className={`${inputClass} ${err(errors.est)}`} />
          </FieldRow>
        </div>
        <FieldRow id="nt-desc" label="Notes">
          <textarea id="nt-desc" rows={2} value={f.notes} onChange={set("notes")} placeholder="Links, what done looks like" className={textareaClass} />
        </FieldRow>
        <label className={checkLabelClass}>
          <input type="checkbox" checked={f.needsClient} onChange={set("needsClient")} className={checkClass} />
          Needs something from the client (shows in their portal)
        </label>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Reassign ----------
export function AssignDialog({ project, task, team, loads, onClose, onAssigned }) {
  const [pick, setPick] = useState(task.who);
  const [notify, setNotify] = useState(true);
  const sub = useSubmit();
  const submit = async (e) => {
    e.preventDefault();
    const out = await sub.run(() => api(`/api/admin/projects/${project.id}/tasks`, { method: "PATCH", body: { taskId: task.id, patch: { who: pick, notify } } }));
    if (out) onAssigned(pick, notify);
  };
  return (
    <Modal
      id="as"
      tight
      w={420}
      title={`Reassign “${task.title}”`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="as-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Assigning…" : "Assign"}
          </button>
        </>
      }
    >
      <form id="as-form" onSubmit={submit} className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Assign to" className="flex flex-col gap-1.5">
          {team.map((p, i) => (
            <label key={p.name} className={`flex items-center gap-3 px-3 py-2.5 border rounded-xl cursor-pointer ${pick === p.name ? "border-fg bg-surface-2" : "border-border-2 bg-transparent"}`}>
              <input type="radio" name="assign" data-autofocus={i === 0 ? "" : undefined} checked={pick === p.name} onChange={() => setPick(p.name)} className="m-0 accent-[var(--accent)]" />
              <span aria-hidden="true" className="w-6 h-6 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[10px] font-medium flex-none">
                {p.initials}
              </span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted">{p.note || loads[p.name]}</span>
              </span>
            </label>
          ))}
        </div>
        <label className={checkLabelClass}>
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className={checkClass} />
          Notify them
        </label>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Log time (build hours) ----------
export function LogTimeDialog({ project, task, onClose, onLogged }) {
  const [hoursText, setHoursText] = useState("1.5");
  const [who, setWho] = useState(task.who === "Claude" ? "Geoffrey" : task.who);
  const [what, setWhat] = useState(task.title);
  const [error, setError] = useState("");
  const sub = useSubmit();
  const h = Number(hoursText);
  const submit = async (e) => {
    e.preventDefault();
    if (!(h > 0) || h > 24) {
      setError("Enter hours between 0 and 24, like 1.5.");
      return;
    }
    setError("");
    const out = await sub.run(() => api(`/api/admin/projects/${project.id}/tasks`, { method: "PATCH", body: { taskId: task.id, logTime: { hours: h, who, what } } }));
    if (out) onLogged({ id: out.entry.id, what, who, hours: h });
  };
  return (
    <Modal
      id="lt"
      w={440}
      title={`Log time on “${task.title}”`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="lt-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Logging…" : `Log ${hoursText || "0"} h`}
          </button>
        </>
      }
    >
      <form id="lt-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <FieldRow id="lt-hours" label="Hours" error={error}>
            <input id="lt-hours" data-autofocus type="text" inputMode="decimal" value={hoursText} onChange={(e) => setHoursText(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "lt-hours-err" : undefined} className={`${inputClass} ${err(error)}`} />
          </FieldRow>
          <FieldRow id="lt-who" label="Who">
            <select id="lt-who" value={who} onChange={(e) => setWho(e.target.value)} className={`${inputClass} cursor-pointer`}>
              {BUILDERS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </FieldRow>
        </div>
        <FieldRow id="lt-what" label="What">
          <input id="lt-what" type="text" value={what} onChange={(e) => setWhat(e.target.value)} className={inputClass} />
        </FieldRow>
        <p className="m-0 text-muted leading-[1.5]">Build hours are informational (fixed price); plan hours on tickets are what the client is billed against.</p>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Delete task ----------
export function DeleteTaskDialog({ project, task, onClose, onDeleted }) {
  const sub = useSubmit();
  const confirm = async () => {
    const out = await sub.run(() => api(`/api/admin/projects/${project.id}/tasks`, { method: "DELETE", body: { taskId: task.id } }));
    if (out) onDeleted();
  };
  return (
    <Modal
      id="dt"
      alert
      tight
      w={440}
      title="Delete this task?"
      describedBy="dt-p"
      onClose={onClose}
      footer={
        <>
          <button type="button" data-autofocus className={btnSecondary} onClick={onClose}>
            Keep it
          </button>
          <button type="button" className={btnDanger} onClick={confirm} disabled={sub.submitting}>
            {sub.submitting ? "Deleting…" : "Delete task"}
          </button>
        </>
      }
    >
      <p id="dt-p" className="m-0 text-muted-2 leading-[1.6]">
        “{task.title}” and its {task.time.length} time {task.time.length === 1 ? "entry" : "entries"} are removed from {project.client}. This cannot be undone.
      </p>
      <FormError message={sub.status === "failed" ? sub.error : ""} />
    </Modal>
  );
}

// ---------- Complete milestone ----------
export function MilestoneDialog({ project, milestone, openTasks, onClose, onCompleted }) {
  const isDemo = milestone.id === "demo";
  const [link, setLink] = useState(isDemo ? "[demo link]" : "");
  const [note, setNote] = useState(
    isDemo ? "Tap through the booking flow and the forms. Prices are yours; photos are the ones you sent. Approve when it feels right, or send changes." : "Your site is live. Thank you for working with us."
  );
  const sub = useSubmit();
  const monthly = project.monthlyRequired || project.monthlyChosen;
  const submit = async () => {
    const out = await sub.run(() => api(`/api/admin/projects/${project.id}/milestones/${milestone.id}/complete`, { method: "POST", body: { link, note } }));
    if (out) onCompleted(out);
  };
  return (
    <Modal
      id="ms"
      alert
      tight
      w={520}
      title={isDemo ? "Mark the demo accepted?" : "Mark the site launched?"}
      describedBy="ms-p"
      onClose={onClose}
      footer={
        <>
          <button type="button" data-autofocus className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={sub.submitting}>
            {sub.submitting ? "Sending…" : `Complete and send the ${milestone.percent}% invoice`}
          </button>
        </>
      }
    >
      <p id="ms-p" className="m-0 text-muted-2 leading-[1.6]">
        For {project.client}.{" "}
        {isDemo ? (
          <>
            This marks the working demo accepted and <strong className="font-medium text-fg">sends the {milestone.percent}% invoice ({money(milestone.amount)})</strong> to the client’s billing contact. Open tasks under Working demo move to Launch.
          </>
        ) : (
          <>
            This marks the site launched and <strong className="font-medium text-fg">sends the {milestone.percent}% invoice ({money(milestone.amount)})</strong>.{" "}
            {monthly ? `The monthly plan (${money(project.monthly)}/mo) starts today.` : "No monthly plan was chosen, so none starts; the client takes the code and data at final payment."}
          </>
        )}
      </p>
      {monthly && !isDemo ? <Note>{project.monthlyRequired ? "The monthly plan is required for this offer, so it starts now." : "They chose the monthly plan, so the first charge goes out today."}</Note> : null}
      {openTasks > 0 ? (
        <Note tone="warning">
          {openTasks} task{openTasks === 1 ? "" : "s"} under {MILESTONE_NAMES[milestone.id]} {openTasks === 1 ? "is" : "are"} not done yet. {isDemo ? "They will move to Launch." : "They stay open on the board."}
        </Note>
      ) : null}
      {isDemo ? (
        <FieldRow id="ms-link" label="Demo link the client sees">
          <input id="ms-link" type="text" value={link} onChange={(e) => setLink(e.target.value)} className={`${inputClass} font-mono !text-xs`} />
        </FieldRow>
      ) : null}
      <FieldRow id="ms-note" label="Note for the client">
        <textarea id="ms-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} />
      </FieldRow>
      <FormError message={sub.status === "failed" ? sub.error : ""} />
    </Modal>
  );
}
