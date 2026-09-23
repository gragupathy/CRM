import { ACTIVITY_TYPES } from "@/lib/constants";
import { Field, Select, TextArea, TextInput } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { createActivity } from "@/app/(app)/activities/actions";

export function ActivityForm({
  accountId,
  contactId,
  leadId,
  dealId,
  returnTo,
}: {
  accountId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  returnTo: string;
}) {
  return (
    <form action={createActivity} className="space-y-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      {accountId ? <input type="hidden" name="accountId" value={accountId} /> : null}
      {contactId ? <input type="hidden" name="contactId" value={contactId} /> : null}
      {leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}
      {dealId ? <input type="hidden" name="dealId" value={dealId} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select name="type" defaultValue="CALL">
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due">
          <TextInput name="dueAt" type="date" />
        </Field>
      </div>
      <Field label="Subject">
        <TextInput name="subject" required placeholder="Follow-up call" />
      </Field>
      <Field label="Notes">
        <TextArea name="body" />
      </Field>
      <SubmitButton pendingLabel="Logging…">Log activity</SubmitButton>
    </form>
  );
}
