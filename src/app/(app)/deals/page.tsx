import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { Button, Card, PageHeader } from "@/components/ui";
import { DEAL_STAGES } from "@/lib/constants";
import { money } from "@/lib/utils";
import { DealStageSelect } from "@/components/deal-stage-select";

export default async function DealsPage() {
  const session = await requireSession();
  const deals = await prisma.deal.findMany({
    where: ownerScope(session),
    include: { owner: true, account: true },
    orderBy: { updatedAt: "desc" },
  });
  const byStage = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, deals.filter((d) => d.stage === s.value)]));

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Pipeline board. Move a deal with the stage dropdown on each card."
        actions={<Button href="/deals/new">New deal</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-5">
        {DEAL_STAGES.map((stage) => {
          const items = byStage[stage.value] ?? [];
          const total = items.reduce((s, d) => s + d.amount, 0);
          return (
            <Card key={stage.value} className="flex min-h-[280px] flex-col p-3">
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold">{stage.label}</h2>
                <span className="text-xs text-slate-500">
                  {items.length} · {money(total)}
                </span>
              </div>
              <ul className="space-y-2">
                {items.map((d) => (
                  <li key={d.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Link href={`/deals/${d.id}`} className="text-sm font-medium text-ink-900">
                      {d.name}
                    </Link>
                    <p className="text-sm text-slate-600">{money(d.amount, d.currency)}</p>
                    <p className="text-xs text-slate-400">
                      {d.account?.name ?? "No account"} · {d.owner.name}
                    </p>
                    <DealStageSelect id={d.id} stage={d.stage} />
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
