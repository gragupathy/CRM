import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { Badge, Button, Card, EmptyState, PageHeader, Table } from "@/components/ui";
import { formatDate, fullName, labelFor, cn } from "@/lib/utils";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { completeActivity } from "./actions";
import { dueDateClass } from "@/lib/due-date";
import Link from "next/link";

export default async function ActivitiesPage() {
  const session = await requireSession();
  const activities = await prisma.activity.findMany({
    where: ownerScope(session),
    include: { owner: true, account: true, contact: true, lead: true, deal: true },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  function related(a: (typeof activities)[number]) {
    if (a.deal) return { href: `/deals/${a.deal.id}`, label: a.deal.name };
    if (a.lead)
      return { href: `/leads/${a.lead.id}`, label: fullName(a.lead.firstName, a.lead.lastName) };
    if (a.contact)
      return {
        href: `/contacts/${a.contact.id}`,
        label: fullName(a.contact.firstName, a.contact.lastName),
      };
    if (a.account) return { href: `/accounts/${a.account.id}`, label: a.account.name };
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Activities"
        subtitle="Calls, meetings, tasks, and notes across the pipeline."
        actions={<Button href="/activities/new">Log activity</Button>}
      />
      <Card>
        {activities.length === 0 ? (
          <EmptyState
            title="No activities"
            body="Log a call or task from a lead, deal, or the button above."
            action={<Button href="/activities/new">Log activity</Button>}
          />
        ) : (
          <Table
            titleHeaders
            headers={["Name", "Type", "Related", "Due Date", "Owner", ""]}
          >
            {activities.map((a) => {
              const rel = related(a);
              return (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{a.subject}</td>
                  <td className="px-4 py-3">{labelFor(ACTIVITY_TYPES, a.type)}</td>
                  <td className="px-4 py-3">
                    {rel ? (
                      <Link href={rel.href} className="text-brand-700">
                        {rel.label}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.dueAt ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          dueDateClass(a.dueAt),
                        )}
                      >
                        {formatDate(a.dueAt)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{a.owner.name}</td>
                  <td className="px-4 py-3">
                    {a.completedAt ? (
                      <Badge tone="green">Done</Badge>
                    ) : (
                      <form action={completeActivity.bind(null, a.id)}>
                        <button type="submit" className="text-sm text-brand-700">
                          Complete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
