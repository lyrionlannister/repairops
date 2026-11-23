import type { FC } from "react";
import { Pencil } from "lucide-react";

import { ScrollTable } from "@ui/table/scroll-table";
import { formatUsage, STATUS_LABELS } from "../utils/format";
import type { TenantsTableProps } from "../props/tenants-table-props";

const TH =
  "px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400";
const TD = "px-4 py-4 text-sm text-gray-500 dark:text-gray-400";

export const TenantsTable: FC<TenantsTableProps> = ({ tenants, onEdit }) => (
  <ScrollTable
    header={
      <tr className="border-b border-gray-200 dark:border-gray-800">
        <th className={TH}>Taller</th>
        <th className={TH}>Plan</th>
        <th className={TH}>Estado</th>
        <th className={TH}>Usuarios</th>
        <th className={TH}>Sucursales</th>
        <th className={TH}>Acciones</th>
      </tr>
    }
  >
    <tbody>
      {tenants.map((tenant) => (
        <tr
          key={tenant.tenantId}
          className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
        >
          <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
            {tenant.tenantName}
          </td>
          <td className={TD}>{tenant.plan?.name ?? "Sin plan (onboarding)"}</td>
          <td className={TD}>{STATUS_LABELS[tenant.status]}</td>
          <td className={TD}>{formatUsage(tenant.usage.users, tenant.limits?.users ?? null)}</td>
          <td className={TD}>
            {formatUsage(tenant.usage.branches, tenant.limits?.branches ?? null)}
          </td>
          <td className="px-4 py-4 text-right">
            <button
              onClick={() => onEdit(tenant.tenantId)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
              title="Cambiar plan"
            >
              <Pencil className="size-4" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </ScrollTable>
);
