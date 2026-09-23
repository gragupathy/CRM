import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function SortHeader({
  label,
  column,
  sort,
  dir,
  hrefFor,
}: {
  label: string;
  column: string;
  sort: string;
  dir: "asc" | "desc";
  hrefFor: (sort: string, dir: "asc" | "desc") => string;
}) {
  const active = sort === column;
  const nextDir: "asc" | "desc" = active && dir === "asc" ? "desc" : "asc";
  return (
    <Link
      href={hrefFor(column, nextDir)}
      className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
    >
      {label}
      <span className="inline-flex flex-col leading-none">
        <ChevronUp
          size={12}
          strokeWidth={2.5}
          className={cn("-mb-0.5", active && dir === "asc" ? "text-brand-600" : "text-slate-300")}
        />
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={cn("-mt-0.5", active && dir === "desc" ? "text-brand-600" : "text-slate-300")}
        />
      </span>
    </Link>
  );
}

export function ListPager({
  page = 1,
  pageCount = 1,
  total,
  prevHref,
  nextHref,
  totalLabel = "Total Records",
}: {
  page?: number;
  pageCount?: number;
  from?: number;
  to?: number;
  total: number;
  prevHref?: string | null;
  nextHref?: string | null;
  totalLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>
        {totalLabel} {total}
      </span>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300">
            <ChevronLeft size={18} />
          </span>
        )}
        <span>
          {page} to {pageCount}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300">
            <ChevronRight size={18} />
          </span>
        )}
      </div>
    </div>
  );
}
