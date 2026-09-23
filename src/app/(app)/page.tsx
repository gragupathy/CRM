import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { buildDashboard } from "@/lib/dashboard";
import { DashboardBoard } from "@/components/dashboard-board";
import { fullName } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();
  const scope = ownerScope(session);

  const [deals, upcoming, followUps] = await Promise.all([
    prisma.deal.findMany({
      where: scope,
      include: { owner: true },
    }),
    prisma.activity.findMany({
      where: { ...scope, completedAt: null, dueAt: { not: null } },
      orderBy: { dueAt: "asc" },
      take: 8,
      include: { owner: true },
    }),
    prisma.leadActivity.findMany({
      where: {
        ...scope,
        occurredAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      },
      orderBy: { occurredAt: "asc" },
      take: 12,
      include: {
        owner: true,
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  const data = buildDashboard(deals);

  return (
    <DashboardBoard
      {...data}
      upcoming={upcoming.map((a) => ({
        id: a.id,
        subject: a.subject,
        type: a.type,
        dueAt: a.dueAt,
        owner: { name: a.owner.name },
      }))}
      followUps={followUps.map((a) => ({
        id: a.id,
        subject: a.subject,
        type: a.type,
        dueAt: a.occurredAt,
        href: `/leads/${a.lead.id}`,
        leadName: fullName(a.lead.firstName, a.lead.lastName),
        owner: { name: a.owner.name },
        reminder: a.reminderOffset,
      }))}
    />
  );
}
