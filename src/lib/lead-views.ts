export const LEAD_VIEWS = [
  { id: "all", label: "All Leads" },
  { id: "converted", label: "Converted Leads" },
  { id: "junk", label: "Junk Leads" },
  { id: "mailing", label: "Mailing Labels" },
  { id: "my-converted", label: "My Converted Leads" },
  { id: "my", label: "My Leads" },
  { id: "unqualified", label: "Not Qualified Leads" },
  { id: "open", label: "Open Leads" },
  { id: "recent", label: "Recently Created Leads" },
] as const;

export type LeadViewId = (typeof LEAD_VIEWS)[number]["id"];

export const DEFAULT_LEAD_VIEW: LeadViewId = "my";

export function isLeadView(v: string | undefined): v is LeadViewId {
  return !!v && LEAD_VIEWS.some((x) => x.id === v);
}

export function leadViewLabel(id: LeadViewId) {
  return LEAD_VIEWS.find((v) => v.id === id)?.label ?? "My Leads";
}
