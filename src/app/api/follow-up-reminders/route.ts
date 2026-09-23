import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, ownerScope } from "@/lib/session";
import { fullName } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] }, { status: 401 });

  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const from = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const rows = await prisma.leadActivity.findMany({
    where: {
      ...ownerScope(session),
      remindAt: { not: null, gte: from, lte: soon },
    },
    include: {
      owner: { select: { name: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { remindAt: "asc" },
    take: 40,
  });

  return NextResponse.json({
    items: rows
      .filter((r) => r.lead || r.contact)
      .map((r) => {
        const record = r.lead ?? r.contact!;
        const href = r.lead ? `/leads/${r.lead.id}` : `/contacts/${r.contact!.id}`;
        return {
          id: r.id,
          subject: r.subject,
          type: r.type,
          href,
          leadId: record.id,
          leadName: fullName(record.firstName, record.lastName),
          assignedTo: r.owner.name,
          occurredAt: r.occurredAt,
          remindAt: r.remindAt,
          reminderOffset: r.reminderOffset,
          due: r.remindAt != null && r.remindAt <= now,
        };
      }),
  });
}
