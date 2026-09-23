import { prisma } from "@/lib/prisma";
import { formatLeadNo } from "@/lib/utils";

export async function nextLeadNo(tenantId: string, year = new Date().getFullYear()) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const agg = await prisma.lead.aggregate({
    where: { tenantId, createdAt: { gte: start, lt: end } },
    _max: { leadNo: true },
  });
  return (agg._max.leadNo ?? 0) + 1;
}

export async function peekLeadId(tenantId: string) {
  const year = new Date().getFullYear();
  return formatLeadNo(await nextLeadNo(tenantId, year), year);
}
