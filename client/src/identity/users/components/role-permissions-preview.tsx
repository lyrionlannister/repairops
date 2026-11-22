import type { FC } from "react";
import { Check, ChevronDown, ShieldCheck, UserRound } from "lucide-react";

import type { RolePermissionsPreviewProps } from "../props/role-permissions-preview-props";

export const RolePermissionsPreview: FC<RolePermissionsPreviewProps> = ({
  summary,
  loading,
  hasRoles,
  fullAccess,
}) => (
  <section
    aria-label="Permisos que otorgan los roles"
    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
  >
    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Qué podrá hacer</h3>

    {!hasRoles ? (
      <p className="mt-3 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Elige al menos un rol para ver sus permisos.
      </p>
    ) : loading ? (
      <div className="mt-3 space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-11 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
    ) : (
      <>
        {fullAccess && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
            <p className="text-sm text-brand-700 dark:text-brand-300">
              Acceso total: ve y administra todo el taller, en todas las sucursales.
            </p>
          </div>
        )}

        {summary.hasLimited && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <UserRound className="size-3.5 shrink-0 text-warning-500" aria-hidden />
            Solo lo que tenga asignado
          </p>
        )}

        <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          {summary.granted.map(({ key, label, icon: Icon, items }) => (
            <details key={key} className="group py-1" open={!fullAccess}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-lg px-1 [&::-webkit-details-marker]:hidden">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {label}
                </span>
                <span className="rounded-full bg-gray-100 px-2 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  {items.length}
                </span>
                <ChevronDown
                  className="size-4 text-gray-400 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <ul className="space-y-1 pb-2 pl-10">
                {items.map((item) => (
                  <li
                    key={item.permission}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    {item.limited ? (
                      <UserRound
                        className="mt-0.5 size-4 shrink-0 text-warning-500"
                        aria-label="Solo lo asignado"
                      />
                    ) : (
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" aria-hidden />
                    )}
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        {summary.missing.length > 0 && (
          <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Sin acceso a: {summary.missing.map((group) => group.label).join(", ")}.
          </p>
        )}
      </>
    )}
  </section>
);
