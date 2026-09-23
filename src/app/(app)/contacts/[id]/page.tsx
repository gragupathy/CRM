import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Card } from "@/components/ui";
import { CustomFieldValues } from "@/components/custom-fields";
import { ConfirmDeleteButton } from "@/components/confirm-delete-dialog";
import { LeadChildRecords } from "@/components/lead-child-records";
import { deleteContact } from "../actions";
import { formatDateDmy, fullName } from "@/lib/utils";

const headerBtn =
  "btn-cut inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
const sectionBox = "overflow-hidden rounded-xl border border-slate-300";
const sectionHead = "bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4";
const sectionBody = "p-3 md:p-4";
const alignEndCols =
  "lg:grid-cols-[9rem_minmax(0,1fr)_9rem_minmax(14rem,max-content)] lg:pr-12";

function Fields({
  children,
  alignEnd = true,
}: {
  children: React.ReactNode;
  alignEnd?: boolean;
}) {
  return (
    <dl
      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 ${
        alignEnd ? alignEndCols : "lg:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
      }`}
    >
      {children}
    </dl>
  );
}

function Pair({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 border-b border-slate-100 py-1.5 last:border-b-0 lg:col-span-4 lg:grid-cols-subgrid">
      {children}
    </div>
  );
}

function Row({
  label,
  children,
  nowrap,
}: {
  label: string;
  children: React.ReactNode;
  nowrap?: boolean;
}) {
  return (
    <>
      <dt className="whitespace-nowrap py-0.5 text-sm font-semibold text-slate-700">{label}</dt>
      <dd className={`min-w-0 py-0.5 text-sm text-ink-900 ${nowrap ? "whitespace-nowrap" : "break-words"}`}>
        {children || "—"}
      </dd>
    </>
  );
}

function val(value?: string | null) {
  return value?.trim() ? value : "—";
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, ...ownerScope(session) },
    include: {
      owner: true,
      account: true,
      createdBy: true,
      modifiedBy: true,
      deals: { orderBy: { createdAt: "desc" } },
      contactActivities: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 },
      contactNotes: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 },
      contactAttachments: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!contact) notFound();
  const fields = await getCustomFields(session.tenantId, "CONTACT");
  const name = fullName(contact.firstName, contact.lastName);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/contacts"
            aria-label="Back to contacts"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">{name}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href={`/contacts/${contact.id}/edit`} className={headerBtn}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteContact.bind(null, contact.id)}
            title="Delete contact?"
            message={`${name} will be removed.`}
            className={headerBtn}
          >
            Delete
          </ConfirmDeleteButton>
        </div>
      </div>

      <Card className="p-6 md:p-8">
        <section className={sectionBox}>
          <h2 className={sectionHead}>Contact Details</h2>
          <div className={sectionBody}>
            <Fields>
              <Pair>
                <Row label="Name">
                  <div className="flex flex-wrap gap-x-8 gap-y-1">
                    <div>
                      <p className="whitespace-nowrap">{val(contact.firstName)}</p>
                      <p className="mt-0.5 whitespace-nowrap text-xs font-bold text-slate-600">First Name</p>
                    </div>
                    <div>
                      <p className="whitespace-nowrap">{val(contact.lastName)}</p>
                      <p className="mt-0.5 whitespace-nowrap text-xs font-bold text-slate-600">Last Name</p>
                    </div>
                  </div>
                </Row>
                <Row label="Contact Owner">{contact.owner.name}</Row>
              </Pair>
              <Pair>
                <Row label="Account Name">
                  {contact.account ? (
                    <Link href={`/accounts/${contact.account.id}`} className="text-brand-700">
                      {contact.account.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Job Title">{val(contact.title)}</Row>
              </Pair>
              <Pair>
                <Row label="Email">{val(contact.email)}</Row>
                <Row label="Mobile" nowrap>
                  {val(contact.mobile || contact.phone)}
                </Row>
              </Pair>
            </Fields>
          </div>
        </section>

        <section className={`mt-4 ${sectionBox}`}>
          <h2 className={sectionHead}>Address</h2>
          <div className={sectionBody}>
            <Fields>
              <Pair>
                <Row label="Address Line 1">{val(contact.addressLine1)}</Row>
                <Row label="Country">{val(contact.country)}</Row>
              </Pair>
              <Pair>
                <Row label="Address Line 2">{val(contact.addressLine2)}</Row>
                <Row label="State">{val(contact.state)}</Row>
              </Pair>
              <Pair>
                <Row label="City">{val(contact.city)}</Row>
                <Row label="Pincode" nowrap>
                  {val(contact.postalCode)}
                </Row>
              </Pair>
            </Fields>
          </div>
        </section>

        <section className={`mt-4 ${sectionBox}`}>
          <h2 className={sectionHead}>System Details</h2>
          <div className={sectionBody}>
            <Fields alignEnd>
              <Pair>
                <Row label="Created By" nowrap>
                  {contact.createdBy?.name ?? contact.owner.name}
                </Row>
                <Row label="Created Date" nowrap>
                  {formatDateDmy(contact.createdAt)}
                </Row>
              </Pair>
              <Pair>
                <Row label="Modified By" nowrap>
                  {contact.modifiedBy?.name ?? contact.owner.name}
                </Row>
                <Row label="Modified Date" nowrap>
                  {formatDateDmy(contact.updatedAt)}
                </Row>
              </Pair>
            </Fields>
          </div>
        </section>

        <div className="mt-4">
          <CustomFieldValues fields={fields} valuesRaw={contact.customValues} />
        </div>
      </Card>

      <LeadChildRecords
        contactId={contact.id}
        accountId={contact.accountId}
        leadName={name}
        nameLabel="Contact name"
        deals={contact.deals}
        activities={contact.contactActivities}
        notes={contact.contactNotes}
        attachments={contact.contactAttachments}
      />
    </div>
  );
}
