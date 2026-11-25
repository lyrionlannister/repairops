import { useEffect, useMemo } from "react";

import { useCustomers } from "./use-customers";
import { useLayaways } from "./use-layaways";

export const useCustomerContext = (customerId: string | null) => {
  const { devices, creditBalances, fetchDevices, fetchCreditBalance } = useCustomers();
  const { layaways, fetchByCustomer: fetchLayaways } = useLayaways();

  useEffect(() => {
    if (!customerId) return;
    fetchCreditBalance(customerId);
    fetchDevices(customerId);
    fetchLayaways(customerId);
  }, [customerId, fetchCreditBalance, fetchDevices, fetchLayaways]);

  const credit = customerId ? creditBalances[customerId] : undefined;
  const creditLimit = credit?.creditLimit ?? 0;
  const creditBalance = credit?.balance ?? 0;
  const creditAvailable = credit?.available ?? creditLimit;
  const creditLoaded = Boolean(credit);

  const activeLayaways = useMemo(
    () =>
      customerId ? layaways.filter((l) => l.customerId === customerId && l.status === "open") : [],
    [layaways, customerId],
  );

  return { creditLimit, creditBalance, creditAvailable, creditLoaded, devices, activeLayaways };
};
