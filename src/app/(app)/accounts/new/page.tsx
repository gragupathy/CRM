import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Card, PageHeader } from "@/components/ui";
import { AccountFields } from "@/components/record-fields";
import { createAccount } from "../actions";

export default async function NewAccountPage() {
  const session = await requireSession();
  const [users, fields] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    getCustomFields(session.tenantId, "ACCOUNT"),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="New account" subtitle="Add a company." />
      <Card className="p-6">
        <form action={createAccount}>
          <AccountFields session={session} users={users} fields={fields} cancelHref="/accounts" />
        </form>
      </Card>
    </div>
  );
}
