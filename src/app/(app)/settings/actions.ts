"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ROLES, OBJECT_TYPES, FIELD_TYPES } from "@/lib/constants";
import { fieldNameToKey } from "@/lib/custom-fields";
import { parseEmail } from "@/lib/email";
import { appUrl, issueToken } from "@/lib/tokens";
import { sendInviteEmail } from "@/lib/mail";
import crypto from "crypto";

export async function createUser(formData: FormData) {
  const session = await requireRole(["ADMIN"]);
  const parsed = parseEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "SALES");
  if ("error" in parsed || !name || !ROLES.includes(role as (typeof ROLES)[number])) {
    redirect("/settings/users?error=invalid");
  }
  const exists = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: session.tenantId, email: parsed.email } },
  });
  if (exists) redirect("/settings/users?error=exists");
  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId,
      email: parsed.email,
      name,
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      role,
      emailVerifiedAt: null,
    },
  });
  const raw = await issueToken(user.id, "INVITE", 48);
  await sendInviteEmail(user.email, user.name, `${appUrl()}/invite?token=${raw}`);
  revalidatePath("/settings/users");
  redirect("/settings/users?invited=1");
}

export async function resendInvite(id: string) {
  const session = await requireRole(["ADMIN"]);
  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!user || user.emailVerifiedAt) {
    redirect("/settings/users");
  }
  const raw = await issueToken(user.id, "INVITE", 48);
  await sendInviteEmail(user.email, user.name, `${appUrl()}/invite?token=${raw}`);
  revalidatePath("/settings/users");
  redirect("/settings/users?invited=1");
}

export async function updateUserRole(id: string, formData: FormData) {
  const session = await requireRole(["ADMIN"]);
  const role = String(formData.get("role") ?? "");
  const isActive = formData.get("isActive") === "on";
  if (!ROLES.includes(role as (typeof ROLES)[number])) return;
  if (id === session.userId) {
    await prisma.user.update({
      where: { id },
      data: { role: "ADMIN", isActive: true },
    });
  } else {
    await prisma.user.updateMany({
      where: { id, tenantId: session.tenantId },
      data: { role, isActive },
    });
  }
  revalidatePath("/settings/users");
}

export async function createCustomField(formData: FormData) {
  const session = await requireRole(["ADMIN"]);
  const objectType = String(formData.get("objectType") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const fieldType = String(formData.get("fieldType") ?? "TEXT");
  const options = String(formData.get("options") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !OBJECT_TYPES.includes(objectType as (typeof OBJECT_TYPES)[number]) ||
    !label ||
    !FIELD_TYPES.includes(fieldType as (typeof FIELD_TYPES)[number])
  ) {
    redirect("/settings/fields?error=invalid");
  }
  const key = fieldNameToKey(label);
  const last = await prisma.customField.findFirst({
    where: { tenantId: session.tenantId, objectType },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.customField.create({
    data: {
      tenantId: session.tenantId,
      objectType,
      key: key || `field_${Date.now()}`,
      label,
      fieldType,
      options: JSON.stringify(options),
      required: formData.get("required") === "on",
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/settings/fields");
  redirect("/settings/fields");
}

export async function deleteCustomField(id: string) {
  const session = await requireRole(["ADMIN"]);
  await prisma.customField.deleteMany({ where: { id, tenantId: session.tenantId } });
  revalidatePath("/settings/fields");
}
