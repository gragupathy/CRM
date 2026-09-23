import {
  DEAL_STAGES,
  LOSS_COLORS,
  LOSS_REASONS,
  OPEN_DEAL_STAGES,
  PIPELINE_COLORS,
} from "@/lib/constants";
import {
  addMonths,
  compactInr,
  compactNumber,
  daysBetween,
  formatPct,
  monthKey,
  monthLabel,
} from "@/lib/utils";

export type DealRow = {
  amount: number;
  stage: string;
  probability: number;
  createdAt: Date;
  updatedAt: Date;
  expectedClose: Date | null;
  closedAt: Date | null;
  lostReason: string | null;
  owner: { id: string; name: string };
};

export type Slice = { label: string; value: number; color: string; pct: number };
export type MonthPoint = { key: string; label: string; value: number; count: number };
export type Kpi = {
  label: string;
  value: string;
  icon: "sales" | "win" | "close" | "days" | "pipeline" | "open" | "weighted" | "age";
  accent: string;
  delta: string;
  deltaUp: boolean;
};
export type AgentRow = {
  id: string;
  name: string;
  totalSales: number;
  openDeals: number;
  pipeline: number;
  winRate: number;
};

function closeDate(d: DealRow) {
  return d.closedAt ?? (d.stage === "WON" || d.stage === "LOST" ? d.updatedAt : null);
}

function monthKeys(start: Date, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(start, i);
    const key = monthKey(d);
    return { key, label: monthLabel(key) };
  });
}

function inWindow(date: Date, from: Date, to: Date) {
  return date >= from && date < to;
}

function deltaLabel(current: number, previous: number) {
  if (current === previous) return { delta: "No change since last week", deltaUp: true };
  if (previous === 0) return { delta: "New vs last week", deltaUp: true };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    delta: `${sign}${pct.toFixed(1)}% since last week`,
    deltaUp: pct >= 0,
  };
}

export function buildDashboard(deals: DealRow[]) {
  const now = new Date();
  const open = deals.filter((d) => OPEN_DEAL_STAGES.includes(d.stage));
  const won = deals.filter((d) => d.stage === "WON");
  const lost = deals.filter((d) => d.stage === "LOST");
  const closed = won.length + lost.length;

  const totalSales = won.reduce((s, d) => s + d.amount, 0);
  const pipeline = open.reduce((s, d) => s + d.amount, 0);
  const weighted = open.reduce((s, d) => s + d.amount * (d.probability / 100), 0);
  const winRate = closed ? (won.length / closed) * 100 : 0;
  const closeRate = deals.length ? (won.length / deals.length) * 100 : 0;

  const closeDaysOf = (rows: DealRow[]) => {
    const days = rows
      .map((d) => {
        const end = closeDate(d);
        return end ? daysBetween(d.createdAt, end) : null;
      })
      .filter((n): n is number => n != null);
    return days.length ? days.reduce((s, n) => s + n, 0) / days.length : 0;
  };
  const avgDaysToClose = closeDaysOf(won);

  const openAges = open.map((d) => daysBetween(d.createdAt, now));
  const avgOpenAge = openAges.length
    ? openAges.reduce((s, n) => s + n, 0) / openAges.length
    : 0;

  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const wonAmt = (from: Date, to: Date) =>
    won
      .filter((d) => {
        const c = closeDate(d);
        return c ? inWindow(c, from, to) : false;
      })
      .reduce((s, d) => s + d.amount, 0);
  const openAmt = (from: Date, to: Date) =>
    open.filter((d) => inWindow(d.createdAt, from, to)).reduce((s, d) => s + d.amount, 0);
  const wonCount = (from: Date, to: Date) =>
    won.filter((d) => {
      const c = closeDate(d);
      return c ? inWindow(c, from, to) : false;
    }).length;
  const closedCount = (from: Date, to: Date) =>
    [...won, ...lost].filter((d) => {
      const c = closeDate(d);
      return c ? inWindow(c, from, to) : false;
    }).length;

  const salesDelta = deltaLabel(wonAmt(weekAgo, now), wonAmt(twoWeeksAgo, weekAgo));
  const winThis = closedCount(weekAgo, now);
  const winPrev = closedCount(twoWeeksAgo, weekAgo);
  const winDelta = deltaLabel(
    winThis ? (wonCount(weekAgo, now) / winThis) * 100 : 0,
    winPrev ? (wonCount(twoWeeksAgo, weekAgo) / winPrev) * 100 : 0,
  );
  const closeDelta = deltaLabel(wonCount(weekAgo, now), wonCount(twoWeeksAgo, weekAgo));
  const pipeDelta = deltaLabel(openAmt(weekAgo, now), openAmt(twoWeeksAgo, weekAgo));
  const openDelta = deltaLabel(
    open.filter((d) => inWindow(d.createdAt, weekAgo, now)).length,
    open.filter((d) => inWindow(d.createdAt, twoWeeksAgo, weekAgo)).length,
  );
  const wonThisWeek = won.filter((d) => {
    const c = closeDate(d);
    return c ? inWindow(c, weekAgo, now) : false;
  });
  const wonPrevWeek = won.filter((d) => {
    const c = closeDate(d);
    return c ? inWindow(c, twoWeeksAgo, weekAgo) : false;
  });
  const daysDelta = deltaLabel(closeDaysOf(wonThisWeek), closeDaysOf(wonPrevWeek));
  const prevOpen = open.filter((d) => d.createdAt < weekAgo);
  const prevOpenAge = prevOpen.length
    ? prevOpen.reduce((s, d) => s + daysBetween(d.createdAt, weekAgo), 0) / prevOpen.length
    : avgOpenAge;
  const ageDelta = deltaLabel(avgOpenAge, prevOpenAge);

  const kpis: Kpi[] = [
    {
      label: "Total sales",
      value: compactInr(totalSales),
      icon: "sales",
      accent: "#3b82f6",
      ...salesDelta,
    },
    {
      label: "Win rate",
      value: formatPct(winRate),
      icon: "win",
      accent: "#f97316",
      ...winDelta,
    },
    {
      label: "Close rate",
      value: formatPct(closeRate),
      icon: "close",
      accent: "#06b6d4",
      ...closeDelta,
    },
    {
      label: "Avg days to close",
      value: avgDaysToClose.toFixed(2),
      icon: "days",
      accent: "#8b5cf6",
      ...daysDelta,
    },
    {
      label: "Pipeline value",
      value: compactInr(pipeline),
      icon: "pipeline",
      accent: "#22c55e",
      ...pipeDelta,
    },
    {
      label: "Open deals",
      value: compactNumber(open.length, 1),
      icon: "open",
      accent: "#eab308",
      ...openDelta,
    },
    {
      label: "Weighted value",
      value: compactInr(weighted),
      icon: "weighted",
      accent: "#ec4899",
      ...pipeDelta,
    },
    {
      label: "Avg open deal age",
      value: avgOpenAge.toFixed(2),
      icon: "age",
      accent: "#6366f1",
      ...ageDelta,
    },
  ];

  const pipelineSlices: Slice[] = DEAL_STAGES.map((s) => {
    const count = deals.filter((d) => d.stage === s.value).length;
    return {
      label: s.value === "LOST" ? "Closed lost" : s.value === "WON" ? "Won" : s.label,
      value: count,
      color: PIPELINE_COLORS[s.value],
      pct: deals.length ? (count / deals.length) * 100 : 0,
    };
  }).filter((s) => s.value > 0);

  const lossCounts = new Map<string, number>();
  for (const d of lost) {
    const key = d.lostReason && LOSS_REASONS.some((r) => r.value === d.lostReason)
      ? d.lostReason
      : "UNSPECIFIED";
    lossCounts.set(key, (lossCounts.get(key) ?? 0) + 1);
  }
  const lossTotal = lost.length || 1;
  const lossSlices: Slice[] = LOSS_REASONS.map((r) => {
    const value = lossCounts.get(r.value) ?? 0;
    return {
      label: r.label,
      value,
      color: LOSS_COLORS[r.value],
      pct: (value / lossTotal) * 100,
    };
  }).filter((s) => s.value > 0);

  const pastStart = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -11);
  const pastMonths = monthKeys(pastStart, 12);
  const wonHistory: MonthPoint[] = pastMonths.map(({ key, label }) => {
    const rows = won.filter((d) => monthKey(closeDate(d) ?? d.updatedAt) === key);
    return {
      key,
      label,
      value: rows.reduce((s, d) => s + d.amount, 0),
      count: rows.length,
    };
  });

  const futureStart = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), 0);
  const futureMonths = monthKeys(futureStart, 12);
  const projection: MonthPoint[] = futureMonths.map(({ key, label }) => {
    const rows = open.filter((d) => d.expectedClose && monthKey(d.expectedClose) === key);
    return {
      key,
      label,
      value: rows.reduce((s, d) => s + d.amount, 0),
      count: rows.length,
    };
  });

  const byOwner = new Map<string, DealRow[]>();
  for (const d of deals) {
    const list = byOwner.get(d.owner.id) ?? [];
    list.push(d);
    byOwner.set(d.owner.id, list);
  }
  const agents: AgentRow[] = [...byOwner.entries()].map(([id, rows]) => {
    const w = rows.filter((r) => r.stage === "WON");
    const l = rows.filter((r) => r.stage === "LOST");
    const o = rows.filter((r) => OPEN_DEAL_STAGES.includes(r.stage));
    const c = w.length + l.length;
    return {
      id,
      name: rows[0].owner.name,
      totalSales: w.reduce((s, r) => s + r.amount, 0),
      openDeals: o.length,
      pipeline: o.reduce((s, r) => s + r.amount, 0),
      winRate: c ? (w.length / c) * 100 : 0,
    };
  });

  return { kpis, pipelineSlices, lossSlices, wonHistory, projection, agents };
}
