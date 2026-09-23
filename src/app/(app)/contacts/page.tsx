import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { Card, EmptyState } from "@/components/ui";
import { ListPager } from "@/components/list-pager";
import { ContactsToolbar } from "@/components/contacts-toolbar";
import { ContactsTable } from "@/components/contacts-table";
import { DEFAULT_CONTACT_VIEW, isContactView } from "@/lib/contact-views";
import { contactViewWhere } from "@/lib/contact-view-query";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;
const SORTS = ["name", "email", "phone", "title", "account"] as const;
type SortKey = (typeof SORTS)[number];

function isSort(v: string | undefined): v is SortKey {
  return !!v && (SORTS as readonly string[]).includes(v);
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
    view?: string;
  }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const view = isContactView(sp.view) ? sp.view : DEFAULT_CONTACT_VIEW;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = isSort(sp.sort) ? sp.sort : "createdAt";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";
  const defaultNewest = !isSort(sp.sort);

  const where: Prisma.ContactWhereInput = {
    AND: [
      contactViewWhere(view, session),
      ownerScope(session),
      q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { mobile: { contains: q } },
              { phone: { contains: q } },
              { title: { contains: q } },
              { account: { name: { contains: q } } },
            ],
          }
        : {},
    ],
  };

  const orderBy: Prisma.ContactOrderByWithRelationInput[] = defaultNewest
    ? [{ createdAt: "desc" }]
    : sort === "name"
      ? [{ firstName: dir }, { lastName: dir }, { createdAt: "desc" }]
      : sort === "email"
        ? [{ email: dir }, { createdAt: "desc" }]
        : sort === "phone"
          ? [{ mobile: dir }, { createdAt: "desc" }]
          : sort === "title"
            ? [{ title: dir }, { createdAt: "desc" }]
            : [{ account: { name: dir } }, { createdAt: "desc" }];

  const total = await prisma.contact.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const contacts = await prisma.contact.findMany({
    where,
    include: { account: true },
    orderBy,
    skip: (current - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const from = total === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, total);

  const qs = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = {
      view: view === DEFAULT_CONTACT_VIEW ? undefined : view,
      q: q || undefined,
      sort: defaultNewest ? undefined : sort,
      dir: defaultNewest ? undefined : dir,
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const s = p.toString();
    return s ? `/contacts?${s}` : "/contacts";
  };

  const currentQuery = new URLSearchParams();
  if (view !== DEFAULT_CONTACT_VIEW) currentQuery.set("view", view);
  if (q) currentQuery.set("q", q);
  if (!defaultNewest) {
    currentQuery.set("sort", sort);
    currentQuery.set("dir", dir);
  }

  return (
    <div>
      <ContactsToolbar view={view} q={q} querySuffix={currentQuery.toString()} />
      <Card className="mt-4 !rounded-none">
        {total === 0 ? (
          <EmptyState
            title="No contacts"
            body="Add a contact, or switch to another view from the menu next to My Contacts."
          />
        ) : (
          <>
            <ContactsTable
              contacts={contacts.map((c) => ({
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                mobile: c.mobile,
                phone: c.phone,
                title: c.title,
                accountName: c.account?.name ?? null,
                accountId: c.accountId,
              }))}
              sort={defaultNewest ? "" : sort}
              dir={defaultNewest ? "desc" : dir}
              querySuffix={currentQuery.toString()}
            />
            <ListPager
              page={current}
              pageCount={pageCount}
              from={from}
              to={to}
              total={total}
              prevHref={current <= 1 ? null : qs({ page: String(current - 1) })}
              nextHref={current >= pageCount ? null : qs({ page: String(current + 1) })}
            />
          </>
        )}
      </Card>
    </div>
  );
}
