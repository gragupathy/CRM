"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X } from "lucide-react";

type ToastKind = "success" | "info";
type Toast = { id: number; message: string; kind: ToastKind };
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ShowToast>(
    (message, kind = "success") => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, message, kind }]);
      window.setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex min-w-[16rem] max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === "info" ? "bg-sky-600" : "bg-emerald-600"
            }`}
            role="status"
          >
            <p className="flex-1 pt-0.5">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="shrink-0 rounded-md p-0.5 text-white/80 hover:bg-white/15 hover:text-white"
              onClick={() => dismiss(t.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
