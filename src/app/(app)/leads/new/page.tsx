import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { LeadForm } from "@/components/lead-form";
import { peekLeadId } from "@/lib/leads";
import { createLead } from "../actions";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string; from?: string }>;
}) {
  const session = await requireSession();
  const { clone, from } = await searchParams;
  const [me, fields, leadIdPreview, source, users] = await Promise.all([
    prisma.user.findFirst({ where: { id: session.userId } }),
    getCustomFields(session.tenantId, "LEAD"),
    peekLeadId(session.tenantId),
    clone
      ? prisma.lead.findFirst({ where: { id: clone, ...ownerScope(session) } })
      : Promise.resolve(null),
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);
  const cancelHref = from ? `/leads/${from}` : clone ? `/leads/${clone}` : "/leads";

  return (
    <LeadForm
          action={createLead}
          submitLabel="Save"
          cancelHref={cancelHref}
          fields={fields}
          users={users}
          values={{
            ownerName: me?.name ?? "You",
            ownerId: source?.ownerId ?? session.userId,
            leadIdPreview,
            ...(source
              ? {
                  leadType: source.leadType,
                  firstName: source.firstName,
                  lastName: source.lastName,
                  jobTitle: source.jobTitle ?? "",
                  company: source.company ?? "",
                  industry: source.industry ?? "",
                  email: source.email,
                  mobile: source.mobile ?? source.phone,
                  website: source.website,
                  addressLine1: source.addressLine1,
                  addressLine2: source.addressLine2,
                  city: source.city,
                  state: source.state,
                  country: source.country,
                  postalCode: source.postalCode,
                  status: source.status === "CONVERTED" ? "NEW" : source.status,
                  source:
                    source.source === "WEB"
                      ? "WEBSITE"
                      : source.source === "COLD"
                        ? "COLD_CALL"
                        : source.source,
                  customValues: source.customValues,
                }
              : {}),
          }}
        />
  );
}
