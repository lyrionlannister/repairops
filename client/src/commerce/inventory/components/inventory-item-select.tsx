import type { FC } from "react";
import { AsyncSearchSelect } from "@ui/async-search-select/async-search-select";
import { stockLabel } from "../utils/stock";
import type { InventoryItem } from "../types/inventory";
import type { InventoryItemSelectProps } from "../props/inventory-item-select-props";

// Busca productos en el servidor acotados a la sucursal que vende/reserva: elegir uno
// de otra sucursal descontaria el stock equivocado.
export const InventoryItemSelect: FC<InventoryItemSelectProps> = ({
  value,
  onSelect,
  branchId,
  blockOutOfStock = false,
  getLabel = stockLabel,
  placeholder = "Busca un producto por nombre o SKU",
  disabled,
  ariaLabel = "Producto",
}) => (
  <AsyncSearchSelect<InventoryItem>
    path="/inventory/lookup"
    filters={{ branchId: branchId ?? undefined }}
    resolvePath={(id) => `/inventory/${encodeURIComponent(id)}`}
    value={value}
    onSelect={onSelect}
    getId={(item) => item.id}
    getLabel={getLabel}
    isDisabled={blockOutOfStock ? (item) => item.id !== value && item.available <= 0 : undefined}
    placeholder={placeholder}
    ariaLabel={ariaLabel}
    disabled={disabled}
  />
);
