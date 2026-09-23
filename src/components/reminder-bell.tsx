"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDateTime, labelFor } from "@/lib/utils";
import { LEAD_ACTIVITY_TYPES } from "@/lib/constants";
import { playReminderSound } from "@/lib/follow-up";

type ReminderItem = {
  id: string;
  subject: string;
  type: string;
  href?: string;
  leadId: string;
  leadName: string;
  assignedTo: string;
  occurredAt: string;
  remindAt: string | null;
  due: boolean;
};

const playedKey = "hm-crm-played-reminders";

function loadPlayed() {
  try {
    return new Set<string>(JSON.parse(sessionStorage.getItem(playedKey) || "[]"));
  } catch {
    return new Set<string>();
  }
}

function savePlayed(ids: Set<string>) {
  sessionStorage.setItem(playedKey, JSON.stringify([...ids]));
}

export function ReminderBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const res = await fetch("/api/follow-up-reminders", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: ReminderItem[] };
    const next = data.items ?? [];
    const played = loadPlayed();
    const freshDue = next.filter((i) => i.due && !played.has(i.id));
    if (freshDue.length) {
      playReminderSound();
      freshDue.forEach((i) => played.add(i.id));
      savePlayed(played);
    }
    setItems(next);
  }

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const dueCount = items.filter((i) => i.due).length;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        title="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {dueCount > 0 ? (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {dueCount}
          </span>
        ) : items.length ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <p className="border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">Follow-up reminders</p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No reminders in the next 24 hours.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((i) => (
                <li key={i.id}>
                  <Link
                    href={i.href ?? `/leads/${i.leadId}`}
                    className="block px-3 py-2 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    <p className="text-sm font-medium text-ink-900">{i.subject}</p>
                    <p className="text-xs text-slate-500">
                      {labelFor(LEAD_ACTIVITY_TYPES, i.type)} · {i.leadName} · {i.assignedTo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {i.due ? "Due now" : "Reminder"} · {formatDateTime(i.occurredAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
