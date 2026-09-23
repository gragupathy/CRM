import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Card, Field, PageHeader, Select, TextInput } from "@/components/ui";
import { CustomFieldInputs } from "@/components/custom-fields";
import { OwnerField } from "@/components/record-fields";
import { FormActions, SubmitButton } from "@/components/forms";
import { createDeal } from "../actions";
import { DealStageFields } from "@/components/deal-stage-fields";
import { fullName } from "@/lib/utils";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
    contactId?: string;
    name?: string;
    returnTo?: string;
  }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const [users, fields, accounts, contacts, linkedContact] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    getCustomFields(session.tenantId, "DEAL"),
    prisma.account.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { lastName: "asc" },
    }),
    sp.contactId
      ? prisma.contact.findFirst({
          where: { id: sp.contactId, tenantId: session.tenantId },
          select: { id: true, firstName: true, lastName: true, accountId: true, ownerId: true },
        })
      : Promise.resolve(null),
  ]);

  const contactId = linkedContact?.id ?? sp.contactId ?? "";
  const accountId = sp.accountId || linkedContact?.accountId || "";
  const dealName =
    sp.name?.trim() ||
    (linkedContact ? fullName(linkedContact.firstName, linkedContact.lastName) : "");
  const cancelHref = sp.returnTo?.startsWith("/") ? sp.returnTo : "/deals";

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Deal" subtitle="Opportunity" />
      <Card className="p-6">
        <form action={createDeal} className="space-y-4">
          {sp.returnTo?.startsWith("/") ? (
            <input type="hidden" name="returnTo" value={sp.returnTo} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deal name">
              <TextInput name="name" required defaultValue={dealName} />
            </Field>
            <Field label="Amount">
              <TextInput name="amount" type="number" defaultValue={0} min={0} step="0.01" />
            </Field>
            <Field label="Currency">
              <TextInput name="currency" defaultValue="INR" />
            </Field>
            <Field label="Probability %">
              <TextInput name="probability" type="number" defaultValue={10} min={0} max={100} />
            </Field>
            <DealStageFields />
            <Field label="Expected close">
              <TextInput name="expectedClose" type="date" />
            </Field>
            <Field label="Account">
              <Select name="accountId" defaultValue={accountId}>
                <option value="">None</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Contact">
              <Select name="contactId" defaultValue={contactId}>
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <OwnerField
              users={users}
              session={session}
              defaultOwnerId={linkedContact?.ownerId ?? session.userId}
            />
          </div>
          <CustomFieldInputs fields={fields} />
          <FormActions cancelHref={cancelHref}>
            <SubmitButton>Save</SubmitButton>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
