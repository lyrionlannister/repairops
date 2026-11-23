import type { FC } from "react";
import { Smartphone } from "lucide-react";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useCustomerDevicesPage } from "../hooks/use-customer-devices-page";
import { CustomerDeviceCard } from "../components/customer-device-card";

export const CustomerDevicesPage: FC = () => {
  const { customer, loading, devices, summary } = useCustomerDevicesPage();

  if (!customer) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {loading ? "Cargando historial..." : "Cliente no encontrado."}
      </div>
    );
  }

  return (
    <PageShell
      scrollHeader
      title="Historial de equipos"
      description={summary}
    >
      {devices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/3">
          <Smartphone className="size-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Este cliente todavía no tiene notas de reparación registradas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
          {devices.map((device) => (
            <CustomerDeviceCard key={`${device.brand}-${device.model}`} device={device} />
          ))}
        </div>
      )}
    </PageShell>
  );
};
