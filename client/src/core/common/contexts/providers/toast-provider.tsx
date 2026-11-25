import { useCallback, useMemo, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { ToastContext } from "../toast-context";
import type { ToastInput, ToastVariant } from "../../types/toast-context";
import type { ToastItem } from "../../types/toast-provider";

const iconByVariant: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const iconToneByVariant: Record<ToastVariant, string> = {
  success: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  info: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = "info", durationMs }: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);

      setToasts((prev) => [...prev, { id, title, message, variant }]);
      // Un error trae algo que corregir: se queda el doble para alcanzar a leerlo.
      window.setTimeout(() => removeToast(id), durationMs ?? (variant === "error" ? 7000 : 3200));
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 top-4 z-100000 flex flex-col gap-3 sm:inset-x-auto sm:top-20 sm:right-4 sm:w-[380px]">
        {toasts.map((toast) => {
          const Icon = iconByVariant[toast.variant];

          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className="toast-enter pointer-events-auto flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5 ${iconToneByVariant[toast.variant]}`}
              >
                <Icon />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {toast.title}
                </p>
                {toast.message ? (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{toast.message}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Cerrar notificación"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
