import type { FC } from "react";
import { Store } from "lucide-react";
import type { LocalLetterheadPreviewProps } from "../props/local-letterhead-preview-props";

export const LocalLetterheadPreview: FC<LocalLetterheadPreviewProps> = ({
  name,
  phone,
  address,
  logo,
  accent,
}) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
    <div className="h-1.5" style={{ background: accent }} aria-hidden />
    <div className="flex items-center gap-4 p-4">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
        {logo ? (
          <img src={logo} alt="" className="size-full object-contain" />
        ) : (
          <Store className="size-6 text-gray-400" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-bold" style={{ color: accent }}>
          {name || "Nombre del local"}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {address || "Dirección del local"}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {phone ? `Tel. ${phone}` : "Teléfono"}
        </p>
      </div>
      <div className="ml-auto hidden shrink-0 text-right sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Nota de reparación
        </p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nº 0001</p>
      </div>
    </div>
  </div>
);
