import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { Badge, Button, Card, EmptyState, PageHeader, Table } from "@/components/ui";
import { SearchBar } from "@/components/activity-list";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const { q } = await searchParams;
  const accounts = await prisma.account.findMany({
    where: {
      ...ownerScope(session),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { city: { contains: q } },
            ],
          }
        : {}),
    },
    include: { owner: true, _count: { select: { contacts: true, deals: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Companies you sell to."
        actions={<Button href="/accounts/new">New account</Button>}
      />
      <SearchBar placeholder="Search accounts…" />
      <Card>
        {accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            body="Create a company record, or convert a lead."
            action={<Button href="/accounts/new">New account</Button>}
          />
        ) : (
          <Table headers={["Name", "Industry", "City", "Owner", "People", "Deals"]}>
            {accounts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/accounts/${a.id}`} className="font-medium text-ink-900">
                    {a.name}
                  </Link>
                  {a.email ? <p className="text-xs text-slate-500">{a.email}</p> : null}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.industry || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{a.city || "—"}</td>
                <td className="px-4 py-3">{a.owner.name}</td>
                <td className="px-4 py-3">
                  <Badge>{a._count.contacts}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="blue">{a._count.deals}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
