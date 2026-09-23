"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  CalendarClock,
  Handshake,
  IndianRupee,
  Percent,
  Scale,
  Timer,
  Wallet,
} from "lucide-react";
import type { Slice, MonthPoint, Kpi, AgentRow } from "@/lib/dashboard";
import { compactInr, cn, formatPct, labelFor, titleCase } from "@/lib/utils";
import { dueDateClass } from "@/lib/due-date";
import { reminderLabel } from "@/lib/follow-up";
import { LEAD_ACTIVITY_TYPES } from "@/lib/constants";

function Donut({ slices, empty }: { slices: Slice[]; empty: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) {
    return <p className="py-8 text-center text-sm text-slate-400">{empty}</p>;
  }
  let acc = 0;
  const stops = slices.map((s) => {
    const start = acc;
    acc += (s.value / total) * 100;
    return `${s.color} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
  });
  return (
    <div className="flex w-full items-start gap-3">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      >
        <div className="absolute inset-7 rounded-full bg-white" />
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-start gap-2">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="min-w-0 leading-snug text-slate-600">
              <span className="break-words">{s.label}</span>{" "}
              <span className="whitespace-nowrap font-semibold text-slate-800">
                {s.pct.toFixed(2)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DualBar({
  points,
  aLabel,
  bLabel,
  aColor,
  bColor,
}: {
  points: MonthPoint[];
  aLabel: string;
  bLabel: string;
  aColor: string;
  bColor: string;
}) {
  const w = 820;
  const h = 268;
  const pad = { l: 86, r: 16, t: 8, b: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxV = Math.max(1, ...points.map((p) => p.value));
  const maxC = Math.max(1, ...points.map((p) => p.count));
  const groupW = innerW / Math.max(points.length, 1);
  const barW = Math.min(24, groupW * 0.38);
  const axis = "#0f172a";
  const ticks = [0, 0.5, 1];

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-end gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: aColor }} /> {aLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: bColor }} /> {bLabel}
        </span>
      </div>
      <div className="w-full" style={{ aspectRatio: `${w} / ${h}` }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="xMidYMin meet">
          {ticks.map((t) => {
            const y = pad.t + innerH * (1 - t);
            return (
              <g key={t}>
                <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#e8eef6" />
                <text
                  x={pad.l - 10}
                  y={y + 6}
                  textAnchor="end"
                  fill={axis}
                  fontSize="16"
                  fontWeight="700"
                >
                  {compactInr(maxV * t)}
                </text>
              </g>
            );
          })}
          <line x1={pad.l} x2={pad.l} y1={pad.t} y2={pad.t + innerH} stroke={axis} strokeWidth="2.5" />
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + innerH}
            y2={pad.t + innerH}
            stroke={axis}
            strokeWidth="2.5"
          />
          {points.map((p, i) => {
            const x0 = pad.l + i * groupW + (groupW - barW * 2 - 3) / 2;
            const hV = (p.value / maxV) * innerH;
            const hC = (p.count / maxC) * innerH;
            return (
              <g key={p.key}>
                <rect
                  x={x0}
                  y={pad.t + innerH - hV}
                  width={barW}
                  height={hV}
                  rx="2"
                  fill={aColor}
                />
                <rect
                  x={x0 + barW + 3}
                  y={pad.t + innerH - hC}
                  width={barW}
                  height={hC}
                  rx="2"
                  fill={bColor}
                />
              </g>
            );
          })}
          {points.map((p, i) => {
            const [mon, yr] = p.label.split(" ");
            const cx = pad.l + i * groupW + groupW / 2;
            return (
              <text
                key={`t-${p.key}`}
                x={cx}
                y={pad.t + innerH + 16}
                textAnchor="middle"
                fill={axis}
                fontSize="13"
                fontWeight="700"
              >
                <tspan x={cx} dy="0">
                  {mon}
                </tspan>
                <tspan x={cx} dy="15">
                  {yr}
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

const kpiIcons = {
  sales: IndianRupee,
  win: Percent,
  close: Handshake,
  days: Timer,
  pipeline: Wallet,
  open: Briefcase,
  weighted: Scale,
  age: CalendarClock,
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpiIcons[kpi.icon];
  const Arrow = kpi.deltaUp ? ArrowUp : ArrowDown;
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="w-1.5 shrink-0" style={{ background: kpi.accent }} />
      <div className="flex min-w-0 flex-1 items-start justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{kpi.label}</p>
          <p className="text-2xl font-semibold leading-tight text-slate-900">{kpi.value}</p>
          <p
            className={cn(
              "mt-1 flex items-center gap-0.5 text-[11px] font-medium",
              kpi.deltaUp ? "text-emerald-600" : "text-rose-600",
            )}
          >
            <Arrow size={12} strokeWidth={2.5} />
            {kpi.delta}
          </p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${kpi.accent}1a`, color: kpi.accent }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h3 className="mb-2 text-base font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

export function DashboardBoard({
  kpis,
  pipelineSlices,
  lossSlices,
  wonHistory,
  projection,
  agents,
  upcoming,
  followUps = [],
}: {
  kpis: Kpi[];
  pipelineSlices: Slice[];
  lossSlices: Slice[];
  wonHistory: MonthPoint[];
  projection: MonthPoint[];
  agents: AgentRow[];
  upcoming: {
    id: string;
    subject: string;
    type: string;
    dueAt: Date | string | null;
    owner: { name: string };
  }[];
  followUps?: {
    id: string;
    subject: string;
    type: string;
    dueAt: Date | string | null;
    href: string;
    leadName: string;
    owner: { name: string };
    reminder?: string | null;
  }[];
}) {
  const [tab, setTab] = useState<"overview" | "agents">("overview");

  return (
    <div className="rounded-[28px] bg-gradient-to-br from-[#e7f3ff] via-[#eef4ff] to-[#f3e9ff] p-5 md:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">CRM Dashboard</h1>
        <div className="flex rounded-full bg-white p-1 shadow-card">
          {(["overview", "agents"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-medium capitalize",
                tab === id ? "bg-[#4f6ef7] text-white" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <KpiCard key={k.label} kpi={k} />
            ))}
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
            <ChartCard title="Won deals (last 12 months)">
              <DualBar
                points={wonHistory}
                aLabel="Closed value"
                bLabel="Won deals"
                aColor="#3b82f6"
                bColor="#22d3ee"
              />
            </ChartCard>
            <ChartCard title="Sales pipeline">
              <Donut slices={pipelineSlices} empty="No deals yet." />
            </ChartCard>
            <ChartCard title="Deals projection (future 12 months)">
              <DualBar
                points={projection}
                aLabel="Projected value"
                bLabel="Deals due"
                aColor="#2563eb"
                bColor="#38bdf8"
              />
            </ChartCard>
            <ChartCard title="Deal loss reasons">
              <Donut slices={lossSlices} empty="No lost deals yet." />
            </ChartCard>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Total Sales</th>
                <th className="px-5 py-3">Pipeline</th>
                <th className="px-5 py-3">Open Deals</th>
                <th className="px-5 py-3">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-4 font-medium">{a.name}</td>
                  <td className="px-5 py-4">{compactInr(a.totalSales)}</td>
                  <td className="px-5 py-4">{compactInr(a.pipeline)}</td>
                  <td className="px-5 py-4">{a.openDeals}</td>
                  <td className="px-5 py-4">{formatPct(a.winRate)}</td>
                </tr>
              ))}
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-slate-500">
                    No owner activity yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-5 overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Upcoming Activities</h3>
          <Link href="/activities" className="text-sm text-[#4f6ef7]">
            All Activities
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No dated follow-ups yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcoming.map((a) => {
                const due = a.dueAt ? new Date(a.dueAt) : null;
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium">
                      <Link href="/activities" className="text-brand-700 hover:underline">
                        {a.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{titleCase(a.type)}</td>
                    <td className="px-5 py-3 text-slate-600">{a.owner.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          dueDateClass(due),
                        )}
                      >
                        {due ? due.toLocaleDateString("en-GB") : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Upcoming Follow Ups</h3>
        </div>
        {followUps.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No scheduled follow-ups.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Assigned To</th>
                <th className="px-5 py-3">Scheduled</th>
                <th className="px-5 py-3">Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followUps.map((a) => {
                const due = a.dueAt ? new Date(a.dueAt) : null;
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium">
                      <Link href={a.href} className="text-brand-700 hover:underline">
                        {a.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{a.leadName}</td>
                    <td className="px-5 py-3 text-slate-600">{labelFor(LEAD_ACTIVITY_TYPES, a.type)}</td>
                    <td className="px-5 py-3 text-slate-600">{a.owner.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          dueDateClass(due),
                        )}
                      >
                        {due ? due.toLocaleDateString("en-GB") : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{reminderLabel(a.reminder)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
