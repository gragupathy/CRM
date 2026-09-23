"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { importLeadsFromFile } from "./actions";

const STEPS = ["Upload", "Actions", "Module - File Mapping", "Field Mapping", "Assign"];

export function ImportLeadsWizard({ error }: { error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  function takeFile(f?: File | null) {
    if (!f || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    inputRef.current.files = dt.files;
    setFile(f);
  }

  return (
    <form action={importLeadsFromFile} className="flex min-h-[70vh] flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900">Import Leads</h1>
        <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-400">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-3 py-1.5 ${
                i === 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100"
              }`}
            >
              {s}
            </li>
          ))}
        </ol>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          takeFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center ${
          drag ? "border-brand-500 bg-brand-50/40" : "border-slate-200 bg-white"
        }`}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-brand-500">
          <FileSpreadsheet size={32} />
        </div>
        <p className="text-sm text-slate-600">Drag and drop the files here</p>
        <p className="my-2 text-xs text-slate-400">- or -</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-brand-500 px-4 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".csv,.xls,.xlsx,.txt,.vcf"
          className="sr-only"
          onChange={(e) => takeFile(e.target.files?.[0])}
        />
        {file ? <p className="mt-3 text-sm font-medium text-slate-800">{file.name}</p> : null}
        <p className="mt-6 text-xs text-slate-500">Supported file formats are XLS, CSV, VCF and XLSX</p>
        <p className="mt-1 text-xs text-slate-500">
          Download sample file:{" "}
          <a href="/leads/import/sample?format=csv" className="text-brand-600 hover:underline">
            CSV
          </a>{" "}
          or{" "}
          <a href="/leads/import/sample?format=xls" className="text-brand-600 hover:underline">
            XLSX
          </a>
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-brand-600">Migrate Data from another CRM</span>
        <div className="flex gap-2">
          <Link
            href="/leads"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!file}
            className="rounded-lg bg-[#3d5afe] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </form>
  );
}
