import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-8 py-16">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-slate-500">That record is missing or you do not have access.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-brand-700">
        Back to reports
      </Link>
    </div>
  );
}
