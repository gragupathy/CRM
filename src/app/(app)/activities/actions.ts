"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}

export async function createActivity(formData: FormData) {
  const session = await requireSession();
  const ownerId =
    session.role === "SALES" ? session.userId : str(formData, "ownerId") ?? session.userId;
  await prisma.activity.create({
    data: {
      tenantId: session.tenantId,
      ownerId,
      type: str(formData, "type") ?? "NOTE",
      subject: String(formData.get("subject") ?? "").trim() || "Activity",
      body: str(formData, "body"),
      dueAt: str(formData, "dueAt") ? new Date(String(formData.get("dueAt"))) : null,
      accountId: str(formData, "accountId"),
      contactId: str(formData, "contactId"),
      leadId: str(formData, "leadId"),
      dealId: str(formData, "dealId"),
    },
  });
  revalidatePath("/activities");
  const back = str(formData, "returnTo");
  redirect(back || "/activities");
}

export async function completeActivity(id: string) {
  const session = await requireSession();
  await prisma.activity.updateMany({
    where: { id, ...ownerScope(session) },
    data: { completedAt: new Date() },
  });
  revalidatePath("/activities");
}

export async function deleteActivity(id: string) {
  const session = await requireSession();
  await prisma.activity.deleteMany({ where: { id, ...ownerScope(session) } });
  revalidatePath("/activities");
}
