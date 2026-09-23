export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function fullName(first: string, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim();
}

export function compactInr(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const trim = (v: string) => v.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  if (abs >= 10_000_000) return `${sign}₹${trim((abs / 10_000_000).toFixed(2))}Cr`;
  if (abs >= 100_000) return `${sign}₹${trim((abs / 100_000).toFixed(2))}L`;
  if (abs >= 1_000) return `${sign}₹${trim((abs / 1_000).toFixed(1))}K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function compactNumber(n: number, digits = 2) {
  const abs = Math.abs(n);
  const trim = (v: string) => v.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  if (abs >= 1_000_000) return `${trim((n / 1_000_000).toFixed(digits))}M`;
  if (abs >= 1_000) return `${trim((n / 1_000).toFixed(1))}K`;
  return trim(n.toFixed(abs >= 100 ? 0 : digits));
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatPct(n: number) {
  return `${n.toFixed(2)}%`;
}

export function daysBetween(from: Date, to: Date) {
  return Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function money(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes >= 10 * 1024 ? 0 : 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function formatDateDmy(value?: Date | string | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()} ${hh}:${min}:${ss} ${ampm}`;
}

export function formatLeadNo(leadNo?: number | null, at?: Date | string | number | null) {
  if (!leadNo) return "—";
  const year =
    typeof at === "number"
      ? at
      : at
        ? new Date(at).getFullYear()
        : new Date().getFullYear();
  return `${year}-${String(leadNo).padStart(4, "0")}`;
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function labelFor(
  items: readonly { value: string; label: string }[],
  value: string,
) {
  return items.find((i) => i.value === value)?.label ?? value;
}

export function websiteHref(url?: string | null) {
  const value = url?.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
