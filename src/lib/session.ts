import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionUser } from "./auth";
import type { Role } from "./constants";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect("/");
  }
  return session;
}

export function ownerScope(session: SessionUser) {
  if (session.role === "SALES") {
    return { tenantId: session.tenantId, ownerId: session.userId };
  }
  return { tenantId: session.tenantId };
}

export function canManageUsers(session: SessionUser) {
  return session.role === "ADMIN";
}

export function canSeeAllRecords(session: SessionUser) {
  return session.role === "ADMIN" || session.role === "MANAGER";
}
