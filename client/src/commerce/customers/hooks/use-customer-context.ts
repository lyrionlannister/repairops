import { useEffect, useMemo } from "react";

import { useCustomers } from "./use-customers";
import { useLayaways } from "./use-layaways";

/**
 * Datos de contexto de un cliente (crédito, equipos, apartados) para la ficha de edición.
 * Hace el fetch, filtra y calcula; el componente que lo pinta solo recibe el resultado.
 */
export const useCustomerContext = (customerId: string | null) => {
  const { devices, creditBalances, fetchDevices, fetchCreditBalance } = useCustomers();
  const { layaways, fetchAll: fetchLayaways } = useLayaways();

  useEffect(() => {
    if (!customerId) return;
    fetchCreditBalance(customerId);
    fetchDevices(customerId);
    fetchLayaways();
  }, [customerId, fetchCreditBalance, fetchDevices, fetchLayaways]);

  const credit = customerId ? creditBalances[customerId] : undefined;
  const creditLimit = credit?.creditLimit ?? 0;
  const creditBalance = credit?.balance ?? 0;
  const creditAvailable = credit?.available ?? creditLimit;
  const creditLoaded = Boolean(credit);

  const activeLayaways = useMemo(
    () => (customerId ? layaways.filter((l) => l.customerId === customerId && l.status === "open") : []),
    [layaways, customerId],
  );

  return { creditLimit, creditBalance, creditAvailable, creditLoaded, devices, activeLayaways };
};
