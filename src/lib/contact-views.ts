export const CONTACT_VIEWS = [
  { id: "all", label: "All Contacts" },
  { id: "with-account", label: "Contacts with Account" },
  { id: "mailing", label: "Mailing Labels" },
  { id: "my", label: "My Contacts" },
  { id: "recent", label: "Recently Created Contacts" },
  { id: "unlinked", label: "Unlinked Contacts" },
] as const;

export type ContactViewId = (typeof CONTACT_VIEWS)[number]["id"];

export const DEFAULT_CONTACT_VIEW: ContactViewId = "my";

export function isContactView(v: string | undefined): v is ContactViewId {
  return !!v && CONTACT_VIEWS.some((x) => x.id === v);
}

export function contactViewLabel(id: ContactViewId) {
  return CONTACT_VIEWS.find((v) => v.id === id)?.label ?? "My Contacts";
}
