import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CustomFieldValues } from "@/components/custom-fields";
import { ActivityForm } from "@/components/activity-form";
import { ActivityList } from "@/components/activity-list";
import { ConfirmDeleteButton } from "@/components/confirm-delete-dialog";
import { deleteDeal } from "../actions";
import { DEAL_STAGES } from "@/lib/constants";
import { formatDate, labelFor, money } from "@/lib/utils";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const deal = await prisma.deal.findFirst({
    where: { id, ...ownerScope(session) },
    include: {
      owner: true,
      account: true,
      contact: true,
      activities: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!deal) notFound();
  const fields = await getCustomFields(session.tenantId, "DEAL");
  const tone =
    deal.stage === "WON" ? "green" : deal.stage === "LOST" ? "red" : "blue";

  return (
    <div>
      <PageHeader
        title={deal.name}
        subtitle={money(deal.amount, deal.currency)}
        actions={
          <>
            <Button href={`/deals/${deal.id}/edit`} variant="secondary">
              Edit
            </Button>
            <ConfirmDeleteButton
              action={deleteDeal.bind(null, deal.id)}
              title="Delete deal?"
              message={`${deal.name} will be removed.`}
            >
              Delete
            </ConfirmDeleteButton>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Badge tone={tone}>{labelFor(DEAL_STAGES, deal.stage)}</Badge>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-slate-400">Probability</dt>
              <dd>{deal.probability}%</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Expected close</dt>
              <dd>{formatDate(deal.expectedClose)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Account</dt>
              <dd>
                {deal.account ? (
                  <Link href={`/accounts/${deal.account.id}`} className="text-brand-700">
                    {deal.account.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Contact</dt>
              <dd>
                {deal.contact ? (
                  <Link href={`/contacts/${deal.contact.id}`} className="text-brand-700">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Owner</dt>
              <dd>{deal.owner.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Weighted value</dt>
              <dd>{money(deal.amount * (deal.probability / 100), deal.currency)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <CustomFieldValues fields={fields} valuesRaw={deal.customValues} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Log activity</h2>
          <ActivityForm
            dealId={deal.id}
            accountId={deal.accountId ?? undefined}
            contactId={deal.contactId ?? undefined}
            returnTo={`/deals/${deal.id}`}
          />
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-semibold">Activity</h2>
        <ActivityList items={deal.activities} />
      </Card>
    </div>
  );
}
