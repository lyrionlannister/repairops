import { useServerList } from "@common/hooks/use-server-list";
import type { PriceListItem } from "../types/price-list";

const SHOWN = 20;

// Panel lateral del formulario: cuantos productos mas tiene el proveedor y una muestra,
// sin descargar la lista de precios completa.
export const useSupplierPriceItems = (supplierId: string, excludeId?: string) => {
  const list = useServerList<PriceListItem>("/price-list", {
    filters: { supplierId },
    errorText: "No pudimos cargar los productos del proveedor.",
    enabled: Boolean(supplierId),
    initialPageSize: SHOWN + 1,
  });
  const otherItems = list.items.filter((item) => item.id !== excludeId).slice(0, SHOWN);
  const otherCount = Math.max(0, list.total - (list.items.some((item) => item.id === excludeId) ? 1 : 0));
  return { otherItems, otherCount };
};
