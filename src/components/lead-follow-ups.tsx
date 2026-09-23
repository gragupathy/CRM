"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { LeadActivity, User } from "@prisma/client";
import {
  FOLLOW_UP_REMINDERS,
  FOLLOW_UP_SUBJECTS,
  LEAD_ACTIVITY_TYPES,
  MEETING_VENUES,
} from "@/lib/constants";
import { formatDateTime, labelFor, titleCase } from "@/lib/utils";
import {
  reminderHasEnoughLeadTime,
  reminderLeadTimeAlert,
} from "@/lib/follow-up";
import { SubmitButton } from "@/components/forms";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  createLeadActivity,
  deleteLeadActivity,
  updateLeadActivity,
} from "@/app/(app)/leads/child-actions";
import { ChildParentFields, childNoun, childParentId } from "@/components/child-parent-field";

type Owner = Pick<User, "name">;
type FollowUpType = (typeof LEAD_ACTIVITY_TYPES)[number]["value"];
type FollowUp = LeadActivity & { owner: Owner };

const line =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm text-ink-900 outline-none focus:border-indigo-500";

function Line({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-x-4 border-b border-slate-100 py-2">
      <div className="text-sm text-slate-600">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateInput(value: Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeInput(value: Date) {
  const d = new Date(value);
  const minutes = [0, 15, 30, 45].reduce((best, x) =>
    Math.abs(x - d.getMinutes()) < Math.abs(best - d.getMinutes()) ? x : best,
  0);
  return `${pad(d.getHours())}:${pad(minutes)}`;
}

function snapNowTime() {
  const d = new Date();
  const minutes = [0, 15, 30, 45].reduce((best, x) =>
    Math.abs(x - d.getMinutes()) < Math.abs(best - d.getMinutes()) ? x : best,
  0);
  return `${pad(d.getHours())}:${pad(minutes)}`;
}

function shiftWhen(date: string, time: string, hours: number) {
  const d = new Date(`${date}T${time}`);
  d.setHours(d.getHours() + hours);
  return { date: dateInput(d), time: timeInput(d) };
}

function parseTime(hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":").map((n) => Number(n) || 0);
  const ampm: "AM" | "PM" = hRaw >= 12 ? "PM" : "AM";
  const hour12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  const minute = [0, 15, 30, 45].includes(mRaw) ? mRaw : 0;
  return { hour12, minute, ampm };
}

function formatTime(hour12: number, minute: number, ampm: "AM" | "PM") {
  let hour = hour12 % 12;
  if (ampm === "PM") hour += 12;
  return `${pad(hour)}:${pad(minute)}`;
}

function formatTimeShort(value: Date) {
  const d = new Date(value);
  const { hour12, minute, ampm } = parseTime(timeInput(d));
  return `${pad(hour12)}:${pad(minute)} ${ampm}`;
}

function scheduledLabel(item: FollowUp) {
  const from = formatDateTime(item.occurredAt);
  if (item.type !== "MEETING" || !item.endedAt) return from;
  const sameDay = dateInput(item.occurredAt) === dateInput(item.endedAt);
  return sameDay ? `${from} – ${formatTimeShort(item.endedAt)}` : `${from} – ${formatDateTime(item.endedAt)}`;
}

function SubjectField({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <input name="subject" required value={value} onChange={(e) => onChange(e.target.value)} className={`${line} pr-7`} />
      <button
        type="button"
        aria-label="Show subject suggestions"
        className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-ink-900"
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown size={16} />
      </button>
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50 ${s === value ? "bg-indigo-50 text-indigo-800" : "text-slate-800"}`}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TimeField({
  value,
  onChange,
  name = "time",
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { hour12, minute, ampm } = parseTime(value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commit(next: { hour12?: number; minute?: number; ampm?: "AM" | "PM" }) {
    onChange(formatTime(next.hour12 ?? hour12, next.minute ?? minute, next.ampm ?? ampm));
  }

  const display = `${pad(hour12)}:${pad(minute)} ${ampm}`;

  return (
    <div className="relative min-w-[8.5rem]" ref={wrapRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={`${line} flex w-full items-center justify-between gap-2 text-left`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{display}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hour</p>
            <div className="flex overflow-hidden rounded-md border border-slate-200 text-xs font-medium">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`px-2 py-0.5 ${ampm === p ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  onClick={() => commit({ ampm: p })}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 grid grid-cols-6 gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <button
                key={h}
                type="button"
                className={`rounded-md py-1.5 text-sm ${hour12 === h ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-800 hover:bg-indigo-50"}`}
                onClick={() => commit({ hour12: h })}
              >
                {h}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</p>
          <div className="grid grid-cols-4 gap-1">
            {[0, 15, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                className={`rounded-md py-1.5 text-sm ${minute === m ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-800 hover:bg-indigo-50"}`}
                onClick={() => commit({ minute: m })}
              >
                {pad(m)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type SortKey = "type" | "subject" | "lead" | "occurredAt" | "owner" | "createdAt";

export function LeadFollowUps({
  leadId,
  contactId,
  leadName,
  nameLabel = "Lead name",
  items,
}: {
  leadId?: string;
  contactId?: string;
  leadName: string;
  nameLabel?: string;
  items: FollowUp[];
}) {
  const parentId = childParentId(leadId, contactId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FollowUpType | null>(null);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [deleting, setDeleting] = useState<FollowUp | null>(null);
  const [subject, setSubject] = useState("");
  const [venue, setVenue] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayInput);
  const [scheduledTime, setScheduledTime] = useState(snapNowTime);
  const [endDate, setEndDate] = useState(todayInput);
  const [endTime, setEndTime] = useState(() => shiftWhen(todayInput(), snapNowTime(), 1).time);
  const [reminderOffset, setReminderOffset] = useState("30_MIN");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const formType = editing ? (editing.type as FollowUpType) : type;
  const suggestions = formType ? (FOLLOW_UP_SUBJECTS[formType] ?? []) : [];
  const typeLabel = formType ? labelFor(LEAD_ACTIVITY_TYPES, formType) : "";

  const rows = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      const av =
        sort === "type"
          ? a.type
          : sort === "subject"
            ? a.subject
            : sort === "lead"
              ? leadName
              : sort === "owner"
                ? a.owner.name
                : sort === "occurredAt"
                    ? new Date(a.occurredAt).getTime()
                    : new Date(a.createdAt).getTime();
      const bv =
        sort === "type"
          ? b.type
          : sort === "subject"
            ? b.subject
            : sort === "lead"
              ? leadName
              : sort === "owner"
                ? b.owner.name
                : sort === "occurredAt"
                    ? new Date(b.occurredAt).getTime()
                    : new Date(b.createdAt).getTime();
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, sort, dir, leadName]);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "createdAt" || key === "occurredAt" ? "desc" : "asc");
    }
  }

  function startCreate(next: FollowUpType) {
    setEditing(null);
    setType(next);
    const fromDate = todayInput();
    const fromTime = snapNowTime();
    const to = shiftWhen(fromDate, fromTime, 1);
    setScheduledDate(fromDate);
    setScheduledTime(next === "EMAIL" ? "09:00" : fromTime);
    setEndDate(to.date);
    setEndTime(to.time);
    setVenue("");
    setSubject(next === "MEETING" ? "New Meeting" : (FOLLOW_UP_SUBJECTS[next]?.[0] ?? ""));
    setReminderOffset("30_MIN");
    setOpen(false);
  }

  function startEdit(item: FollowUp) {
    setType(null);
    setEditing(item);
    setSubject(item.subject);
    setScheduledDate(dateInput(item.occurredAt));
    setScheduledTime(timeInput(item.occurredAt));
    const end = item.endedAt ? new Date(item.endedAt) : new Date(new Date(item.occurredAt).getTime() + 60 * 60 * 1000);
    setEndDate(dateInput(end));
    setEndTime(timeInput(end));
    setVenue(item.venue || "");
    setReminderOffset(item.reminderOffset || "NONE");
  }

  function closeForm() {
    setType(null);
    setEditing(null);
    setSubject("");
    setReminderOffset("30_MIN");
  }

  function setFromDate(next: string) {
    setScheduledDate(next);
    if (new Date(`${next}T${scheduledTime}`).getTime() >= new Date(`${endDate}T${endTime}`).getTime()) {
      const to = shiftWhen(next, scheduledTime, 1);
      setEndDate(to.date);
      setEndTime(to.time);
    }
  }

  function setFromTime(next: string) {
    setScheduledTime(next);
    if (new Date(`${scheduledDate}T${next}`).getTime() >= new Date(`${endDate}T${endTime}`).getTime()) {
      const to = shiftWhen(scheduledDate, next, 1);
      setEndDate(to.date);
      setEndTime(to.time);
    }
  }

  function scheduledWhen() {
    return new Date(`${scheduledDate}T${scheduledTime}`);
  }

  function ensureReminderLeadTime(offset: string) {
    if (reminderHasEnoughLeadTime(scheduledWhen(), offset)) return true;
    window.alert(reminderLeadTimeAlert(offset));
    return false;
  }

  function SortBtn({ column, label }: { column: SortKey; label: string }) {
    const active = sort === column;
    return (
      <button type="button" className="inline-flex items-center gap-1 font-bold text-slate-800" onClick={() => toggleSort(column)}>
        {label}
        <span className="inline-flex flex-col leading-none">
          <ChevronUp size={12} className={`-mb-0.5 ${active && dir === "asc" ? "text-brand-600" : "text-slate-300"}`} />
          <ChevronDown size={12} className={`-mt-0.5 ${active && dir === "desc" ? "text-brand-600" : "text-slate-300"}`} />
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 bg-slate-100 px-3 py-1.5 md:px-4">
        <h2 className="text-base font-semibold text-slate-800">Follow Ups</h2>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-cut inline-flex items-center gap-1 border border-indigo-300 bg-white px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Add New
            <ChevronDown size={14} />
          </button>
          {open ? (
            <div className="absolute right-0 z-20 mt-1 min-w-[8.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {LEAD_ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm text-slate-800 hover:bg-indigo-50"
                  onClick={() => startCreate(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-3 md:p-4">
        {formType ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={closeForm} />
            <form
              action={async (formData) => {
                if (!ensureReminderLeadTime(String(formData.get("reminderOffset") ?? reminderOffset))) return;
                if (formType === "MEETING") {
                  const from = new Date(`${scheduledDate}T${scheduledTime}`);
                  const to = new Date(`${endDate}T${endTime}`);
                  if (to.getTime() <= from.getTime()) {
                    window.alert("To date and time must be after From.");
                    return;
                  }
                }
                if (editing) await updateLeadActivity(formData);
                else await createLeadActivity(formData);
                closeForm();
              }}
              className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            >
              <ChildParentFields leadId={leadId} contactId={contactId} />
              <input type="hidden" name="type" value={formType} />
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <h3 className="mb-3 text-lg font-semibold text-ink-900">{typeLabel} Follow Up</h3>
              <Line label="Subject" required>
                {formType === "MEETING" ? (
                  <input
                    name="subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onBlur={() => setSubject((s) => titleCase(s))}
                    className={line}
                  />
                ) : (
                  <SubjectField value={subject} onChange={setSubject} suggestions={suggestions} />
                )}
              </Line>
              {formType === "MEETING" ? (
                <Line label="Meeting Place" required>
                  <select name="venue" required value={venue} onChange={(e) => setVenue(e.target.value)} className={line}>
                    <option value="">Select Place</option>
                    {MEETING_VENUES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </Line>
              ) : null}
              {formType === "MEETING" ? (
                <>
                  <Line label="From" required>
                    <div className="flex items-end gap-3">
                      <input
                        name="date"
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={line}
                      />
                      <TimeField name="time" value={scheduledTime} onChange={setFromTime} />
                    </div>
                  </Line>
                  <Line label="To" required>
                    <div className="flex items-end gap-3">
                      <input
                        name="endDate"
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={line}
                      />
                      <TimeField name="endTime" value={endTime} onChange={setEndTime} />
                    </div>
                  </Line>
                </>
              ) : formType === "EMAIL" ? (
                <Line label="Date" required>
                  <input
                    name="date"
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={line}
                  />
                  <input type="hidden" name="time" value={scheduledTime} />
                </Line>
              ) : (
                <Line label="Date" required>
                  <div className="flex items-end gap-3">
                    <input
                      name="date"
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className={line}
                    />
                    <TimeField name="time" value={scheduledTime} onChange={setScheduledTime} />
                  </div>
                </Line>
              )}
              <Line label="Reminder">
                <select
                  name="reminderOffset"
                  value={reminderOffset}
                  className={line}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!ensureReminderLeadTime(next)) return;
                    setReminderOffset(next);
                  }}
                >
                  {FOLLOW_UP_REMINDERS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Line>
              <Line label="Details">
                <textarea name="body" rows={2} defaultValue={editing?.body ?? ""} className={`${line} resize-none`} />
              </Line>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-cut border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <SubmitButton
                  className="btn-cut bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  pendingLabel="Saving…"
                >
                  Save
                </SubmitButton>
              </div>
            </form>
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No follow-ups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-sm font-bold text-slate-800">
                <tr>
                  <th className="py-2 pr-3 font-bold"><SortBtn column="type" label="Type" /></th>
                  <th className="py-2 pr-3 font-bold"><SortBtn column="subject" label="Subject" /></th>
                  <th className="py-2 pr-3 font-bold"><SortBtn column="lead" label={nameLabel} /></th>
                  <th className="py-2 pr-3 font-bold"><SortBtn column="occurredAt" label="Scheduled" /></th>
                  <th className="py-2 pr-3 font-bold"><SortBtn column="owner" label="Assigned To" /></th>
                  <th className="w-16 py-2 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a) => (
                  <tr key={a.id} className="align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{labelFor(LEAD_ACTIVITY_TYPES, a.type)}</td>
                    <td className="py-2 pr-3 font-medium text-ink-900">{a.subject}</td>
                    <td className="py-2 pr-3">{leadName}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{scheduledLabel(a)}</td>
                    <td className="py-2 pr-3">{a.owner.name}</td>
                    <td className="w-16 py-2 align-top">
                      <div className="flex items-center justify-center gap-0">
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          className="inline-flex h-7 w-6 items-center justify-center text-brand-700 hover:opacity-80"
                          onClick={() => startEdit(a)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          className="inline-flex h-7 w-6 items-center justify-center text-rose-600 hover:opacity-80"
                          onClick={() => setDeleting(a)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete follow-up?"
        message={`${deleting?.subject ?? "This follow-up"} will be removed from this ${childNoun(contactId)}.`}
        onCancel={() => setDeleting(null)}
        action={deleteLeadActivity.bind(null, deleting?.id ?? "", parentId)}
      />
    </>
  );
}
