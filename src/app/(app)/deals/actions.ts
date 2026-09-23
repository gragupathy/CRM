"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { customValuesFromForm, getCustomFields } from "@/lib/custom-fields";
import { DEAL_STAGES } from "@/lib/constants";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}

function num(form: FormData, key: string, fallback = 0) {
  const n = Number(form.get(key));
  return Number.isFinite(n) ? n : fallback;
}

function closePatch(stage: string, existingClosedAt: Date | null, lostReason: string | null) {
  if (stage === "WON") {
    return { closedAt: existingClosedAt ?? new Date(), lostReason: null as string | null };
  }
  if (stage === "LOST") {
    return {
      closedAt: existingClosedAt ?? new Date(),
      lostReason: lostReason || "UNSPECIFIED",
    };
  }
  return { closedAt: null as Date | null, lostReason: null as string | null };
}

function probabilityFor(stage: string, explicit?: number) {
  if (explicit !== undefined && Number.isFinite(explicit)) return explicit;
  return DEAL_STAGES.find((s) => s.value === stage)?.probability ?? 10;
}

export async function createDeal(formData: FormData) {
  const session = await requireSession();
  const fields = await getCustomFields(session.tenantId, "DEAL");
  const ownerId =
    session.role === "SALES" ? session.userId : str(formData, "ownerId") ?? session.userId;
  const stage = str(formData, "stage") ?? "QUALIFICATION";
  const deal = await prisma.deal.create({
    data: {
      tenantId: session.tenantId,
      ownerId,
      accountId: str(formData, "accountId"),
      contactId: str(formData, "contactId"),
      name: String(formData.get("name") ?? "").trim() || "New opportunity",
      amount: num(formData, "amount"),
      currency: str(formData, "currency") ?? "INR",
      stage,
      probability: probabilityFor(stage, num(formData, "probability", NaN)),
      expectedClose: str(formData, "expectedClose")
        ? new Date(String(formData.get("expectedClose")))
        : null,
      ...closePatch(stage, null, str(formData, "lostReason")),
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath("/deals");
  const contactId = str(formData, "contactId");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
  redirect(`/deals/${deal.id}`);
}

export async function updateDeal(id: string, formData: FormData) {
  const session = await requireSession();
  const existing = await prisma.deal.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!existing) redirect("/deals");
  const fields = await getCustomFields(session.tenantId, "DEAL");
  const stage = str(formData, "stage") ?? existing.stage;
  await prisma.deal.update({
    where: { id },
    data: {
      ownerId:
        session.role === "SALES" ? existing.ownerId : str(formData, "ownerId") ?? existing.ownerId,
      accountId: str(formData, "accountId"),
      contactId: str(formData, "contactId"),
      name: String(formData.get("name") ?? "").trim() || existing.name,
      amount: num(formData, "amount", existing.amount),
      currency: str(formData, "currency") ?? existing.currency,
      stage,
      probability: probabilityFor(stage, num(formData, "probability", NaN)),
      expectedClose: str(formData, "expectedClose")
        ? new Date(String(formData.get("expectedClose")))
        : null,
      ...closePatch(
        stage,
        stage === existing.stage ? existing.closedAt : null,
        str(formData, "lostReason"),
      ),
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath(`/deals/${id}`);
  revalidatePath("/deals");
  if (existing.contactId) revalidatePath(`/contacts/${existing.contactId}`);
  redirect(`/deals/${id}`);
}

export async function moveDealStage(id: string, formData: FormData) {
  const session = await requireSession();
  const existing = await prisma.deal.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!existing) return;
  const stage = str(formData, "stage") ?? existing.stage;
  await prisma.deal.update({
    where: { id },
    data: {
      stage,
      probability: probabilityFor(stage),
      ...closePatch(stage, stage === existing.stage ? existing.closedAt : null, existing.lostReason),
    },
  });
  revalidatePath("/deals");
}

export async function deleteDeal(id: string) {
  const session = await requireSession();
  await prisma.deal.deleteMany({ where: { id, ...ownerScope(session) } });
  revalidatePath("/deals");
  redirect("/deals");
}
