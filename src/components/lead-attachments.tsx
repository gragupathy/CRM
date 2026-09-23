"use client";

import { useRef, useState } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import type { LeadAttachment, User } from "@prisma/client";
import { formatDate, formatFileSize } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  attachmentTooLargeAlert,
  attachmentTypeAlert,
  isAllowedAttachment,
} from "@/lib/attachment-rules";
import { createLeadAttachments, deleteLeadAttachment } from "@/app/(app)/leads/child-actions";
import { childNoun, childParentId } from "@/components/child-parent-field";

type Owner = Pick<User, "name">;
type Item = LeadAttachment & { owner: Owner };

function takeValidFiles(list: FileList | File[]) {
  const accepted: File[] = [];
  for (const file of Array.from(list)) {
    if (!isAllowedAttachment(file.name)) {
      window.alert(attachmentTypeAlert(file.name));
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      window.alert(attachmentTooLargeAlert(file.name));
      continue;
    }
    accepted.push(file);
  }
  return accepted;
}

export function LeadAttachments({
  leadId,
  contactId,
  items,
}: {
  leadId?: string;
  contactId?: string;
  items: Item[];
}) {
  const parentId = childParentId(leadId, contactId);
  const downloadHref = (id: string) =>
    contactId
      ? `/api/contacts/${contactId}/attachments/${id}`
      : `/api/leads/${leadId}/attachments/${id}`;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setFiles([]);
    setDragOver(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const next = takeValidFiles(list);
    if (!next.length) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...next.filter((f) => !names.has(`${f.name}-${f.size}`))];
    });
  }

  async function attach() {
    if (!files.length) {
      window.alert("Choose a file to attach.");
      return;
    }
    setPending(true);
    const data = new FormData();
    if (contactId) data.set("contactId", contactId);
    else data.set("leadId", leadId ?? "");
    files.forEach((file) => data.append("files", file));
    const result = await createLeadAttachments(data);
    setPending(false);
    if (result?.error) {
      window.alert(result.error);
      return;
    }
    close();
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 bg-slate-100 px-3 py-1.5 md:px-4">
        <h2 className="text-base font-semibold text-slate-800">Attachments</h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-cut inline-flex items-center border border-indigo-300 bg-white px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
        >
          Attach
        </button>
      </div>
      <div className="p-3 md:p-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No attachments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-sm font-bold text-slate-800">
                <tr>
                  <th className="py-2 pr-3 font-bold">File Name</th>
                  <th className="py-2 pr-3 font-bold">Attached By</th>
                  <th className="py-2 pr-3 font-bold">Date Added</th>
                  <th className="py-2 pr-3 font-bold">Size</th>
                  <th className="w-10 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3">
                      <a
                        href={downloadHref(a.id)}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {a.fileName}
                      </a>
                    </td>
                    <td className="py-2 pr-3">{a.owner.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatFileSize(a.size)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        title="Delete"
                        aria-label="Delete"
                        className="inline-flex h-7 w-6 items-center justify-center text-rose-600 hover:opacity-80"
                        onClick={() => setDeleting(a)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={close} />
          <div className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-ink-900">Attach File</h3>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`flex min-h-[7.5rem] w-full flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center ${
                dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-300"
              }`}
            >
              <Paperclip size={28} className="mb-2 text-indigo-500" strokeWidth={1.75} />
              {files.length ? (
                <ul className="w-full space-y-1 text-left text-sm text-slate-700">
                  {files.map((f) => (
                    <li key={`${f.name}-${f.size}`} className="truncate">
                      {f.name} · {formatFileSize(f.size)}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="text-sm font-medium text-indigo-600">Click to Upload or drag and drop</p>
                  <p className="mt-1 text-xs text-slate-400">Max. File size: 2 MB</p>
                </>
              )}
            </button>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn-cut border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                className="btn-cut bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
                onClick={attach}
              >
                {pending ? "Attaching…" : "Attach"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete attachment?"
        message={`${deleting?.fileName ?? "This file"} will be removed from this ${childNoun(contactId)}.`}
        onCancel={() => setDeleting(null)}
        action={deleteLeadAttachment.bind(null, deleting?.id ?? "", parentId)}
      />
    </>
  );
}
