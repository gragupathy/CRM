export function calendarDaysUntil(due: Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(due);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export function dueDateTone(due?: Date | string | null): "red" | "green" | null {
  if (!due) return null;
  const d = typeof due === "string" ? new Date(due) : due;
  if (Number.isNaN(d.getTime())) return null;
  const days = calendarDaysUntil(d);
  if (days < 2) return "red";
  if (days >= 3 && days <= 7) return "green";
  return null;
}

export function dueDateClass(due?: Date | string | null) {
  const tone = dueDateTone(due);
  if (tone === "red") return "glow-due-red bg-rose-50 text-rose-800";
  if (tone === "green") return "glow-due-green bg-emerald-50 text-emerald-800";
  return "bg-slate-100 text-slate-700";
}
