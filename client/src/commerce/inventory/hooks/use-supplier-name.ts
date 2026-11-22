import { useCallback, useEffect } from "react";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { usePermissions } from "@common/hooks/use-permissions";

// Sin suppliers.read (el técnico) no se piden proveedores: la API los rechazaría.
export const useSupplierName = () => {
  const { suppliers, fetchAll } = useSuppliers();
  const canRead = usePermissions().can("suppliers.read");

  useEffect(() => {
    if (canRead) fetchAll();
  }, [fetchAll, canRead]);

  return useCallback(
    (supplierId: string | null) => suppliers.find((s) => s.id === supplierId)?.name ?? "—",
    [suppliers],
  );
};
