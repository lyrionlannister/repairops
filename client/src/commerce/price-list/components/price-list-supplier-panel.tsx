import { Boxes } from "lucide-react";
import { formatPrice } from "../utils/format";
import type { PriceListSupplierPanelProps } from "../props/price-list-supplier-panel-props";

// Contexto del proveedor elegido: sus otros productos ya cargados en la lista de
// precios (misma data que trae la page, filtrada por supplierId) -- sirve tanto al
// crear como al editar, apenas se elige un proveedor.
export const PriceListSupplierPanel: React.FC<PriceListSupplierPanelProps> = ({
  supplierName,
  otherItems,
}) => (
  <div className="lg:col-span-1">
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/10">
        <Boxes className="size-5 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Otros productos de {supplierName}
        </span>
        <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {otherItems.length}
        </h4>
      </div>
      {otherItems.length > 0 && (
        <ul className="mt-4 max-h-64 space-y-1.5 overflow-y-auto text-sm">
          {otherItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 text-gray-700 dark:text-gray-300"
            >
              <span className="truncate">
                {item.brand} {item.model}
              </span>
              <span className="shrink-0 font-medium text-gray-500 dark:text-gray-400">
                {formatPrice(item.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
