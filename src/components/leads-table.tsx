"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Phone, StickyNote } from "lucide-react";
import { SortHeader } from "@/components/list-pager";
import { LeadsColumnMenu } from "@/components/leads-column-menu";
import { formatDate, formatLeadNo, fullName, labelFor, websiteHref } from "@/lib/utils";
import { INDUSTRIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, normalizeIndustry } from "@/lib/constants";
import {
  LEAD_WIDTHS_KEY,
  leadColumnDef,
  type LeadColumnId,
} from "@/lib/lead-list-prefs";

export type LeadListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  leadType: string;
  source: string;
  website: string | null;
  company: string | null;
  jobTitle: string | null;
  status: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  leadNo: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerName: string;
  activityCount: number;
  noteCount: number;
};

function sourceValue(source: string) {
  if (source === "WEB") return "WEBSITE";
  if (source === "COLD") return "COLD_CALL";
  return source;
}

function cellText(lead: LeadListRow, id: LeadColumnId): string {
  switch (id) {
    case "name":
      return fullName(lead.firstName, lead.lastName);
    case "firstName":
      return lead.firstName || "—";
    case "lastName":
      return lead.lastName || "—";
    case "company":
      return lead.company || "—";
    case "email":
      return lead.email || "—";
    case "phone":
      return lead.mobile || lead.phone || "—";
    case "mobile":
      return lead.mobile || "—";
    case "jobTitle":
      return lead.jobTitle || "—";
    case "leadType":
      return labelFor(LEAD_TYPES, lead.leadType);
    case "source":
      return labelFor(LEAD_SOURCES, sourceValue(lead.source));
    case "owner":
      return lead.ownerName || "—";
    case "status":
      return labelFor(LEAD_STATUSES, lead.status);
    case "industry":
      return lead.industry ? labelFor(INDUSTRIES, normalizeIndustry(lead.industry)) : "—";
    case "city":
      return lead.city || "—";
    case "state":
      return lead.state || "—";
    case "country":
      return lead.country || "—";
    case "postalCode":
      return lead.postalCode || "—";
    case "leadNo":
      return formatLeadNo(lead.leadNo, lead.createdAt);
    case "createdAt":
      return formatDate(lead.createdAt);
    case "updatedAt":
      return formatDate(lead.updatedAt);
    case "website":
      return lead.website || "—";
    default:
      return "—";
  }
}

function Badge({ count, label, icon }: { count: number; label: string; icon: React.ReactNode }) {
  return (
    <span
      title={`${label}: ${count}`}
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs ${
        count ? "bg-sky-50 text-sky-800" : "text-slate-400"
      }`}
    >
      {icon}
      {count || ""}
    </span>
  );
}

export function LeadsTable({
  leads,
  sort,
  dir,
  querySuffix,
  columns,
  perPage,
}: {
  leads: LeadListRow[];
  sort: string;
  dir: "asc" | "desc";
  querySuffix: string;
  columns: LeadColumnId[];
  perPage: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const allIds = leads.map((l) => l.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const visible = columns.length ? columns : (["name"] as LeadColumnId[]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEAD_WIDTHS_KEY);
      if (raw) setWidths(JSON.parse(raw) as Record<string, number>);
    } catch {
      /* ignore */
    }
  }, []);

  function hrefFor(column: string, nextDir: "asc" | "desc") {
    const p = new URLSearchParams(querySuffix);
    p.set("sort", column);
    p.set("dir", nextDir);
    p.set("page", "1");
    return `/leads?${p.toString()}`;
  }

  function onResizeStart(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = widths[id] ?? (e.currentTarget.parentElement as HTMLElement).offsetWidth;
    function onMove(ev: MouseEvent) {
      const nextW = Math.max(72, startW + ev.clientX - startX);
      setWidths((prev) => {
        const next = { ...prev, [id]: nextW };
        localStorage.setItem(LEAD_WIDTHS_KEY, JSON.stringify(next));
        return next;
      });
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div className="overflow-x-auto rounded-none">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-sm">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={allChecked}
                onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                aria-label="Select all"
              />
            </th>
            {visible.map((id) => {
              const def = leadColumnDef(id);
              return (
                <th
                  key={id}
                  className="relative px-4 py-3"
                  style={widths[id] ? { width: widths[id], minWidth: widths[id] } : undefined}
                >
                  {def.sortable && def.sortKey ? (
                    <SortHeader label={def.label} column={def.sortKey} sort={sort} dir={dir} hrefFor={hrefFor} />
                  ) : (
                    <span className="font-medium text-slate-600">{def.label}</span>
                  )}
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-200"
                    onMouseDown={(e) => onResizeStart(id, e)}
                  />
                </th>
              );
            })}
            <th className="sticky right-0 w-12 bg-slate-50 px-1 py-2 text-right">
              <LeadsColumnMenu
                columns={visible}
                perPage={perPage}
                querySuffix={querySuffix}
              />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <tr>
              <td colSpan={visible.length + 2} className="px-4 py-8 text-center text-sm text-slate-500">
                Capture a prospect, or switch to another view from the menu next to My Leads.
              </td>
            </tr>
          ) : (
            leads.map((l) => {
              const site = websiteHref(l.website);
              return (
                <tr key={l.id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={selected.includes(l.id)}
                      onChange={(e) =>
                        setSelected((cur) =>
                          e.target.checked ? [...cur, l.id] : cur.filter((id) => id !== l.id),
                        )
                      }
                      aria-label={`Select ${fullName(l.firstName, l.lastName)}`}
                    />
                  </td>
                  {visible.map((id) => (
                    <td
                      key={id}
                      className="px-4 py-3 text-slate-600"
                      style={widths[id] ? { width: widths[id], minWidth: widths[id] } : undefined}
                    >
                      {id === "name" ? (
                        <Link href={`/leads/${l.id}`} className="font-medium text-blue-600 hover:underline">
                          {fullName(l.firstName, l.lastName)}
                        </Link>
                      ) : id === "website" ? (
                        site ? (
                          <a
                            href={site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-600 hover:underline"
                          >
                            {l.website}
                          </a>
                        ) : (
                          "—"
                        )
                      ) : id === "activityBadge" ? (
                        <Badge
                          count={l.activityCount}
                          label="Follow-ups"
                          icon={<Phone size={13} />}
                        />
                      ) : id === "noteBadge" ? (
                        <Badge count={l.noteCount} label="Notes" icon={<StickyNote size={13} />} />
                      ) : (
                        cellText(l, id)
                      )}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-white px-1 py-3 group-hover:bg-slate-50" />
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
