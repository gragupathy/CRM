"use client";

import Link from "next/link";
import { useState } from "react";
import { SortHeader } from "@/components/list-pager";
import { fullName } from "@/lib/utils";

export type ContactListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  title: string | null;
  accountName: string | null;
  accountId: string | null;
};

export function ContactsTable({
  contacts,
  sort,
  dir,
  querySuffix,
}: {
  contacts: ContactListRow[];
  sort: string;
  dir: "asc" | "desc";
  querySuffix: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const allIds = contacts.map((c) => c.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selected.includes(id));

  function hrefFor(column: string, nextDir: "asc" | "desc") {
    const p = new URLSearchParams(querySuffix);
    p.set("sort", column);
    p.set("dir", nextDir);
    p.set("page", "1");
    return `/contacts?${p.toString()}`;
  }

  return (
    <div className="overflow-x-auto rounded-none">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-sm">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={allChecked}
                onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                aria-label="Select all"
              />
            </th>
            {(
              [
                ["Contact Name", "name"],
                ["Email", "email"],
                ["Phone", "phone"],
                ["Job Title", "title"],
                ["Account", "account"],
              ] as const
            ).map(([label, column]) => (
              <th key={column} className="px-4 py-3">
                <SortHeader label={label} column={column} sort={sort} dir={dir} hrefFor={hrefFor} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={selected.includes(c.id)}
                  onChange={(e) =>
                    setSelected((cur) =>
                      e.target.checked ? [...cur, c.id] : cur.filter((id) => id !== c.id),
                    )
                  }
                  aria-label={`Select ${fullName(c.firstName, c.lastName)}`}
                />
              </td>
              <td className="px-4 py-3">
                <Link href={`/contacts/${c.id}`} className="font-medium text-blue-600 hover:underline">
                  {fullName(c.firstName, c.lastName)}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{c.email || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{c.mobile || c.phone || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{c.title || "—"}</td>
              <td className="px-4 py-3">
                {c.accountId && c.accountName ? (
                  <Link href={`/accounts/${c.accountId}`} className="text-blue-600 hover:underline">
                    {c.accountName}
                  </Link>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
