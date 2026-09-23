"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const triggerClass =
  "flex w-full items-center justify-between border-0 border-b border-slate-300 bg-white px-0 py-1.5 text-left text-sm text-ink-900 outline-none focus:border-brand-600";

export function UnderlineChoice({
  name,
  value,
  options,
  placeholder = "-Select-",
  onChange,
  allowEmpty = true,
}: {
  name: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange?: (value: string) => void;
  allowEmpty?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<number>(0);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function selectByTypeahead(key: string) {
    window.clearTimeout(timerRef.current);
    const letter = key.toLowerCase();
    const prev = bufferRef.current;
    const cycling =
      (prev.length === 1 && prev === letter) ||
      (prev === "" && Boolean(value) && value.toLowerCase().startsWith(letter));
    const buffer = cycling ? letter : prev + letter;
    bufferRef.current = buffer;
    timerRef.current = window.setTimeout(() => {
      bufferRef.current = "";
    }, 800);

    const from = cycling ? Math.max(0, options.findIndex((o) => o === value)) + 1 : 0;
    const ordered = cycling
      ? [...options.slice(from), ...options.slice(0, from)]
      : options;
    const match = ordered.find((o) => o.toLowerCase().startsWith(buffer));
    if (!match) return;
    onChange?.(match);
    setOpen(true);
    window.requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-opt="${CSS.escape(match)}"]`);
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const i = options.findIndex((o) => o === value);
      const next =
        e.key === "ArrowDown"
          ? options[Math.min(options.length - 1, Math.max(0, i) + (i < 0 ? 0 : 1))]
          : options[Math.max(0, (i < 0 ? 0 : i) - 1)];
      if (next) onChange?.(next);
      return;
    }
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      selectByTypeahead(e.key);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
      >
        <span className={value ? "text-ink-900" : "text-slate-400"}>{value || placeholder}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {allowEmpty ? (
            <li>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-50"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
              >
                {placeholder}
              </button>
            </li>
          ) : null}
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                data-opt={opt}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                  opt === value ? "bg-sky-50 font-medium text-sky-800" : "text-ink-900"
                }`}
                onClick={() => {
                  onChange?.(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
