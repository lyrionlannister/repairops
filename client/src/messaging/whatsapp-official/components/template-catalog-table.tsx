import type { FC } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ScrollTable } from "@ui/table/scroll-table";
import { Badge } from "@ui/badge/badge";
import { formatSyncedAt, STATUS_BADGE } from "../utils/format";
import type { TemplateCatalogTableProps } from "../props/template-catalog-table-props";

const TH = "px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400";

export const TemplateCatalogTable: FC<TemplateCatalogTableProps> = ({
  entries,
  statusByEntryId,
  readOnly,
  onEdit,
  onDelete,
}) => (
  <ScrollTable
    header={
      <tr>
        <th className={TH}>Plantilla</th>
        <th className={TH}>Categoría</th>
        {statusByEntryId && (
          <>
            <th className={TH}>Status en Meta</th>
            <th className={TH}>Última sincronización</th>
          </>
        )}
        {!readOnly && <th className={TH}>Acciones</th>}
      </tr>
    }
  >
    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
      {entries.map((entry) => {
        const liveStatus = statusByEntryId?.get(entry.id);
        const badge = liveStatus ? STATUS_BADGE[liveStatus.status] : null;
        return (
          <tr key={entry.id}>
            <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
              <div className="min-w-0 text-right xl:text-left">
                <div className="font-medium">{entry.key}</div>
                <div className="text-xs text-gray-400">{entry.metaName}</div>
                {entry.triggerEvent && (
                  <div className="mt-0.5 text-xs text-gray-400">
                    Disparador automático: {entry.triggerEvent}
                  </div>
                )}
                {!entry.enabled && <Badge color="error">Deshabilitada</Badge>}
              </div>
            </td>
            <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{entry.category}</td>
            {statusByEntryId && (
              <>
                <td className="px-5 py-4">
                  {badge ? (
                    <Badge color={badge.color}>{badge.label}</Badge>
                  ) : (
                    <span className="text-xs text-gray-400">Sin sincronizar</span>
                  )}
                </td>
                <td className="px-5 py-4 text-xs text-gray-400">
                  {formatSyncedAt(liveStatus?.lastSyncedAt)}
                </td>
              </>
            )}
            {!readOnly && (
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-brand-500"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-error-500"
                    aria-label="Borrar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </td>
            )}
          </tr>
        );
      })}
    </tbody>
  </ScrollTable>
);
