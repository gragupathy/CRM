import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { getCustomFields } from "@/lib/custom-fields";
import { Card } from "@/components/ui";
import { CustomFieldValues } from "@/components/custom-fields";
import { ConvertLeadButton } from "@/components/convert-lead-button";
import { DeleteLeadButton } from "@/components/delete-lead-dialog";
import { LeadChildRecords } from "@/components/lead-child-records";
import { convertLead, deleteLead } from "../actions";
import {
  canConvertLead,
  INDUSTRIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TYPES,
  normalizeIndustry,
  normalizeLeadStatus,
} from "@/lib/constants";
import { formatDate, formatDateDmy, formatLeadNo, fullName, labelFor, websiteHref } from "@/lib/utils";

const alignEndCols =
  "lg:grid-cols-[9rem_minmax(0,1fr)_9rem_minmax(14rem,max-content)] lg:pr-12";

function Fields({
  children,
  alignEnd,
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
      <dd
        className={`min-w-0 py-0.5 text-sm text-ink-900 ${nowrap ? "whitespace-nowrap" : "break-words"}`}
      >
        {children || "—"}
      </dd>
    </>
  );
}

function val(value?: string | null) {
  return value?.trim() ? value : "—";
}

const headerBtn =
  "btn-cut inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
const sectionBox = "overflow-hidden rounded-xl border border-slate-300";
const sectionHead =
  "bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4";
const sectionBody = "p-3 md:p-4";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, ...ownerScope(session) },
    include: {
      owner: true,
      createdBy: true,
      modifiedBy: true,
      leadActivities: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 },
      leadNotes: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 },
      leadAttachments: { include: { owner: true }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!lead) notFound();
  const fields = await getCustomFields(session.tenantId, "LEAD");
  const converted = lead.status === "CONVERTED";
  const source =
    lead.source === "WEB" ? "WEBSITE" : lead.source === "COLD" ? "COLD_CALL" : lead.source;
  const name = fullName(lead.firstName, lead.lastName);
  const accountName = lead.company?.trim() || name;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/leads"
            aria-label="Back to leads"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">{name}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {converted ? null : (
            <>
              <ConvertLeadButton
                enabled={canConvertLead(lead.status)}
                action={convertLead.bind(null, lead.id)}
                className={headerBtn}
                accountName={accountName}
                lead={{
                  leadType: lead.leadType,
                  firstName: lead.firstName,
                  company: lead.company,
                  mobile: lead.mobile,
                  phone: lead.phone,
                  ownerId: lead.ownerId,
                }}
              />
              <Link href={`/leads/${lead.id}/edit`} className={headerBtn}>
                Edit
              </Link>
            </>
          )}
          {converted ? null : (
            <DeleteLeadButton
              action={deleteLead.bind(null, lead.id)}
              leadName={name}
              className={headerBtn}
            />
          )}
        </div>
      </div>

      <div>
        <Card className="p-6 md:p-8">
          <section className={sectionBox}>
            <h2 className={sectionHead}>Lead Details</h2>
            <div className={sectionBody}>
            <Fields alignEnd>
            <Pair>
              <Row label="Lead ID" nowrap>
                {formatLeadNo(lead.leadNo, lead.createdAt)}
              </Row>
              <Row label="Lead Status" nowrap>
                {labelFor(LEAD_STATUSES, normalizeLeadStatus(lead.status))}
              </Row>
            </Pair>
            <Pair>
              <Row label="Name">
                <div className="flex flex-wrap gap-x-8 gap-y-1">
                  <div>
                    <p className="whitespace-nowrap">{val(lead.firstName)}</p>
                    <p className="mt-0.5 whitespace-nowrap text-xs font-bold text-slate-600">First Name</p>
                  </div>
                  <div>
                    <p className="whitespace-nowrap">{val(lead.lastName)}</p>
                    <p className="mt-0.5 whitespace-nowrap text-xs font-bold text-slate-600">Last Name</p>
                  </div>
                </div>
              </Row>
              <Row label="Lead Source" nowrap>
                {labelFor(LEAD_SOURCES, source)}
              </Row>
            </Pair>
            <Pair>
              <Row label="Lead Type" nowrap>
                {labelFor(LEAD_TYPES, lead.leadType)}
              </Row>
              <Row label="Lead Owner" nowrap>
                {lead.owner.name}
              </Row>
            </Pair>
            <Pair>
              <Row label="Industry" nowrap>
                {labelFor(INDUSTRIES, normalizeIndustry(lead.industry))}
              </Row>
              <Row label="Company Name">
                <span className="line-clamp-2 break-words">{val(lead.company)}</span>
              </Row>
            </Pair>
            <Pair>
              <Row label="Job Title" nowrap>
                {val(lead.jobTitle)}
              </Row>
              <Row label="Website">{websiteHref(lead.website) ? (
                  <a
                    href={websiteHref(lead.website)!}
                    className="break-all text-brand-700 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {lead.website}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
            </Pair>
            <Pair>
              <Row label="Email" nowrap>
                {val(lead.email)}
              </Row>
              <Row label="Mobile" nowrap>
                {val(lead.mobile || lead.phone)}
              </Row>
            </Pair>
          </Fields>
            </div>
          </section>

          <section className={`mt-4 ${sectionBox}`}>
            <h2 className={sectionHead}>Address</h2>
            <div className={sectionBody}>
            <Fields alignEnd>
              <Pair>
                <Row label="Address Line 1">{val(lead.addressLine1)}</Row>
                <Row label="Country" nowrap>
                  {val(lead.country)}
                </Row>
              </Pair>
              <Pair>
                <Row label="Address Line 2">{val(lead.addressLine2)}</Row>
                <Row label="State" nowrap>
                  {val(lead.state)}
                </Row>
              </Pair>
              <Pair>
                <Row label="City" nowrap>
                  {val(lead.city)}
                </Row>
                <Row label="Pincode" nowrap>
                  {val(lead.postalCode)}
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
                  {lead.createdBy?.name ?? lead.owner.name}
                </Row>
                <Row label="Created Date" nowrap>
                  {formatDateDmy(lead.createdAt)}
                </Row>
              </Pair>
              <Pair>
                <Row label="Modified By" nowrap>
                  {lead.modifiedBy?.name ?? lead.owner.name}
                </Row>
                <Row label="Modified Date" nowrap>
                  {formatDateDmy(lead.updatedAt)}
                </Row>
              </Pair>
            </Fields>
            </div>
          </section>

          {lead.notes ? <p className="mt-4 text-sm text-slate-600">{lead.notes}</p> : null}
          {fields.length ? (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <CustomFieldValues fields={fields} valuesRaw={lead.customValues} />
            </div>
          ) : null}

          {converted ? (
            <p className="mt-6 text-sm text-slate-600">
              Converted {formatDate(lead.convertedAt)}.{" "}
              {lead.convertedAccountId ? (
                <Link href={`/accounts/${lead.convertedAccountId}`} className="text-brand-700">
                  Open account
                </Link>
              ) : null}
            </p>
          ) : null}
        </Card>
      </div>
      <LeadChildRecords
        leadId={lead.id}
        leadName={name}
        activities={lead.leadActivities}
        notes={lead.leadNotes}
        attachments={lead.leadAttachments}
      />
    </div>
  );
}
