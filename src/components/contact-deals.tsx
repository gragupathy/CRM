import Link from "next/link";
import type { Deal } from "@prisma/client";
import { DEAL_STAGES } from "@/lib/constants";
import { formatDate, labelFor, money } from "@/lib/utils";

type DealRow = Pick<
  Deal,
  "id" | "name" | "amount" | "currency" | "stage" | "expectedClose"
>;

export function ContactDeals({
  contactId,
  accountId,
  contactName,
  items,
}: {
  contactId: string;
  accountId?: string | null;
  contactName: string;
  items: DealRow[];
}) {
  const params = new URLSearchParams({
    contactId,
    name: contactName,
    returnTo: `/contacts/${contactId}`,
  });
  if (accountId) params.set("accountId", accountId);
  const newHref = `/deals/new?${params.toString()}`;

  return (
    <>
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-3">
        <h2 className="text-base font-semibold text-ink-900">Deals</h2>
        <Link
          href={newHref}
          className="btn-cut inline-flex items-center rounded-lg border border-indigo-300 bg-white px-4 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          New Deal
        </Link>
      </div>
      <div className="border-t border-slate-200 px-4 py-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No records found</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-sm font-semibold text-slate-700">
              <tr>
                <th className="py-2 pr-3">Deal Name</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2">Expected Close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 pr-3">
                    <Link href={`/deals/${d.id}`} className="font-medium text-indigo-700 hover:underline">
                      {d.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{money(d.amount, d.currency)}</td>
                  <td className="py-2 pr-3 text-slate-600">{labelFor(DEAL_STAGES, d.stage)}</td>
                  <td className="py-2 text-slate-600">{formatDate(d.expectedClose)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
