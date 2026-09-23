"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white p-6">
      <h2 className="font-semibold text-ink-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-brand-600 px-3 py-2 text-sm text-white"
      >
        Try again
      </button>
    </div>
  );
}
