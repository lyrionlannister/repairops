import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useApiClient } from "@common/hooks/use-api-client";
import { useServiceTypes } from "@common/hooks/use-service-types";
import { STATUS_CONFIG } from "@commerce/repair-notes/hooks/use-repair-notes";
import { useCustomers } from "./use-customers";
import type { Customer } from "../types/customers";
import type { CustomerDeviceView } from "../types/customer-devices";

export const useCustomerDevicesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { apiClient } = useApiClient();
  const { devices, fetchDevices } = useCustomers();
  const { serviceTypes, fetchAll: fetchServiceTypes } = useServiceTypes();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([
      apiClient(`/customers/${id}`).then((res) => (res.ok ? (res.json() as Promise<Customer>) : null)),
      fetchDevices(id),
      fetchServiceTypes(),
    ])
      .then(([found]) => {
        if (active) setCustomer(found);
      })
      .catch(() => {
        if (active) setCustomer(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, apiClient, fetchDevices, fetchServiceTypes]);

  const deviceViews = useMemo<CustomerDeviceView[]>(() => {
    const nameById = new Map(serviceTypes.map((t) => [t.id, t.name]));
    return devices.map((device) => ({
      ...device,
      visits: (device.visits ?? []).map((visit) => {
        const status = STATUS_CONFIG[visit.status as keyof typeof STATUS_CONFIG];
        return {
          ...visit,
          serviceTypeNames: visit.serviceTypeIds
            .map((typeId) => nameById.get(typeId))
            .filter((n): n is string => Boolean(n)),
          statusLabel: status?.label ?? visit.status,
          statusClassName: status?.className ?? "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
        };
      }),
    }));
  }, [devices, serviceTypes]);

  const summary = useMemo(() => {
    const visits = devices.reduce((sum, d) => sum + d.notesCount, 0);
    const deviceLabel = `${devices.length} ${devices.length === 1 ? "equipo" : "equipos"}`;
    return `${customer?.name ?? ""} · ${deviceLabel}, ${visits} ${visits === 1 ? "visita" : "visitas"}`;
  }, [devices, customer?.name]);

  return { id, customer, loading, devices: deviceViews, summary };
};
