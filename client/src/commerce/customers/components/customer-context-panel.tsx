import { Wallet, TrendingUp, Smartphone, ShoppingBag } from "lucide-react";

import type { CustomerDeviceHistoryEntry } from "../hooks/use-customers";
import type { LayawayRecord } from "../hooks/use-layaways";
import { formatMoney } from "../utils/format";

interface CustomerContextPanelProps {
  creditLimit: number;
  creditBalance: number;
  creditAvailable: number;
  creditLoaded: boolean;
  devices: CustomerDeviceHistoryEntry[];
  activeLayaways: LayawayRecord[];
}

export const CustomerContextPanel: React.FC<CustomerContextPanelProps> = ({
  creditLimit,
  creditBalance,
  creditAvailable,
  creditLoaded,
  devices,
  activeLayaways,
}) => (
  <div className="lg:col-span-1 space-y-4">
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Crédito</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
            <Wallet className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Límite</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {creditLoaded ? formatMoney(creditLimit) : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
            <TrendingUp className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo usado</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {creditLoaded ? formatMoney(creditBalance) : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
            <Wallet className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Disponible</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {creditLoaded ? formatMoney(creditAvailable) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
        <Smartphone className="size-4 text-gray-400" />
        Historial de equipos
      </h3>
      {devices.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Sin equipos registrados.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {devices.map((d) => (
            <li key={`${d.controlNumber}-${d.brand}-${d.model}`} className="text-sm text-gray-600 dark:text-gray-300">
              {d.brand} {d.model} — última recepción {d.lastReceivedAt}, {d.notesCount} nota(s)
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
        <ShoppingBag className="size-4 text-gray-400" />
        Apartados activos
      </h3>
      {activeLayaways.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Sin apartados activos.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {activeLayaways.map((l) => (
            <li key={l.id} className="text-sm text-gray-600 dark:text-gray-300">
              Vence {l.expiresAt} — {formatMoney(l.totalValue)} (anticipo {formatMoney(l.depositAmount)})
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

