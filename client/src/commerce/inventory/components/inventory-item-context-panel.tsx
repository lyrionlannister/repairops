import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { InventoryMovement } from "../hooks/use-inventory";
import { formatDate, MOVEMENT_LABELS } from "../utils/format";

interface InventoryItemContextPanelProps {
  movements: InventoryMovement[];
  marginPercent: number | null;
}

export const InventoryItemContextPanel: React.FC<InventoryItemContextPanelProps> = ({ movements, marginPercent }) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-white/90">Historial de movimientos</h3>
      {movements.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Sin movimientos registrados.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
          {movements.map((movement) => (
            <li key={movement.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-white/90">
                {movement.type === "in" ? (
                  <ArrowUpCircle className="size-3.5 text-green-500" />
                ) : (
                  <ArrowDownCircle className="size-3.5 text-red-500" />
                )}
                {MOVEMENT_LABELS[movement.type]}
              </span>
              <span className="text-gray-500 dark:text-gray-400">{movement.quantity}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(movement.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>

    {marginPercent !== null && (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Margen</p>
        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">{marginPercent.toFixed(1)}%</p>
      </div>
    )}
  </div>
);

