export function AuthSplit({
  kicker,
  title,
  lines,
  children,
}: {
  kicker?: string;
  title: string;
  lines: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      <aside className="relative flex flex-col justify-between bg-ink-950 px-10 py-12 text-white md:min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,138,110,0.35),transparent_45%),radial-gradient(circle_at_90%_80%,rgba(31,138,110,0.18),transparent_40%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold">
              HM
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">HM CRM</p>
              <p className="text-xs text-white/60">Sales workspace</p>
            </div>
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            {kicker ?? "Close more, chase less"}
          </p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">{title}</h1>
          <ul className="mt-8 max-w-sm space-y-3 text-sm leading-relaxed text-white/70">
            {lines.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-white/40">Built for your team. Hosted when you are ready.</p>
      </aside>
      <section className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">{children}</div>
      </section>
    </div>
  );
}
