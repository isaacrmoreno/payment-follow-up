"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastKind = "default" | "error" | "success";

type ToastItem = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "default") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => {
      dismissToast(id);
    }, 3500);
  }, [dismissToast]);

  const value = useMemo(() => ({ toast }), [toast]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
  }, [toasts.length]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={[
              "flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow-lg backdrop-blur",
              item.kind === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : item.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-zinc-200 bg-white text-zinc-900",
            ].join(" ")}
          >
            <span>{item.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className="shrink-0 rounded-md px-1 text-base leading-none opacity-60 transition hover:opacity-100"
              aria-label="Dismiss toast"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
