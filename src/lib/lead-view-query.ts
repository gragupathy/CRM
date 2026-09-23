import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { ownerScope } from "@/lib/session";
import type { LeadViewId } from "@/lib/lead-views";

export function leadViewWhere(view: LeadViewId, session: SessionUser): Prisma.LeadWhereInput {
  const scope = ownerScope(session);
  const mine: Prisma.LeadWhereInput = { tenantId: session.tenantId, ownerId: session.userId };
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  switch (view) {
    case "all":
      return scope;
    case "my":
      return mine;
    case "converted":
      return { ...scope, status: "CONVERTED" };
    case "my-converted":
      return { ...mine, status: "CONVERTED" };
    case "junk":
      return { ...scope, status: { in: ["JUNK", "LOST"] } };
    case "unqualified":
      return { ...scope, status: "UNQUALIFIED" };
    case "open":
      return { ...scope, status: { notIn: ["CONVERTED", "JUNK", "LOST"] } };
    case "mailing":
      return { ...scope, email: { not: null } };
    case "recent":
      return { ...scope, createdAt: { gte: weekAgo } };
    default:
      return mine;
  }
}
