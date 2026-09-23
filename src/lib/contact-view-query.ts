import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { ownerScope } from "@/lib/session";
import type { ContactViewId } from "@/lib/contact-views";

export function contactViewWhere(view: ContactViewId, session: SessionUser): Prisma.ContactWhereInput {
  const scope = ownerScope(session);
  const mine: Prisma.ContactWhereInput = { tenantId: session.tenantId, ownerId: session.userId };
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  switch (view) {
    case "all":
      return scope;
    case "my":
      return mine;
    case "mailing":
      return { ...scope, email: { not: null } };
    case "recent":
      return { ...scope, createdAt: { gte: weekAgo } };
    case "unlinked":
      return { ...scope, accountId: null };
    case "with-account":
      return { ...scope, accountId: { not: null } };
    default:
      return mine;
  }
}
