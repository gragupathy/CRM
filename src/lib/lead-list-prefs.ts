export const LEAD_PER_PAGE_OPTIONS = [10, 20, 30, 50, 100] as const;

export const LEAD_COLS_COOKIE = "hm-leads-cols";
export const LEAD_PER_PAGE_COOKIE = "hm-leads-per-page";
export const LEAD_WIDTHS_KEY = "hm-leads-col-widths";

export const LEAD_COLUMN_IDS = [
  "activityBadge",
  "noteBadge",
  "name",
  "company",
  "email",
  "website",
  "phone",
  "mobile",
  "leadType",
  "source",
  "owner",
  "firstName",
  "lastName",
  "jobTitle",
  "status",
  "industry",
  "city",
  "state",
  "country",
  "postalCode",
  "leadNo",
  "createdAt",
  "updatedAt",
] as const;

export type LeadColumnId = (typeof LEAD_COLUMN_IDS)[number];

export type LeadColumnDef = {
  id: LeadColumnId;
  label: string;
  required?: boolean;
  group: "badge" | "field";
  sortable?: boolean;
  sortKey?: string;
};

export const LEAD_COLUMN_DEFS: LeadColumnDef[] = [
  { id: "activityBadge", label: "Activity Badge", group: "badge" },
  { id: "noteBadge", label: "Note Badge", group: "badge" },
  { id: "name", label: "Lead Name", group: "field", required: true, sortable: true, sortKey: "name" },
  { id: "company", label: "Company", group: "field", sortable: true, sortKey: "company" },
  { id: "email", label: "Email", group: "field", sortable: true, sortKey: "email" },
  { id: "website", label: "Website", group: "field", sortable: true, sortKey: "website" },
  { id: "phone", label: "Phone", group: "field", sortable: true, sortKey: "phone" },
  { id: "mobile", label: "Mobile", group: "field", sortable: true, sortKey: "mobile" },
  { id: "leadType", label: "Lead Type", group: "field", sortable: true, sortKey: "leadType" },
  { id: "source", label: "Lead Source", group: "field", sortable: true, sortKey: "source" },
  { id: "owner", label: "Lead Owner", group: "field", sortable: true, sortKey: "owner" },
  { id: "firstName", label: "First Name", group: "field", sortable: true, sortKey: "firstName" },
  { id: "lastName", label: "Last Name", group: "field", required: true, sortable: true, sortKey: "lastName" },
  { id: "jobTitle", label: "Job Title", group: "field", sortable: true, sortKey: "jobTitle" },
  { id: "status", label: "Lead Status", group: "field", sortable: true, sortKey: "status" },
  { id: "industry", label: "Industry", group: "field", sortable: true, sortKey: "industry" },
  { id: "city", label: "City", group: "field", sortable: true, sortKey: "city" },
  { id: "state", label: "State", group: "field", sortable: true, sortKey: "state" },
  { id: "country", label: "Country", group: "field", sortable: true, sortKey: "country" },
  { id: "postalCode", label: "Pincode", group: "field", sortable: true, sortKey: "postalCode" },
  { id: "leadNo", label: "Lead Number", group: "field", sortable: true, sortKey: "leadNo" },
  { id: "createdAt", label: "Created Date", group: "field", sortable: true, sortKey: "createdAt" },
  { id: "updatedAt", label: "Modified Date", group: "field", sortable: true, sortKey: "updatedAt" },
];

export const DEFAULT_LEAD_COLUMNS: LeadColumnId[] = [
  "name",
  "email",
  "website",
  "phone",
  "leadType",
  "source",
];

const ID_SET = new Set<string>(LEAD_COLUMN_IDS);

export function isLeadColumnId(value: string): value is LeadColumnId {
  return ID_SET.has(value);
}

export function parsePerPage(raw?: string | null) {
  const n = Number(raw);
  return (LEAD_PER_PAGE_OPTIONS as readonly number[]).includes(n) ? n : 10;
}

export function parseLeadColumns(raw?: string | null): LeadColumnId[] {
  if (!raw) return [...DEFAULT_LEAD_COLUMNS];
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    value = raw;
  }
  const seen = new Set<LeadColumnId>();
  const ids: LeadColumnId[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!isLeadColumnId(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (!ids.includes("name")) ids.unshift("name");
  return ids.length ? ids : [...DEFAULT_LEAD_COLUMNS];
}

export function leadColumnDef(id: LeadColumnId) {
  return LEAD_COLUMN_DEFS.find((c) => c.id === id)!;
}

export function writeClientCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
