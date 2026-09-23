import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { ContactForm } from "@/components/contact-form";
import { updateContact } from "../../actions";
import { fullName } from "@/lib/utils";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, ...ownerScope(session) },
    include: { owner: true, createdBy: true, modifiedBy: true },
  });
  if (!contact) notFound();
  const [fields, users, accounts] = await Promise.all([
    getCustomFields(session.tenantId, "CONTACT"),
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.account.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ContactForm
      action={updateContact.bind(null, contact.id)}
      cancelHref={`/contacts/${contact.id}`}
      recordName={fullName(contact.firstName, contact.lastName)}
      fields={fields}
      users={users}
      accounts={accounts}
      values={{
        firstName: contact.firstName,
        lastName: contact.lastName,
        jobTitle: contact.title ?? "",
        email: contact.email,
        mobile: contact.mobile ?? contact.phone,
        accountId: contact.accountId,
        addressLine1: contact.addressLine1,
        addressLine2: contact.addressLine2,
        city: contact.city,
        state: contact.state,
        country: contact.country,
        postalCode: contact.postalCode,
        ownerId: contact.ownerId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        createdByName: contact.createdBy?.name ?? contact.owner.name,
        modifiedByName: contact.modifiedBy?.name ?? contact.owner.name,
        customValues: contact.customValues,
      }}
    />
  );
}
