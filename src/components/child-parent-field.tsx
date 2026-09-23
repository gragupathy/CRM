export function ChildParentFields({
  leadId,
  contactId,
}: {
  leadId?: string;
  contactId?: string;
}) {
  if (contactId) return <input type="hidden" name="contactId" value={contactId} />;
  return <input type="hidden" name="leadId" value={leadId ?? ""} />;
}

export function childParentId(leadId?: string, contactId?: string) {
  return contactId ?? leadId ?? "";
}

export function childNoun(contactId?: string) {
  return contactId ? "contact" : "lead";
}
