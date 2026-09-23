"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, UserRound } from "lucide-react";
import { initials } from "@/components/profile-avatar";
import { titleCase } from "@/lib/utils";

export type OwnerUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function designationLabel(role: string) {
  if (role === "ADMIN") return "Administrator";
  if (role === "MANAGER") return "Manager";
  return titleCase(role);
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ${cls}`}
    >
      {initials(name) || <UserRound size={14} />}
    </div>
  );
}

function matches(user: OwnerUser, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle);
}

export function LeadOwnerPicker({
  users,
  defaultOwnerId,
}: {
  users: OwnerUser[];
  defaultOwnerId?: string;
}) {
  const initial = users.find((u) => u.id === defaultOwnerId)?.id ?? users[0]?.id ?? "";
  const [ownerId, setOwnerId] = useState(initial);
  const [openList, setOpenList] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [modalQuery, setModalQuery] = useState("");
  const [draftId, setDraftId] = useState(initial);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = users.find((u) => u.id === ownerId) ?? users[0];
  const listUsers = useMemo(() => users.filter((u) => matches(u, listQuery)), [users, listQuery]);
  const modalUsers = useMemo(() => users.filter((u) => matches(u, modalQuery)), [users, modalQuery]);
  const draft = users.find((u) => u.id === draftId);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenList(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(id: string) {
    setOwnerId(id);
    setOpenList(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" name="ownerId" value={ownerId} />
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between border-0 border-b border-slate-300 bg-transparent py-1.5 text-left text-sm text-ink-900 outline-none focus:border-brand-600"
          onClick={() => {
            setOpenList((v) => !v);
            setListQuery("");
          }}
        >
          <span className="truncate">{selected?.name || "Select user"}</span>
          <ChevronDown size={16} className="ml-2 shrink-0 text-slate-400" />
        </button>
        <button
          type="button"
          title="Search users"
          aria-label="Search users"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink-900"
          onClick={() => {
            setDraftId(ownerId);
            setModalQuery("");
            setOpenModal(true);
            setOpenList(false);
          }}
        >
          <Search size={18} />
        </button>
      </div>

      {openList ? (
        <div className="absolute z-30 mt-1 w-[min(20rem,calc(100%+2.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
          <div className="px-3 pb-2">
            <label className="flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                autoFocus
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                placeholder="Search Users"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
          <ul className="max-h-56 overflow-auto">
            {listUsers.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No users found.</li>
            ) : (
              listUsers.map((u) => {
                const active = u.id === ownerId;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-indigo-50 ${active ? "bg-indigo-50" : ""}`}
                      onClick={() => pick(u.id)}
                    >
                      <span className="w-4 text-indigo-600">{active ? "✓" : ""}</span>
                      <Avatar name={u.name} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-900">{u.name}</span>
                        <span className="block truncate text-xs text-slate-500">{u.email || "—"}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      {openModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close"
            onClick={() => setOpenModal(false)}
          />
          <div className="relative w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-ink-900">Change Lead Owner</h3>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <label className="flex min-w-[16rem] flex-1 items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                <Search size={14} className="shrink-0 text-slate-400" />
                <input
                  value={modalQuery}
                  onChange={(e) => setModalQuery(e.target.value)}
                  placeholder="Search Users"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                Selected User:
                {draft ? (
                  <>
                    <Avatar name={draft.name} size="sm" />
                    <span className="font-medium text-ink-900">{draft.name}</span>
                  </>
                ) : (
                  <span>—</span>
                )}
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="w-10 px-3 py-2" />
                    <th className="px-3 py-2 font-semibold">User Name</th>
                    <th className="px-3 py-2 font-semibold">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {modalUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    modalUsers.map((u, i) => (
                      <tr
                        key={u.id}
                        className={`cursor-pointer ${i % 2 ? "bg-indigo-50/40" : "bg-white"} ${u.id === draftId ? "bg-indigo-50" : ""}`}
                        onClick={() => setDraftId(u.id)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name="owner-draft"
                            checked={u.id === draftId}
                            onChange={() => setDraftId(u.id)}
                            className="accent-indigo-600"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2 font-medium text-ink-900">
                            <Avatar name={u.name} size="sm" />
                            {u.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{designationLabel(u.role)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-cut border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-cut bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
                onClick={() => {
                  if (draftId) setOwnerId(draftId);
                  setOpenModal(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
