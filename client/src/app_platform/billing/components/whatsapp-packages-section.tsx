import type { FC } from "react";
import { MessageSquarePlus, Settings } from "lucide-react";
import { Button } from "@ui/button/button";
import { formatMoney } from "../utils/format";
import type { WhatsappPackagesSectionProps } from "../props/whatsapp-packages-section-props";

export const WhatsappPackagesSection: FC<WhatsappPackagesSectionProps> = ({
  packages,
  loading,
  buyingSize,
  portalLoading,
  error,
  canManage,
  onBuy,
  onOpenPortal,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <div className="mb-1 flex items-center gap-2">
      <MessageSquarePlus className="size-5 text-brand-500" />
      <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">Paquetes de WhatsApp</h2>
    </div>
    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
      Mensajes extra para este mes, solo se usan cuando se agota la cuota de tu plan. No se acumulan
      al mes siguiente.
    </p>

    {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

    {loading ? (
      <p className="text-sm text-gray-400">Cargando paquetes...</p>
    ) : (
      <div className="grid gap-4 sm:grid-cols-3">
        {packages.map((pack) => (
          <div
            key={pack.size}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {pack.size.toLocaleString("es-MX")}
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                mensajes
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pack.price ? `${formatMoney(pack.price)} por única vez` : "Precio no disponible"}
            </p>
            <Button
              variant="primary"
              className="w-full"
              disabled={!canManage || pack.price === null || buyingSize !== null}
              onClick={() => onBuy(pack.size)}
            >
              {buyingSize === pack.size ? "Redirigiendo..." : "Comprar paquete"}
            </Button>
          </div>
        ))}
      </div>
    )}

    <div className="mt-5 flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        ¿Quieres cambiar tu plan o tu método de pago?
      </p>
      <Button variant="outline" disabled={!canManage || portalLoading} onClick={onOpenPortal}>
        <Settings className="size-4" />
        {portalLoading ? "Abriendo..." : "Gestionar suscripción"}
      </Button>
    </div>
  </div>
);
