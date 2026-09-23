import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Card, Field, PageHeader, Select, TextInput } from "@/components/ui";
import { CustomFieldInputs } from "@/components/custom-fields";
import { OwnerField } from "@/components/record-fields";
import { FormActions, SubmitButton } from "@/components/forms";
import { updateDeal } from "../../actions";
import { DealStageFields } from "@/components/deal-stage-fields";
import { toDateInput } from "@/lib/utils";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const deal = await prisma.deal.findFirst({ where: { id, ...ownerScope(session) } });
  if (!deal) notFound();
  const [users, fields, accounts, contacts] = await Promise.all([
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
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${deal.name}`} />
      <Card className="p-6">
        <form action={updateDeal.bind(null, deal.id)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deal name">
              <TextInput name="name" required defaultValue={deal.name} />
            </Field>
            <Field label="Amount">
              <TextInput name="amount" type="number" defaultValue={deal.amount} min={0} step="0.01" />
            </Field>
            <Field label="Currency">
              <TextInput name="currency" defaultValue={deal.currency} />
            </Field>
            <DealStageFields defaultStage={deal.stage} defaultLostReason={deal.lostReason} />
            <Field label="Probability %">
              <TextInput
                name="probability"
                type="number"
                defaultValue={deal.probability}
                min={0}
                max={100}
              />
            </Field>
            <Field label="Expected close">
              <TextInput
                name="expectedClose"
                type="date"
                defaultValue={toDateInput(deal.expectedClose)}
              />
            </Field>
            <Field label="Account">
              <Select name="accountId" defaultValue={deal.accountId ?? ""}>
                <option value="">None</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Contact">
              <Select name="contactId" defaultValue={deal.contactId ?? ""}>
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <OwnerField users={users} session={session} defaultOwnerId={deal.ownerId} />
          </div>
          <CustomFieldInputs fields={fields} valuesRaw={deal.customValues} />
          <FormActions cancelHref={`/deals/${deal.id}`}>
            <SubmitButton>Save</SubmitButton>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
