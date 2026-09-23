import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { Card, Field, PageHeader, Select, TextArea, TextInput } from "@/components/ui";
import { FormActions, SubmitButton } from "@/components/forms";
import { createActivity } from "../actions";
import { ACTIVITY_TYPES } from "@/lib/constants";

export default async function NewActivityPage() {
  const session = await requireSession();
  const [accounts, contacts, leads, deals] = await Promise.all([
    prisma.account.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { lastName: "asc" },
    }),
    prisma.lead.findMany({
      where: { tenantId: session.tenantId, status: { not: "CONVERTED" } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deal.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Log activity" />
      <Card className="p-6">
        <form action={createActivity} className="space-y-4">
          <input type="hidden" name="returnTo" value="/activities" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select name="type" defaultValue="TASK">
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
            <Field label="Subject">
              <TextInput name="subject" required className="sm:col-span-2" />
            </Field>
            <Field label="Account">
              <Select name="accountId" defaultValue="">
                <option value="">None</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Contact">
              <Select name="contactId" defaultValue="">
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Lead">
              <Select name="leadId" defaultValue="">
                <option value="">None</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.firstName} {l.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Deal">
              <Select name="dealId" defaultValue="">
                <option value="">None</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <TextArea name="body" />
          </Field>
          <FormActions cancelHref="/activities">
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
