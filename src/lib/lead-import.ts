export const LEAD_SAMPLE_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Mobile",
  "Lead Type",
  "Lead Source",
  "Company Name",
  "Job Title",
  "Website",
  "City",
  "State",
  "Country",
  "Pincode",
] as const;

export const LEAD_SAMPLE_ROW = [
  "Anita",
  "Sharma",
  "anita@example.com",
  "9876543210",
  "Individual",
  "Website",
  "BrightCo",
  "Manager",
  "https://example.com",
  "Bengaluru",
  "Karnataka",
  "India",
  "560001",
];

export function leadSampleCsv() {
  const line = (cells: readonly string[]) =>
    cells.map((c) => (c.includes(",") ? `"${c}"` : c)).join(",");
  return `${line(LEAD_SAMPLE_HEADERS)}\n${line(LEAD_SAMPLE_ROW)}\n`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      if (row.some((c) => c)) rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c)) rows.push(row);
  return rows;
}

function norm(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const HEADER_MAP: Record<string, string> = {
  firstname: "firstName",
  lastname: "lastName",
  email: "email",
  mobile: "mobile",
  phone: "mobile",
  leadtype: "leadType",
  type: "leadType",
  leadsource: "source",
  source: "source",
  companyname: "company",
  company: "company",
  jobtitle: "jobTitle",
  website: "website",
  city: "city",
  state: "state",
  country: "country",
  pincode: "postalCode",
  postalcode: "postalCode",
};

export function mapCsvRows(rows: string[][]) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => HEADER_MAP[norm(h)]);
  return rows.slice(1).map((line) => {
    const rec: Record<string, string> = {};
    headers.forEach((key, i) => {
      if (key && line[i]) rec[key] = line[i];
    });
    return rec;
  });
}
