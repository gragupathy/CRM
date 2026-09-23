export type LeadExportRow = {
  name: string;
  email: string;
  phone: string;
  leadType: string;
  source: string;
};

/** Columns shown on the leads list and used by Excel/PDF export. */
export const LEAD_LIST_COLUMNS: { key: keyof LeadExportRow; label: string }[] = [
  { key: "name", label: "Lead Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "leadType", label: "Lead Type" },
  { key: "source", label: "Lead Source" },
];

export function exportHeaders() {
  return ["S.No", ...LEAD_LIST_COLUMNS.map((c) => c.label)];
}

export function exportRowValues(row: LeadExportRow, index: number) {
  return [String(index + 1), ...LEAD_LIST_COLUMNS.map((c) => row[c.key] || "")];
}
