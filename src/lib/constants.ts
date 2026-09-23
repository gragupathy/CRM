export const ROLES = ["ADMIN", "MANAGER", "SALES"] as const;
export type Role = (typeof ROLES)[number];

export const OBJECT_TYPES = ["ACCOUNT", "CONTACT", "LEAD", "DEAL"] as const;
export type ObjectType = (typeof OBJECT_TYPES)[number];

export const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "SELECT", "TEXTAREA"] as const;

export const LEAD_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "JUNK", label: "Junk" },
  { value: "LOST", label: "Junk" },
] as const;

const LEAD_STATUS_ALIASES: Record<string, string> = {
  ASSIGNED: "NEW",
  IN_PROGRESS: "CONTACTED",
};

export function normalizeLeadStatus(value?: string | null) {
  if (!value) return "NEW";
  if (value === "LOST") return "JUNK";
  return LEAD_STATUS_ALIASES[value] ?? value;
}

const LEAD_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  NEW: ["CONTACTED", "QUALIFIED", "UNQUALIFIED", "JUNK"],
  CONTACTED: ["QUALIFIED", "UNQUALIFIED", "JUNK"],
  QUALIFIED: ["CONVERTED", "UNQUALIFIED"],
  UNQUALIFIED: [],
  JUNK: [],
  CONVERTED: [],
};

export function leadStatusChoices(current?: string | null) {
  const from = normalizeLeadStatus(current);
  const next = LEAD_STATUS_TRANSITIONS[from] ?? [];
  const values = [from, ...next.filter((v) => v !== from && v !== "CONVERTED")];
  return LEAD_STATUSES.filter((s) => values.includes(s.value) && s.value !== "LOST");
}

export function canChangeLeadStatus(from?: string | null, to?: string | null) {
  const a = normalizeLeadStatus(from);
  const b = normalizeLeadStatus(to);
  if (a === b) return true;
  if (b === "CONVERTED") return false;
  return (LEAD_STATUS_TRANSITIONS[a] ?? []).includes(b);
}

export function canConvertLead(status?: string | null) {
  return normalizeLeadStatus(status) === "QUALIFIED";
}

export const LEAD_SOURCES = [
  { value: "COLD_CALL", label: "Cold Call" },
  { value: "EVENT", label: "Event" },
  { value: "REFERRAL", label: "Referral" },
  { value: "WALKIN", label: "Walk-in" },
  { value: "WEBSITE", label: "Website" },
] as const;

export const LEAD_TYPES = [
  { value: "INDIVIDUAL", label: "Individual (B2C)" },
  { value: "COMPANY", label: "Company (B2B)" },
] as const;

export const INDUSTRIES = [
  { value: "ACCOUNTING_AND_AUDIT", label: "Accounting & Audit" },
  { value: "ADVERTISING_AND_MARKETING", label: "Advertising & Marketing" },
  { value: "AGRICULTURE_AND_AGRIBUSINESS", label: "Agriculture & Agribusiness" },
  { value: "ARCHITECTURE_AND_INTERIOR_DESIGN", label: "Architecture & Interior Design" },
  { value: "AUTOMOTIVE_AND_AUTO_COMPONENTS", label: "Automotive & Auto Components" },
  { value: "BIOTECHNOLOGY", label: "Biotechnology" },
  { value: "CAPITAL_MARKETS_AND_INVESTMENTS", label: "Capital Markets & Investments" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "E_COMMERCE", label: "E-commerce" },
  { value: "ENGINEERING_AND_INDUSTRIAL_EQUIPMENT", label: "Engineering & Industrial Equipment" },
  { value: "FINANCIAL_SERVICES", label: "Financial Services" },
  { value: "FMCG_CONSUMER_GOODS", label: "FMCG / Consumer Goods" },
  { value: "FOOD_AND_BEVERAGES", label: "Food & Beverages" },
  { value: "GEMS_AND_JEWELLERY", label: "Gems & Jewellery" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "HOSPITALS_AND_CLINICS", label: "Hospitals & Clinics" },
  { value: "HUMAN_RESOURCES_AND_STAFFING", label: "Human Resources & Staffing" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "LEGAL_SERVICES", label: "Legal Services" },
  { value: "MACHINERY_AND_TOOLS", label: "Machinery & Tools" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "MEDIA_AND_ENTERTAINMENT", label: "Media & Entertainment" },
  { value: "MEDICAL_DEVICES", label: "Medical Devices" },
  { value: "PHARMACEUTICALS", label: "Pharmaceuticals" },
  { value: "PUBLISHING", label: "Publishing" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "RENEWABLE_ENERGY", label: "Renewable Energy" },
  { value: "RESTAURANTS_AND_FOOD_SERVICES", label: "Restaurants & Food Services" },
  { value: "RETAIL", label: "Retail" },
  { value: "SECURITY_SERVICES", label: "Security Services" },
  { value: "TEXTILES_AND_APPAREL", label: "Textiles & Apparel" },
  { value: "TRANSPORTATION_AND_LOGISTICS", label: "Transportation & Logistics" },
  { value: "TRAVEL_AND_TOURISM", label: "Travel & Tourism" },
] as const;

const INDUSTRY_ALIASES: Record<string, string> = {
  FMCG: "FMCG_CONSUMER_GOODS",
  HEALTH_CARE: "HEALTHCARE",
};

export function normalizeIndustry(value?: string | null) {
  if (!value) return "";
  return INDUSTRY_ALIASES[value] ?? value;
}

export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Germany",
  "Other",
] as const;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const DEAL_STAGES = [
  { value: "QUALIFICATION", label: "Qualification", probability: 10 },
  { value: "PROPOSAL", label: "Proposal", probability: 40 },
  { value: "NEGOTIATION", label: "Negotiation", probability: 60 },
  { value: "WON", label: "Won", probability: 100 },
  { value: "LOST", label: "Lost", probability: 0 },
] as const;

export const ACTIVITY_TYPES = [
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "TASK", label: "Task" },
  { value: "NOTE", label: "Note" },
] as const;

export const LEAD_ACTIVITY_TYPES = [
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "EMAIL", label: "Email" },
] as const;

export const MEETING_VENUES = [
  { value: "MY_OFFICE", label: "My Office" },
  { value: "CLIENT_OFFICE", label: "Client Office" },
  { value: "ONLINE", label: "Online" },
] as const;

export const FOLLOW_UP_REMINDERS = [
  { value: "NONE", label: "No reminder", minutes: 0 },
  { value: "15_MIN", label: "15 minutes before", minutes: 15 },
  { value: "30_MIN", label: "30 minutes before", minutes: 30 },
  { value: "1_HOUR", label: "1 hour before", minutes: 60 },
  { value: "2_HOUR", label: "2 hours before", minutes: 120 },
  { value: "1_DAY", label: "1 day before", minutes: 1440 },
] as const;

export const FOLLOW_UP_SUBJECTS: Record<string, string[]> = {
  CALL: [
    "Follow-up call",
    "Introduction call",
    "Demo call",
    "Callback",
    "Proposal discussion",
  ],
  MEETING: [
    "Discovery meeting",
    "Product demo",
    "Proposal review",
    "Negotiation meeting",
    "Kick-off meeting",
  ],
  EMAIL: [
    "Introduction email",
    "Follow-up email",
    "Send brochure",
    "Share proposal",
    "Meeting confirmation",
  ],
};

export const LEAD_TASK_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const LEAD_TASK_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
] as const;

export const OPEN_DEAL_STAGES = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION"];

export const LOSS_REASONS = [
  { value: "FEATURE", label: "Feature limitations" },
  { value: "BUDGET", label: "Budget constraints" },
  { value: "PRICE", label: "Price too high" },
  { value: "ALTERNATIVE", label: "Better alternative" },
  { value: "URGENCY", label: "Lack of urgency" },
  { value: "UNSPECIFIED", label: "Unspecified" },
] as const;

export const PIPELINE_COLORS: Record<string, string> = {
  QUALIFICATION: "#5eead4",
  PROPOSAL: "#f9a8d4",
  NEGOTIATION: "#bef264",
  WON: "#fcd34d",
  LOST: "#fb923c",
};

export const LOSS_COLORS: Record<string, string> = {
  FEATURE: "#7dd3fc",
  BUDGET: "#c4b5fd",
  PRICE: "#f0abfc",
  ALTERNATIVE: "#86efac",
  URGENCY: "#fda4af",
  UNSPECIFIED: "#e2e8f0",
};
