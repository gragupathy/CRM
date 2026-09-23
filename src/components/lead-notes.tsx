"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { LeadNote, User } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { createLeadNote, deleteLeadNote, updateLeadNote } from "@/app/(app)/leads/child-actions";
import { ChildParentFields, childParentId } from "@/components/child-parent-field";

type Owner = Pick<User, "name">;
type Item = LeadNote & { owner: Owner };

export function LeadNotes({
  leadId,
  contactId,
  items,
}: {
  leadId?: string;
  contactId?: string;
  items: Item[];
}) {
  const parentId = childParentId(leadId, contactId);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);

  const notes = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <>
      <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">Notes</h2>
      <div className="p-3 md:p-4">
        <form action={createLeadNote} className="relative mb-4">
          <ChildParentFields leadId={leadId} contactId={contactId} />
          <input
            name="body"
            required
            placeholder="Add a note"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-11 text-sm text-ink-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
          />
          <button
            type="submit"
            title="Add note"
            aria-label="Add note"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-ink-900"
          >
            <Plus size={16} />
          </button>
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {notes.map((n) => (
              <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  {editing?.id === n.id ? (
                    <form
                      action={async (formData) => {
                        await updateLeadNote(formData);
                        setEditing(null);
                      }}
                      className="space-y-2"
                    >
                      <ChildParentFields leadId={leadId} contactId={contactId} />
                      <input type="hidden" name="id" value={n.id} />
                      <input
                        name="body"
                        required
                        defaultValue={n.body}
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="btn-cut bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-cut border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm text-ink-900">{n.body}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {n.owner.name} · {formatDateTime(n.createdAt)}
                      </p>
                    </>
                  )}
                </div>
                {editing?.id === n.id ? null : (
                  <div className="flex items-center gap-0">
                    <button
                      type="button"
                      title="Edit"
                      aria-label="Edit"
                      className="inline-flex h-7 w-6 items-center justify-center text-brand-700 hover:opacity-80"
                      onClick={() => setEditing(n)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      aria-label="Delete"
                      className="inline-flex h-7 w-6 items-center justify-center text-rose-600 hover:opacity-80"
                      onClick={() => setDeleting(n)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete note?"
        message={`This note will be removed from the ${contactId ? "Contact" : "Lead"}.`}
        onCancel={() => setDeleting(null)}
        action={deleteLeadNote.bind(null, deleting?.id ?? "", parentId)}
      />
    </>
  );
}
