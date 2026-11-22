import type { FC } from "react";
import { Mail, MapPin, Star } from "lucide-react";

import { Avatar } from "@ui/avatar/Avatar";
import type { UserSummaryCardProps } from "../props/user-summary-card-props";

export const UserSummaryCard: FC<UserSummaryCardProps> = ({ summary }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
    <div className="h-14 bg-linear-to-r from-brand-500 to-brand-400 dark:from-brand-600 dark:to-brand-500" />
    <div className="-mt-8 px-5 pb-5">
      <div className="w-fit rounded-full bg-white ring-4 ring-white dark:bg-gray-950 dark:ring-gray-950">
        <Avatar name={summary.fullName || "?"} size="xxlarge" />
      </div>

      <p className="mt-3 truncate text-base font-semibold text-gray-800 dark:text-white/90">
        {summary.fullName || "Nuevo usuario"}
      </p>
      <p className="flex items-center gap-1.5 truncate text-sm text-gray-500 dark:text-gray-400">
        <Mail className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{summary.email || "Sin email todavía"}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {summary.roleLabels.length > 0 ? (
          summary.roleLabels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-xs text-error-500">Sin rol</span>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-gray-400 uppercase">
          <MapPin className="size-3.5" aria-hidden />
          Sucursales
        </p>
        {summary.allBranches ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Todas las sucursales</p>
        ) : summary.branches.length > 0 ? (
          <ul className="space-y-1">
            {summary.branches.map((branch) => (
              <li
                key={branch.id}
                className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300"
              >
                <span className="truncate">{branch.name}</span>
                {branch.primary && (
                  <Star
                    className="size-3.5 shrink-0 fill-warning-400 text-warning-400"
                    aria-label="Principal"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-error-500">Sin sucursal asignada</p>
        )}
      </div>
    </div>
  </div>
);
