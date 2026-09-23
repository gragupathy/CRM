import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Card, PageHeader } from "@/components/ui";
import { AccountFields } from "@/components/record-fields";
import { updateAccount } from "../../actions";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!account) notFound();
  const [users, fields] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    getCustomFields(session.tenantId, "ACCOUNT"),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${account.name}`} />
      <Card className="p-6">
        <form action={updateAccount.bind(null, account.id)}>
          <AccountFields
            session={session}
            users={users}
            fields={fields}
            account={account}
            cancelHref={`/accounts/${account.id}`}
          />
        </form>
      </Card>
    </div>
  );
}
