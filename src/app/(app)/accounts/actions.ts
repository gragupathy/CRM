"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { customValuesFromForm, getCustomFields } from "@/lib/custom-fields";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}

export async function createAccount(formData: FormData) {
  const session = await requireSession();
  const fields = await getCustomFields(session.tenantId, "ACCOUNT");
  const ownerId =
    session.role === "SALES" ? session.userId : str(formData, "ownerId") ?? session.userId;
  const account = await prisma.account.create({
    data: {
      tenantId: session.tenantId,
      ownerId,
      name: String(formData.get("name") ?? "").trim() || "Untitled account",
      industry: str(formData, "industry"),
      website: str(formData, "website"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath("/accounts");
  redirect(`/accounts/${account.id}`);
}

export async function updateAccount(id: string, formData: FormData) {
  const session = await requireSession();
  const existing = await prisma.account.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!existing) redirect("/accounts");
  const fields = await getCustomFields(session.tenantId, "ACCOUNT");
  const ownerId =
    session.role === "SALES" ? existing.ownerId : str(formData, "ownerId") ?? existing.ownerId;
  await prisma.account.update({
    where: { id },
    data: {
      ownerId,
      name: String(formData.get("name") ?? "").trim() || existing.name,
      industry: str(formData, "industry"),
      website: str(formData, "website"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath(`/accounts/${id}`);
  redirect(`/accounts/${id}`);
}

export async function deleteAccount(id: string) {
  const session = await requireSession();
  await prisma.account.deleteMany({ where: { id, ...ownerScope(session) } });
  revalidatePath("/accounts");
  redirect("/accounts");
}
