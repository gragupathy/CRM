import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { LeadForm } from "@/components/lead-form";
import { updateLead } from "../../actions";
import { fullName } from "@/lib/utils";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, ...ownerScope(session) },
    include: { owner: true, createdBy: true, modifiedBy: true },
  });
  if (!lead || lead.status === "CONVERTED") notFound();
  const [fields, users] = await Promise.all([
    getCustomFields(session.tenantId, "LEAD"),
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);
  const name = fullName(lead.firstName, lead.lastName);

  return (
    <div>
      <LeadForm
          action={updateLead.bind(null, lead.id)}
          submitLabel="Save"
          cancelHref={`/leads/${lead.id}`}
          recordName={name}
          fields={fields}
          users={users}
          values={{
            leadNo: lead.leadNo,
            leadType: lead.leadType,
            firstName: lead.firstName,
            lastName: lead.lastName,
            jobTitle: lead.jobTitle ?? "",
            company: lead.company ?? "",
            industry: lead.industry ?? "",
            email: lead.email,
            mobile: lead.mobile ?? lead.phone,
            website: lead.website,
            addressLine1: lead.addressLine1,
            addressLine2: lead.addressLine2,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            postalCode: lead.postalCode,
            status: lead.status,
            source: lead.source === "WEB" ? "WEBSITE" : lead.source === "COLD" ? "COLD_CALL" : lead.source,
            ownerName: lead.owner.name,
            ownerId: lead.ownerId,
            createdByName: lead.createdBy?.name ?? lead.owner.name,
            modifiedByName: lead.modifiedBy?.name ?? lead.owner.name,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
            customValues: lead.customValues,
          }}
        />
    </div>
  );
}
