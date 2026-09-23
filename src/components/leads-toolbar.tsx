"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Printer, RefreshCw, Search } from "lucide-react";
import { DEFAULT_LEAD_VIEW, LEAD_VIEWS, type LeadViewId, leadViewLabel } from "@/lib/lead-views";

export function LeadsToolbar({
  view,
  querySuffix,
}: {
  view: LeadViewId;
  q?: string;
  querySuffix: string;
}) {
  const router = useRouter();
  const [viewsOpen, setViewsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewQuery, setViewQuery] = useState("");
  const viewsRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (!viewsRef.current?.contains(t)) setViewsOpen(false);
      if (!createRef.current?.contains(t)) setCreateOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filteredViews = useMemo(() => {
    const t = viewQuery.trim().toLowerCase();
    if (!t) return LEAD_VIEWS;
    return LEAD_VIEWS.filter((v) => v.label.toLowerCase().includes(t));
  }, [viewQuery]);

  const href = (extra: Record<string, string>) => {
    const p = new URLSearchParams(querySuffix);
    for (const [k, v] of Object.entries(extra)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("page");
    if (p.get("view") === DEFAULT_LEAD_VIEW) p.delete("view");
    const s = p.toString();
    return s ? `/leads?${s}` : "/leads";
  };

  const exportQs = querySuffix ? `?${querySuffix}` : "";
  const toolBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded text-sky-700 hover:bg-sky-100";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={viewsRef}>
            <button
              type="button"
              onClick={() => {
                setViewsOpen((o) => !o);
                setCreateOpen(false);
              }}
              className="btn-cut inline-flex items-center gap-1 border border-sky-100 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100"
            >
              {leadViewLabel(view)}
              <ChevronDown size={14} className="text-sky-500" />
            </button>
            {viewsOpen ? (
              <div className="absolute left-0 z-30 mt-2 w-72 rounded-xl border border-sky-100 bg-sky-50 p-2 shadow-lg">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                  <input
                    value={viewQuery}
                    onChange={(e) => setViewQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full rounded-lg border border-sky-200 bg-white py-1.5 pl-8 pr-2 text-sm outline-none focus:border-sky-400"
                  />
                </div>
                <ul className="max-h-72 overflow-auto py-1">
                  {filteredViews.map((v) => (
                    <li key={v.id}>
                      <Link
                        href={href({ view: v.id })}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-sky-900 hover:bg-sky-100"
                        onClick={() => setViewsOpen(false)}
                      >
                        <span className="w-4 text-sky-600">
                          {v.id === view ? <Check size={14} /> : null}
                        </span>
                        {v.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
          <a
            href={`/leads/export/excel${exportQs}`}
            className={toolBtn}
            title="Export to Excel"
          >
            <img src="/icons/excel.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
          </a>
          <a
            href={`/leads/export/pdf${exportQs}`}
            target="_blank"
            rel="noreferrer"
            className={toolBtn}
            title="Export to PDF"
          >
            <img src="/icons/pdf.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
          </a>
          <a
            href={`/leads/export/pdf${exportQs}${exportQs ? "&" : "?"}print=1`}
            target="_blank"
            rel="noreferrer"
            className={toolBtn}
            title="Print"
          >
            <Printer size={16} />
          </a>
          </div>
          <div className="relative flex" ref={createRef}>
          <Link
            href="/leads/new"
            className="inline-flex items-center rounded-l-lg bg-[#3d5afe] px-4 py-2 text-sm font-medium text-white hover:bg-[#3550e6]"
            onClick={() => setCreateOpen(false)}
          >
            Add Lead
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreateOpen((o) => !o);
              setViewsOpen(false);
            }}
            className="inline-flex items-center rounded-r-lg border-l border-white/30 bg-[#3d5afe] px-2 text-white hover:bg-[#3550e6]"
            aria-label="More create options"
          >
            <ChevronDown size={16} />
          </button>
          {createOpen ? (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                href="/leads/import"
                className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => setCreateOpen(false)}
              >
                Import Leads
                <span aria-hidden>✨</span>
              </Link>
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
