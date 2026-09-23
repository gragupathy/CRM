"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { customValuesFromForm, getCustomFields } from "@/lib/custom-fields";
import {
  DEAL_STAGES,
  canChangeLeadStatus,
  canConvertLead,
  normalizeIndustry,
  normalizeLeadStatus,
} from "@/lib/constants";
import { nextLeadNo } from "@/lib/leads";
import { convertLeadFieldErrors, validateLeadFields } from "@/lib/lead-validation";
import type { LeadFormState } from "@/lib/lead-validation";
import { titleCase } from "@/lib/utils";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}

function num(form: FormData, key: string, fallback = 0) {
  const n = Number(form.get(key));
  return Number.isFinite(n) ? n : fallback;
}

function titled(form: FormData, key: string) {
  const v = str(form, key);
  return v ? titleCase(v) : null;
}

function leadPayload(form: FormData) {
  const mobile = str(form, "mobile");
  const firstName = titleCase(String(form.get("firstName") ?? "").trim());
  return {
    leadType: str(form, "leadType"),
    firstName: firstName || "Unknown",
    lastName: titleCase(String(form.get("lastName") ?? "").trim()),
    jobTitle: titled(form, "jobTitle"),
    company: titled(form, "company"),
    industry: normalizeIndustry(str(form, "industry")) || null,
    email: str(form, "email"),
    mobile,
    phone: mobile,
    website: str(form, "website"),
    addressLine1: titled(form, "addressLine1"),
    addressLine2: titled(form, "addressLine2"),
    city: titled(form, "city"),
    state: str(form, "state"),
    country: str(form, "country") ?? "India",
    postalCode: str(form, "postalCode"),
    source: str(form, "source"),
    status: normalizeLeadStatus(str(form, "status")),
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

function fieldError(payload: ReturnType<typeof leadPayload>) {
  return validateLeadFields({
    source: payload.source,
    leadType: payload.leadType,
    email: payload.email,
    mobile: payload.mobile,
    website: payload.website,
    postalCode: payload.postalCode,
    state: payload.state,
    status: payload.status,
  });
}

export async function createLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const session = await requireSession();
  const payload = leadPayload(formData);
  const error = fieldError(payload);
  if (error) return { error };
  if (!canChangeLeadStatus("NEW", payload.status)) {
    return { error: "This lead status is not allowed." };
  }
  const fields = await getCustomFields(session.tenantId, "LEAD");
  const ownerId = await resolveOwnerId(session.tenantId, str(formData, "ownerId"), session.userId);
  const lead = await prisma.lead.create({
    data: {
      tenantId: session.tenantId,
      ownerId,
      createdById: session.userId,
      modifiedById: session.userId,
      leadNo: await nextLeadNo(session.tenantId),
      ...payload,
      leadType: payload.leadType!,
      source: payload.source!,
      mobile: payload.mobile!,
      customValues: customValuesFromForm(formData, fields),
    },
  });
  revalidatePath("/leads");
  if (String(formData.get("intent") ?? "save") === "saveAndNew") {
    redirect(`/leads/new?from=${lead.id}`);
  }
  return { saved: true, leadId: lead.id };
}

export async function updateLead(
  id: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const session = await requireSession();
  const existing = await prisma.lead.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!existing) redirect("/leads");
  const payload = leadPayload(formData);
  const error = fieldError(payload);
  if (error) return { error };
  if (!canChangeLeadStatus(existing.status, payload.status)) {
    return { error: "This status change is not allowed." };
  }
  const fields = await getCustomFields(session.tenantId, "LEAD");
  const ownerId = await resolveOwnerId(session.tenantId, str(formData, "ownerId"), existing.ownerId);
  const data = {
    ...payload,
    ownerId,
    leadType: payload.leadType!,
    source: payload.source!,
    mobile: payload.mobile!,
    status: existing.status === "CONVERTED" ? "CONVERTED" : payload.status,
    modifiedById: session.userId,
    customValues: customValuesFromForm(formData, fields),
  };
  if (ownerId !== existing.ownerId) {
    await prisma.$transaction([
      prisma.lead.update({ where: { id }, data }),
      prisma.leadActivity.updateMany({
        where: { leadId: id, tenantId: session.tenantId },
        data: { ownerId },
      }),
      prisma.leadTask.updateMany({
        where: { leadId: id, tenantId: session.tenantId },
        data: { ownerId },
      }),
      prisma.leadNote.updateMany({
        where: { leadId: id, tenantId: session.tenantId },
        data: { ownerId },
      }),
      prisma.leadAttachment.updateMany({
        where: { leadId: id, tenantId: session.tenantId },
        data: { ownerId },
      }),
      prisma.activity.updateMany({
        where: { leadId: id, tenantId: session.tenantId },
        data: { ownerId },
      }),
    ]);
  } else {
    await prisma.lead.update({ where: { id }, data });
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  if (String(formData.get("intent") ?? "save") === "saveAndNew") {
    redirect(`/leads/new?from=${id}`);
  }
  return { saved: true, leadId: id };
}

export async function deleteLead(id: string) {
  const session = await requireSession();
  await prisma.lead.deleteMany({ where: { id, ...ownerScope(session) } });
  revalidatePath("/leads");
  redirect("/leads");
}

export async function convertLead(
  id: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const session = await requireSession();
  const lead = await prisma.lead.findFirst({
    where: { id, ...ownerScope(session) },
  });
  if (!lead || lead.status === "CONVERTED") redirect("/leads");
  if (!canConvertLead(lead.status)) {
    return { error: "Lead must be Qualified before conversion." };
  }
  const fieldError = convertLeadFieldErrors(lead);
  if (fieldError) return { error: fieldError };

  const accountName =
    str(formData, "accountName") || lead.company || `${lead.firstName} ${lead.lastName}`.trim();
  const createDeal = formData.get("createDeal") === "on";
  const phone = lead.mobile || lead.phone;

  const account = await prisma.account.create({
    data: {
      tenantId: session.tenantId,
      ownerId: lead.ownerId,
      name: accountName,
      email: lead.email,
      phone,
      website: lead.website,
      industry: lead.industry,
      address: [lead.addressLine1, lead.addressLine2].filter(Boolean).join(", ") || null,
      city: lead.city,
    },
  });

  const contact = await prisma.contact.create({
    data: {
      tenantId: session.tenantId,
      ownerId: lead.ownerId,
      createdById: session.userId,
      modifiedById: session.userId,
      accountId: account.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone,
      mobile: lead.mobile || phone,
      title: lead.jobTitle,
      addressLine1: lead.addressLine1,
      addressLine2: lead.addressLine2,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      postalCode: lead.postalCode,
    },
  });

  let dealId: string | null = null;
  if (createDeal) {
    const stage = str(formData, "dealStage") ?? "QUALIFICATION";
    const probability = DEAL_STAGES.find((s) => s.value === stage)?.probability ?? 10;
    const deal = await prisma.deal.create({
      data: {
        tenantId: session.tenantId,
        ownerId: lead.ownerId,
        accountId: account.id,
        contactId: contact.id,
        name: str(formData, "dealName") || `${accountName} opportunity`,
        amount: num(formData, "amount"),
        stage,
        probability,
      },
    });
    dealId = deal.id;
  }

  await prisma.lead.update({
    where: { id },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      convertedAccountId: account.id,
      convertedContactId: contact.id,
      convertedDealId: dealId,
      modifiedById: session.userId,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/accounts");
  revalidatePath("/contacts");
  revalidatePath("/deals");
  redirect(`/accounts/${account.id}`);
}
