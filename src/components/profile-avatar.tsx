export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        title={name}
      >
        {initials(name) || "?"}
      </div>
      <span className="max-w-[10rem] truncate text-sm font-medium text-ink-800">{name}</span>
    </div>
  );
}
