"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Settings } from "lucide-react";
import { initials } from "@/components/profile-avatar";
import { ReminderBell } from "@/components/reminder-bell";

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800";

export function ModuleHeader({
  title,
  listHref,
  newHref,
  addTitle,
  userName,
}: {
  title: string;
  listHref: string;
  newHref: string;
  addTitle: string;
  userName?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    const p = new URLSearchParams();
    if (value) p.set("q", value);
    const s = p.toString();
    router.push(s ? `${listHref}?${s}` : listHref);
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-none bg-sky-50 px-6 py-2.5 md:px-8">
      <Link href={listHref} className="pl-2 text-xl font-semibold text-ink-900">
        {title}
      </Link>
      <div className="flex items-center justify-end gap-2 pr-2">
        <form onSubmit={onSearch} className="relative w-56 sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            key={q}
            placeholder="Search records"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:bg-white"
          />
        </form>
        <Link
          href={newHref}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#5b6cff] text-white hover:bg-[#4a5bf0]"
          title={addTitle}
        >
          <Plus size={18} />
        </Link>
        <ReminderBell />
        <Link href="/settings/fields" className={iconBtn} title="Settings">
          <Settings size={18} />
        </Link>
        {userName ? (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
            title={userName}
          >
            {initials(userName) || "?"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LeadsModuleHeader({ userName }: { userName?: string }) {
  return (
    <ModuleHeader
      title="Leads"
      listHref="/leads"
      newHref="/leads/new"
      addTitle="Add Lead"
      userName={userName}
    />
  );
}

export function ContactsModuleHeader({ userName }: { userName?: string }) {
  return (
    <ModuleHeader
      title="Contacts"
      listHref="/contacts"
      newHref="/contacts/new"
      addTitle="Add Contact"
      userName={userName}
    />
  );
}
