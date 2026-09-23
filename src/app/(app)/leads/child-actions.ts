"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import type { SessionUser } from "@/lib/auth";
import { computeRemindAt } from "@/lib/follow-up";
import { titleCase } from "@/lib/utils";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}

type Parent = { kind: "lead" | "contact"; id: string };

function parentFromForm(form: FormData): Parent | null {
  const leadId = str(form, "leadId");
  const contactId = str(form, "contactId");
  if (leadId) return { kind: "lead", id: leadId };
  if (contactId) return { kind: "contact", id: contactId };
  return null;
}

function parentFromIds(parentId: string, kindHint?: "lead" | "contact"): Parent {
  return { kind: kindHint ?? "lead", id: parentId };
}

async function requireOwnedParent(parent: Parent) {
  const session = await requireSession();
  if (parent.kind === "lead") {
    const lead = await prisma.lead.findFirst({
      where: { id: parent.id, ...ownerScope(session) },
      select: { id: true },
    });
    if (!lead) throw new Error("Lead not found.");
  } else {
    const contact = await prisma.contact.findFirst({
      where: { id: parent.id, ...ownerScope(session) },
      select: { id: true },
    });
    if (!contact) throw new Error("Contact not found.");
  }
  return session;
}

function refresh(parent: Parent) {
  revalidatePath(parent.kind === "lead" ? `/leads/${parent.id}` : `/contacts/${parent.id}`);
  revalidatePath("/");
}

function activityWhere(session: SessionUser, parent: Parent, id?: string) {
  return parent.kind === "lead"
    ? { id, tenantId: session.tenantId, leadId: parent.id, lead: ownerScope(session) }
    : { id, tenantId: session.tenantId, contactId: parent.id, contact: ownerScope(session) };
}

function noteWhere(session: SessionUser, parent: Parent, id?: string) {
  return parent.kind === "lead"
    ? { id, tenantId: session.tenantId, leadId: parent.id, lead: ownerScope(session) }
    : { id, tenantId: session.tenantId, contactId: parent.id, contact: ownerScope(session) };
}

function attachmentWhere(session: SessionUser, parent: Parent, id?: string) {
  return parent.kind === "lead"
    ? { id, tenantId: session.tenantId, leadId: parent.id, lead: ownerScope(session) }
    : { id, tenantId: session.tenantId, contactId: parent.id, contact: ownerScope(session) };
}

function parentFields(parent: Parent) {
  return parent.kind === "lead"
    ? { leadId: parent.id, contactId: null as string | null }
    : { contactId: parent.id, leadId: null as string | null };
}

async function resolveParentByRow(
  parentId: string,
  lookup: (kind: "lead" | "contact") => Promise<{ id: string } | null>,
): Promise<Parent | null> {
  const asLead = await lookup("lead");
  if (asLead) return { kind: "lead", id: parentId };
  const asContact = await lookup("contact");
  if (asContact) return { kind: "contact", id: parentId };
  return null;
}

function parseWhen(formData: FormData, dateKey: string, timeKey: string, fallback?: Date) {
  const date = str(formData, dateKey);
  const time = str(formData, timeKey) ?? "09:00";
  if (date) return new Date(`${date}T${time}`);
  return fallback ?? new Date();
}

export async function createLeadActivity(formData: FormData) {
  const parent = parentFromForm(formData);
  if (!parent) return;
  const session = await requireOwnedParent(parent);
  const type = str(formData, "type") ?? "CALL";
  const occurredAt = parseWhen(formData, "date", "time");
  const endedAt = type === "MEETING" ? parseWhen(formData, "endDate", "endTime", occurredAt) : null;
  const venue = type === "MEETING" ? str(formData, "venue") : null;
  const rawSubject = str(formData, "subject") || (type === "MEETING" ? "New Meeting" : "Follow-up");
  const subject = type === "MEETING" ? titleCase(rawSubject) : rawSubject;
  const reminderOffset = str(formData, "reminderOffset") ?? "NONE";
  const remindAt = computeRemindAt(occurredAt, reminderOffset);
  await prisma.leadActivity.create({
    data: {
      tenantId: session.tenantId,
      ...parentFields(parent),
      ownerId: session.userId,
      type,
      subject,
      body: str(formData, "body"),
      occurredAt,
      endedAt,
      venue,
      reminderOffset,
      remindAt,
    },
  });
  refresh(parent);
}

export async function updateLeadActivity(formData: FormData) {
  const parent = parentFromForm(formData);
  const id = str(formData, "id");
  if (!parent || !id) return;
  const session = await requireOwnedParent(parent);
  const type = str(formData, "type") ?? "CALL";
  const occurredAt = parseWhen(formData, "date", "time");
  const endedAt = type === "MEETING" ? parseWhen(formData, "endDate", "endTime", occurredAt) : null;
  const venue = type === "MEETING" ? str(formData, "venue") : null;
  const rawSubject = str(formData, "subject") || (type === "MEETING" ? "New Meeting" : "Follow-up");
  const subject = type === "MEETING" ? titleCase(rawSubject) : rawSubject;
  const reminderOffset = str(formData, "reminderOffset") ?? "NONE";
  await prisma.leadActivity.updateMany({
    where: activityWhere(session, parent, id),
    data: {
      type,
      subject,
      body: str(formData, "body"),
      occurredAt,
      endedAt,
      venue,
      reminderOffset,
      remindAt: computeRemindAt(occurredAt, reminderOffset),
    },
  });
  refresh(parent);
}

export async function deleteLeadActivity(id: string, parentId: string) {
  const session = await requireSession();
  const parent =
    (await resolveParentByRow(parentId, async (kind) =>
      prisma.leadActivity.findFirst({
        where: activityWhere(session, { kind, id: parentId }, id),
        select: { id: true },
      }),
    )) ?? parentFromIds(parentId);
  await prisma.leadActivity.deleteMany({
    where: activityWhere(session, parent, id),
  });
  refresh(parent);
}

export async function createLeadTask(formData: FormData) {
  const leadId = str(formData, "leadId");
  if (!leadId) return;
  const session = await requireOwnedParent({ kind: "lead", id: leadId });
  const due = str(formData, "dueAt");
  await prisma.leadTask.create({
    data: {
      tenantId: session.tenantId,
      leadId,
      ownerId: session.userId,
      title: str(formData, "title") || "Task",
      description: str(formData, "description"),
      status: str(formData, "status") ?? "OPEN",
      priority: str(formData, "priority") ?? "NORMAL",
      dueAt: due ? new Date(due) : null,
    },
  });
  refresh({ kind: "lead", id: leadId });
}

export async function completeLeadTask(id: string, leadId: string) {
  const session = await requireSession();
  await prisma.leadTask.updateMany({
    where: { id, tenantId: session.tenantId, lead: ownerScope(session) },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  refresh({ kind: "lead", id: leadId });
}

export async function deleteLeadTask(id: string, leadId: string) {
  const session = await requireSession();
  await prisma.leadTask.deleteMany({
    where: { id, tenantId: session.tenantId, lead: ownerScope(session) },
  });
  refresh({ kind: "lead", id: leadId });
}

export async function createLeadNote(formData: FormData) {
  const parent = parentFromForm(formData);
  if (!parent) return;
  const session = await requireOwnedParent(parent);
  const body = str(formData, "body");
  if (!body) return;
  await prisma.leadNote.create({
    data: {
      tenantId: session.tenantId,
      ...parentFields(parent),
      ownerId: session.userId,
      body,
    },
  });
  refresh(parent);
}

export async function updateLeadNote(formData: FormData) {
  const parent = parentFromForm(formData);
  const id = str(formData, "id");
  const body = str(formData, "body");
  if (!parent || !id || !body) return;
  const session = await requireOwnedParent(parent);
  await prisma.leadNote.updateMany({
    where: noteWhere(session, parent, id),
    data: { body },
  });
  refresh(parent);
}

export async function deleteLeadNote(id: string, parentId: string) {
  const session = await requireSession();
  const parent =
    (await resolveParentByRow(parentId, async (kind) =>
      prisma.leadNote.findFirst({
        where: noteWhere(session, { kind, id: parentId }, id),
        select: { id: true },
      }),
    )) ?? parentFromIds(parentId);
  await prisma.leadNote.deleteMany({
    where: noteWhere(session, parent, id),
  });
  refresh(parent);
}

export async function createLeadAttachments(formData: FormData) {
  const parent = parentFromForm(formData);
  if (!parent) return { error: "Missing record." };
  const session = await requireOwnedParent(parent);
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose a file to attach." };
  const { writeFile } = await import("fs/promises");
  const { attachmentDiskPath, ensureAttachmentDir, safeFileName } = await import("@/lib/attachments");
  const { MAX_ATTACHMENT_BYTES, attachmentTooLargeAlert, attachmentTypeAlert, isAllowedAttachment } =
    await import("@/lib/attachment-rules");
  await ensureAttachmentDir(session.tenantId);
  for (const file of files) {
    if (!isAllowedAttachment(file.name)) {
      return { error: attachmentTypeAlert(file.name) };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { error: attachmentTooLargeAlert(file.name) };
    }
    const row = await prisma.leadAttachment.create({
      data: {
        tenantId: session.tenantId,
        ...parentFields(parent),
        ownerId: session.userId,
        fileName: safeFileName(file.name),
        mimeType: file.type || null,
        size: file.size,
        storagePath: "",
      },
    });
    const diskPath = attachmentDiskPath(session.tenantId, row.id);
    await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
    await prisma.leadAttachment.update({
      where: { id: row.id },
      data: { storagePath: `${session.tenantId}/${row.id}` },
    });
  }
  refresh(parent);
  return {};
}

export async function deleteLeadAttachment(id: string, parentId: string) {
  const session = await requireSession();
  const parent =
    (await resolveParentByRow(parentId, async (kind) =>
      prisma.leadAttachment.findFirst({
        where: attachmentWhere(session, { kind, id: parentId }, id),
        select: { id: true },
      }),
    )) ?? parentFromIds(parentId);
  const rows = await prisma.leadAttachment.findMany({
    where: attachmentWhere(session, parent, id),
  });
  const { unlink } = await import("fs/promises");
  const { attachmentDiskPath } = await import("@/lib/attachments");
  for (const row of rows) {
    try {
      await unlink(attachmentDiskPath(row.tenantId, row.id));
    } catch {
      /* already gone */
    }
  }
  await prisma.leadAttachment.deleteMany({
    where: attachmentWhere(session, parent, id),
  });
  refresh(parent);
}
