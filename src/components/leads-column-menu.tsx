"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, List, Search, Settings, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_LEAD_COLUMNS,
  LEAD_COLS_COOKIE,
  LEAD_COLUMN_DEFS,
  LEAD_PER_PAGE_COOKIE,
  LEAD_PER_PAGE_OPTIONS,
  type LeadColumnId,
  writeClientCookie,
} from "@/lib/lead-list-prefs";

export function LeadsColumnMenu({
  columns,
  perPage,
  querySuffix,
}: {
  columns: LeadColumnId[];
  perPage: number;
  querySuffix: string;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setRowsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function hrefFor(extra: Record<string, string>) {
    const p = new URLSearchParams(querySuffix);
    for (const [k, v] of Object.entries(extra)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `/leads?${s}` : "/leads";
  }

  function setPerPage(n: number) {
    writeClientCookie(LEAD_PER_PAGE_COOKIE, String(n));
    setRowsOpen(false);
    setOpen(false);
    router.push(hrefFor({ perPage: n === 10 ? "" : String(n), page: "1" }));
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        title="Column options"
        aria-label="Column options"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        onClick={() => {
          const r = btnRef.current?.getBoundingClientRect();
          if (r) {
            setMenuPos({
              top: r.bottom + 4,
              right: window.innerWidth - r.right,
            });
          }
          setOpen((v) => !v);
          setRowsOpen(false);
        }}
      >
        <SlidersHorizontal size={16} />
      </button>
      {open ? (
        <div
          className="fixed z-50 min-w-[17.5rem] overflow-visible rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setManage(true);
              setOpen(false);
            }}
          >
            <Settings size={15} className="text-slate-500" />
            Manage Columns
          </button>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2 text-[13px] text-slate-700">
            <span className="flex items-center gap-2">
              <List size={16} strokeWidth={2} className="shrink-0 text-slate-500" />
              <span className="whitespace-nowrap">Rows Per Page</span>
            </span>
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Rows per page"
                aria-expanded={rowsOpen}
                className="inline-flex h-8 min-w-[4.5rem] items-center justify-between gap-1 rounded-md border border-slate-300 bg-white px-2 text-[13px] font-medium text-ink-900 hover:bg-slate-50"
                onClick={() => setRowsOpen((v) => !v)}
              >
                {perPage}
                <ChevronDown size={14} className="text-slate-500" />
              </button>
              {rowsOpen ? (
                <ul className="absolute right-0 z-50 mt-1 min-w-[4.5rem] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  {LEAD_PER_PAGE_OPTIONS.map((n) => (
                    <li key={n}>
                      <button
                        type="button"
                        className={`block w-full px-3 py-1.5 text-left text-[13px] hover:bg-slate-50 ${
                          n === perPage ? "font-semibold text-indigo-700" : "text-ink-900"
                        }`}
                        onClick={() => setPerPage(n)}
                      >
                        {n}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {manage ? (
        <ManageColumnsDialog
          selected={columns}
          onCancel={() => setManage(false)}
          onSave={(next) => {
            writeClientCookie(LEAD_COLS_COOKIE, next.join(","));
            setManage(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function ManageColumnsDialog({
  selected,
  onCancel,
  onSave,
}: {
  selected: LeadColumnId[];
  onCancel: () => void;
  onSave: (next: LeadColumnId[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<LeadColumnId[]>(() =>
    selected.length ? selected : [...DEFAULT_LEAD_COLUMNS],
  );

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return LEAD_COLUMN_DEFS;
    return LEAD_COLUMN_DEFS.filter((c) => c.label.toLowerCase().includes(t));
  }, [query]);

  const badges = filtered.filter((c) => c.group === "badge");
  const fields = filtered.filter((c) => c.group === "field");

  function toggle(id: LeadColumnId, required?: boolean) {
    if (id === "name") return;
    setDraft((cur) => {
      if (cur.includes(id)) {
        if (required && id === "name") return cur;
        return cur.filter((x) => x !== id);
      }
      return [...cur, id];
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={onCancel} />
      <div className="relative flex max-h-[min(36rem,90vh)] w-full max-w-sm flex-col rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-ink-900">Manage Columns</h3>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {badges.length ? (
            <ul className="space-y-1 border-b border-slate-200 pb-2">
              {badges.map((c) => (
                <ColumnCheck
                  key={c.id}
                  label={c.label}
                  checked={draft.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
              ))}
            </ul>
          ) : null}
          <ul className={`space-y-1 ${badges.length ? "pt-2" : ""}`}>
            {fields.map((c) => (
              <ColumnCheck
                key={c.id}
                label={c.label}
                required={c.required}
                checked={draft.includes(c.id)}
                disabled={c.id === "name"}
                onChange={() => toggle(c.id, c.required)}
              />
            ))}
          </ul>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn-cut border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-cut bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={() => onSave(draft.includes("name") ? draft : ["name", ...draft])}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnCheck({
  label,
  required,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  required?: boolean;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <li>
      <label
        className={`flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm ${
          disabled ? "cursor-default text-slate-500" : "text-slate-800 hover:bg-slate-50"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60"
        />
        <span>
          {label}
          {required ? <span className="text-rose-500">*</span> : null}
        </span>
      </label>
    </li>
  );
}
