import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { ContactForm } from "@/components/contact-form";
import { createContact } from "../actions";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const session = await requireSession();
  const { accountId } = await searchParams;
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
      action={createContact}
      cancelHref="/contacts"
      fields={fields}
      users={users}
      accounts={accounts}
      values={{
        ownerId: session.userId,
        accountId: accountId ?? "",
        country: "India",
      }}
    />
  );
}
