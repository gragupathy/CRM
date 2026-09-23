"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  Activity,
  Building2,
  Contact,
  Handshake,
  LayoutDashboard,
  LogOut,
  Settings2,
  Users,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ContactsModuleHeader, LeadsModuleHeader } from "@/components/leads-banner";
import { ReminderBell } from "@/components/reminder-bell";
import { ToastProvider } from "@/components/toast";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/activities", label: "Activities", icon: Activity },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const settings =
    user.role === "ADMIN"
      ? [
          { href: "/settings/company", label: "Company", icon: Building2 },
          { href: "/settings/users", label: "Users & roles", icon: Users },
          { href: "/settings/fields", label: "Custom fields", icon: Settings2 },
        ]
      : [];

  return (
    <ToastProvider>
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-800 bg-ink-950 text-slate-200 md:flex md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            HM
          </div>
          <div>
            <p className="text-sm font-semibold text-white">HM CRM</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Sales</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
          {settings.length > 0 ? (
            <div className="mt-4 hidden md:block">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Settings
              </p>
              {settings.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>
        <div className="hidden items-center justify-between gap-2 border-t border-white/10 px-4 py-4 md:flex">
          <div className="min-w-0">
            <p className="truncate text-sm text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.role.toLowerCase()}</p>
          </div>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {pathname.startsWith("/leads") || pathname.startsWith("/contacts") ? (
          <header className="w-full shrink-0 rounded-none bg-sky-50">
            <Suspense
              fallback={
                <div className="px-6 py-2.5 text-xl font-semibold text-ink-900 md:px-8">
                  {pathname.startsWith("/contacts") ? "Contacts" : "Leads"}
                </div>
              }
            >
              {pathname.startsWith("/contacts") ? (
                <ContactsModuleHeader userName={user.name} />
              ) : (
                <LeadsModuleHeader userName={user.name} />
              )}
            </Suspense>
          </header>
        ) : (
          <header className="flex items-center justify-end border-b border-slate-200 bg-white px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <ReminderBell />
              <ProfileAvatar name={user.name} />
              <form action="/logout" method="post" className="md:hidden">
                <button type="submit" className="text-sm text-slate-600">
                  Sign out
                </button>
              </form>
            </div>
          </header>
        )}
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
