import Link from "next/link";
import { formatDateTime, labelFor } from "@/lib/utils";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { completeActivity, deleteActivity } from "@/app/(app)/activities/actions";
import type { Activity, User } from "@prisma/client";
import { ConfirmDeleteButton } from "@/components/confirm-delete-dialog";

export function ActivityList({
  items,
}: {
  items: (Activity & { owner: Pick<User, "name"> })[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No activities yet.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium">{a.subject}</p>
            <p className="text-xs text-slate-500">
              {labelFor(ACTIVITY_TYPES, a.type)} · {a.owner.name} · {formatDateTime(a.createdAt)}
              {a.dueAt ? ` · due ${formatDateTime(a.dueAt)}` : ""}
            </p>
            {a.body ? <p className="mt-1 text-sm text-slate-600">{a.body}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {a.completedAt ? (
              <Badge tone="green">Done</Badge>
            ) : (
              <form action={completeActivity.bind(null, a.id)}>
                <button type="submit" className="text-sm text-brand-700">
                  Complete
                </button>
              </form>
            )}
            <ConfirmDeleteButton
              action={deleteActivity.bind(null, a.id)}
              title="Delete activity?"
              message={`${a.subject} will be removed.`}
            >
              Delete
            </ConfirmDeleteButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SearchBar({
  placeholder,
  defaultValue,
  extras,
}: {
  placeholder: string;
  defaultValue?: string;
  extras?: Record<string, string>;
}) {
  return (
    <form className="mb-4">
      {extras
        ? Object.entries(extras).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/20"
      />
    </form>
  );
}

export function RelatedLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand-700 hover:underline">
      {children}
    </Link>
  );
}
