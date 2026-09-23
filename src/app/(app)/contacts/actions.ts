"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { customValuesFromForm, getCustomFields } from "@/lib/custom-fields";
import { validateContactFields } from "@/lib/lead-validation";
import type { ContactFormState } from "@/lib/lead-validation";
import { titleCase } from "@/lib/utils";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}

function titled(form: FormData, key: string) {
  const v = str(form, key);
  return v ? titleCase(v) : null;
}

function contactPayload(form: FormData) {
  const mobile = str(form, "mobile");
  const firstName = titleCase(String(form.get("firstName") ?? "").trim());
  return {
    firstName: firstName || "Unknown",
    lastName: titleCase(String(form.get("lastName") ?? "").trim()),
    title: titled(form, "jobTitle"),
    email: str(form, "email"),
    mobile,
    phone: mobile,
    addressLine1: titled(form, "addressLine1"),
    addressLine2: titled(form, "addressLine2"),
    city: titled(form, "city"),
    state: str(form, "state"),
    country: str(form, "country") ?? "India",
    postalCode: str(form, "postalCode"),
    accountId: str(form, "accountId"),
  };
}

async function resolveOwnerId(tenantId: string, requested: string | null, fallback: string) {
  if (!requested) return fallback;
  const user = await prisma.user.findFirst({
    where: { id: requested, tenantId, isActive: true },
    select: { id: true },
  });
  return user?.id ?? fallback;
}

async function resolveAccountId(tenantId: string, accountId: string | null) {
  if (!accountId) return null;
  const account = await prisma.account.findFirst({
    where: { id: accountId, tenantId },
    select: { id: true },
  });
  return account?.id ?? null;
}

export async function createContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requireSession();
  const payload = contactPayload(formData);
  const error = validateContactFields(payload);
  if (error) return { error };
  const fields = await getCustomFields(session.tenantId, "CONTACT");
  const ownerId = await resolveOwnerId(session.tenantId, str(formData, "ownerId"), session.userId);
  const accountId = await resolveAccountId(session.tenantId, payload.accountId);
  const contact = await prisma.contact.create({
    data: {
      tenantId: session.tenantId,
      ownerId,
      createdById: session.userId,
      modifiedById: session.userId,
      ...payload,
      accountId,
      mobile: payload.mobile!,
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath("/contacts");
  return { saved: true, contactId: contact.id };
}

export async function updateContact(
  id: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requireSession();
  const existing = await prisma.contact.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!existing) redirect("/contacts");
  const payload = contactPayload(formData);
  const error = validateContactFields(payload);
  if (error) return { error };
  const fields = await getCustomFields(session.tenantId, "CONTACT");
  const ownerId = await resolveOwnerId(session.tenantId, str(formData, "ownerId"), existing.ownerId);
  const accountId = await resolveAccountId(session.tenantId, payload.accountId);
  await prisma.contact.update({
    where: { id },
    data: {
      ...payload,
      ownerId,
      accountId,
      mobile: payload.mobile!,
      modifiedById: session.userId,
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { saved: true, contactId: id };
}

export async function deleteContact(id: string) {
  const session = await requireSession();
  await prisma.contact.deleteMany({ where: { id, ...ownerScope(session) } });
  revalidatePath("/contacts");
  redirect("/contacts");
}
