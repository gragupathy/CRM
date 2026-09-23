import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { Card } from "@/components/ui";
import { ListPager } from "@/components/list-pager";
import { LeadsToolbar } from "@/components/leads-toolbar";
import { LeadsTable } from "@/components/leads-table";
import { DEFAULT_LEAD_VIEW, isLeadView } from "@/lib/lead-views";
import { leadViewWhere } from "@/lib/lead-view-query";
import { LEAD_COLS_COOKIE, LEAD_PER_PAGE_COOKIE, parseLeadColumns, parsePerPage } from "@/lib/lead-list-prefs";
import type { Prisma } from "@prisma/client";

const SORTS = [
  "name",
  "email",
  "website",
  "phone",
  "mobile",
  "leadType",
  "source",
  "company",
  "owner",
  "firstName",
  "lastName",
  "jobTitle",
  "status",
  "industry",
  "city",
  "state",
  "country",
  "postalCode",
  "leadNo",
  "createdAt",
  "updatedAt",
] as const;
type SortKey = (typeof SORTS)[number];

function isSort(v: string | undefined): v is SortKey {
  return !!v && (SORTS as readonly string[]).includes(v);
}

function orderFor(sort: SortKey, dir: "asc" | "desc"): Prisma.LeadOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ firstName: dir }, { lastName: dir }, { createdAt: "desc" }];
    case "email":
      return [{ email: dir }, { createdAt: "desc" }];
    case "phone":
      return [{ mobile: dir }, { createdAt: "desc" }];
    case "mobile":
      return [{ mobile: dir }, { createdAt: "desc" }];
    case "website":
      return [{ website: dir }, { createdAt: "desc" }];
    case "leadType":
      return [{ leadType: dir }, { createdAt: "desc" }];
    case "company":
      return [{ company: dir }, { createdAt: "desc" }];
    case "owner":
      return [{ owner: { name: dir } }, { createdAt: "desc" }];
    case "firstName":
      return [{ firstName: dir }, { createdAt: "desc" }];
    case "lastName":
      return [{ lastName: dir }, { createdAt: "desc" }];
    case "jobTitle":
      return [{ jobTitle: dir }, { createdAt: "desc" }];
    case "status":
      return [{ status: dir }, { createdAt: "desc" }];
    case "industry":
      return [{ industry: dir }, { createdAt: "desc" }];
    case "city":
      return [{ city: dir }, { createdAt: "desc" }];
    case "state":
      return [{ state: dir }, { createdAt: "desc" }];
    case "country":
      return [{ country: dir }, { createdAt: "desc" }];
    case "postalCode":
      return [{ postalCode: dir }, { createdAt: "desc" }];
    case "leadNo":
      return [{ leadNo: dir }, { createdAt: "desc" }];
    case "createdAt":
      return [{ createdAt: dir }];
    case "updatedAt":
      return [{ updatedAt: dir }];
    default:
      return [{ source: dir }, { createdAt: "desc" }];
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
    view?: string;
    status?: string;
    imported?: string;
    skipped?: string;
    perPage?: string;
  }>;
}) {
  const session = await requireSession();
  const jar = await cookies();
  const sp = await searchParams;
  const view = isLeadView(sp.view) ? sp.view : DEFAULT_LEAD_VIEW;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = isSort(sp.sort) ? sp.sort : "createdAt";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";
  const defaultNewest = !isSort(sp.sort);
  const status = sp.status || undefined;
  const pageSize = parsePerPage(sp.perPage || jar.get(LEAD_PER_PAGE_COOKIE)?.value);
  const columns = parseLeadColumns(jar.get(LEAD_COLS_COOKIE)?.value);

  const where: Prisma.LeadWhereInput = {
    AND: [
      leadViewWhere(view, session),
      ownerScope(session),
      status ? { status } : {},
      q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { company: { contains: q } },
              { email: { contains: q } },
              { mobile: { contains: q } },
            ],
          }
        : {},
    ],
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput[] = defaultNewest
    ? [{ createdAt: "desc" }]
    : orderFor(sort, dir);

  const total = await prisma.lead.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    skip: (current - 1) * pageSize,
    take: pageSize,
    include: {
      owner: { select: { name: true } },
      _count: { select: { leadActivities: true, leadNotes: true } },
    },
  });
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const qs = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = {
      view: view === DEFAULT_LEAD_VIEW ? undefined : view,
      q: q || undefined,
      status: status || undefined,
      sort: defaultNewest ? undefined : sort,
      dir: defaultNewest ? undefined : dir,
      perPage: pageSize === 10 ? undefined : String(pageSize),
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const s = p.toString();
    return s ? `/leads?${s}` : "/leads";
  };

  const currentQuery = new URLSearchParams();
  if (view !== DEFAULT_LEAD_VIEW) currentQuery.set("view", view);
  if (q) currentQuery.set("q", q);
  if (status) currentQuery.set("status", status);
  if (pageSize !== 10) currentQuery.set("perPage", String(pageSize));
  if (!defaultNewest) {
    currentQuery.set("sort", sort);
    currentQuery.set("dir", dir);
  }

  return (
    <div>
      <LeadsToolbar view={view} q={q} querySuffix={currentQuery.toString()} />
      {sp.imported ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imported {sp.imported} lead{sp.imported === "1" ? "" : "s"}
          {sp.skipped && sp.skipped !== "0" ? `. Skipped ${sp.skipped}.` : "."}
        </p>
      ) : null}
      <Card className="mt-4 !rounded-none">
        <LeadsTable
          leads={leads.map((l) => ({
            id: l.id,
            firstName: l.firstName,
            lastName: l.lastName,
            email: l.email,
            mobile: l.mobile,
            phone: l.phone,
            leadType: l.leadType,
            source: l.source,
            website: l.website,
            company: l.company,
            jobTitle: l.jobTitle,
            status: l.status,
            industry: l.industry,
            city: l.city,
            state: l.state,
            country: l.country,
            postalCode: l.postalCode,
            leadNo: l.leadNo,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            ownerName: l.owner.name,
            activityCount: l._count.leadActivities,
            noteCount: l._count.leadNotes,
          }))}
          sort={defaultNewest ? "" : sort}
          dir={defaultNewest ? "desc" : dir}
          querySuffix={currentQuery.toString()}
          columns={columns}
          perPage={pageSize}
        />
        <ListPager
          page={current}
          pageCount={pageCount}
          from={from}
          to={to}
          total={total}
          prevHref={current <= 1 ? null : qs({ page: String(current - 1) })}
          nextHref={current >= pageCount ? null : qs({ page: String(current + 1) })}
          totalLabel="Total Rows"
        />
      </Card>
    </div>
  );
}
