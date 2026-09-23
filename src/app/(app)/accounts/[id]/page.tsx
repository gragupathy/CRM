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
import { deleteAccount } from "../actions";
import { fullName, money } from "@/lib/utils";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, ...ownerScope(session) },
    include: {
      owner: true,
      contacts: { orderBy: { lastName: "asc" } },
      deals: { orderBy: { updatedAt: "desc" } },
      activities: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!account) notFound();
  const fields = await getCustomFields(session.tenantId, "ACCOUNT");

  return (
    <div>
      <PageHeader
        title={account.name}
        subtitle={account.industry || "Account"}
        actions={
          <>
            <Button href={`/accounts/${account.id}/edit`} variant="secondary">
              Edit
            </Button>
            <ConfirmDeleteButton
              action={deleteAccount.bind(null, account.id)}
              title="Delete account?"
              message={`${account.name} will be removed. Related contacts and deals stay.`}
            >
              Delete
            </ConfirmDeleteButton>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-slate-400">Owner</dt>
              <dd>{account.owner.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Email</dt>
              <dd>{account.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Phone</dt>
              <dd>{account.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Website</dt>
              <dd>{account.website || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">City</dt>
              <dd>{account.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Address</dt>
              <dd>{account.address || "—"}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <CustomFieldValues fields={fields} valuesRaw={account.customValues} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Log activity</h2>
          <ActivityForm accountId={account.id} returnTo={`/accounts/${account.id}`} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Contacts</h2>
            <Button href={`/contacts/new?accountId=${account.id}`} variant="ghost">
              Add
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {account.contacts.map((c) => (
              <li key={c.id}>
                <Link href={`/contacts/${c.id}`} className="text-brand-700">
                  {fullName(c.firstName, c.lastName)}
                </Link>
                <span className="text-slate-500"> {c.title || ""}</span>
              </li>
            ))}
            {account.contacts.length === 0 ? (
              <li className="text-slate-500">None yet.</li>
            ) : null}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Deals</h2>
            <Button href={`/deals/new?accountId=${account.id}`} variant="ghost">
              Add
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {account.deals.map((d) => (
              <li key={d.id} className="flex justify-between">
                <Link href={`/deals/${d.id}`} className="text-brand-700">
                  {d.name}
                </Link>
                <span>
                  {money(d.amount, d.currency)} <Badge>{d.stage}</Badge>
                </span>
              </li>
            ))}
            {account.deals.length === 0 ? (
              <li className="text-slate-500">None yet.</li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-semibold">Activity</h2>
        <ActivityList items={account.activities} />
      </Card>
    </div>
  );
}
