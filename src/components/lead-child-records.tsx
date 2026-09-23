import type { Deal, LeadActivity, LeadAttachment, LeadNote, User } from "@prisma/client";
import { LeadFollowUps } from "@/components/lead-follow-ups";
import { LeadNotes } from "@/components/lead-notes";
import { LeadAttachments } from "@/components/lead-attachments";
import { ContactDeals } from "@/components/contact-deals";

type Owner = Pick<User, "name">;

const box = "overflow-hidden rounded-xl border border-slate-300 bg-white";

export function LeadChildRecords({
  leadId,
  contactId,
  leadName,
  nameLabel,
  deals,
  accountId,
  activities,
  notes,
  attachments,
}: {
  leadId?: string;
  contactId?: string;
  leadName: string;
  nameLabel?: string;
  accountId?: string | null;
  deals?: Pick<Deal, "id" | "name" | "amount" | "currency" | "stage" | "expectedClose">[];
  activities: (LeadActivity & { owner: Owner })[];
  notes: (LeadNote & { owner: Owner })[];
  attachments: (LeadAttachment & { owner: Owner })[];
}) {
  return (
    <div className="mt-6 grid gap-4">
      {contactId ? (
        <section className={box}>
          <ContactDeals
            contactId={contactId}
            accountId={accountId}
            contactName={leadName}
            items={deals ?? []}
          />
        </section>
      ) : null}

      <section className={box}>
        <LeadFollowUps
          leadId={leadId}
          contactId={contactId}
          leadName={leadName}
          nameLabel={nameLabel}
          items={activities}
        />
      </section>

      <section className={box}>
        <LeadNotes leadId={leadId} contactId={contactId} items={notes} />
      </section>

      <section className={box}>
        <LeadAttachments leadId={leadId} contactId={contactId} items={attachments} />
      </section>
    </div>
  );
}
