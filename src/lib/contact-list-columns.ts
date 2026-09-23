export type ContactExportRow = {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  account: string;
};

export const CONTACT_LIST_COLUMNS: { key: keyof ContactExportRow; label: string }[] = [
  { key: "name", label: "Contact Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "jobTitle", label: "Job Title" },
  { key: "account", label: "Account" },
];

export function contactExportHeaders() {
  return ["S.No", ...CONTACT_LIST_COLUMNS.map((c) => c.label)];
}

export function contactExportRowValues(row: ContactExportRow, index: number) {
  return [String(index + 1), ...CONTACT_LIST_COLUMNS.map((c) => row[c.key] || "")];
}
