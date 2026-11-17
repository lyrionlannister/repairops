import type { FC } from "react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { formatMoney } from "../utils/format";

interface CustomerCreditCardProps {
  limit: number;
  balance: number;
  available: number;
  usedPct: number;
  draft: string;
  dirty: boolean;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}

// Crédito del cliente: cuánto puede deber (límite editable), cuánto debe ya y cuánto le queda.
export const CustomerCreditCard: FC<CustomerCreditCardProps> = ({
  limit,
  balance,
  available,
  usedPct,
  draft,
  dirty,
  saving,
  onDraftChange,
  onSave,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Crédito</h3>

    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
      {[
        { label: "Límite", value: formatMoney(limit) },
        { label: "Debe", value: formatMoney(balance), tone: balance > 0 ? "text-red-600 dark:text-red-400" : "" },
        { label: "Disponible", value: formatMoney(available) },
      ].map(({ label, value, tone }) => (
        <div key={label} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`mt-1 text-sm font-bold text-gray-800 dark:text-white/90 ${tone ?? ""}`}>{value}</p>
        </div>
      ))}
    </div>

    <div className="mt-4">
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div
          className={`h-full rounded-full ${usedPct >= 90 ? "bg-red-500" : "bg-brand-500"}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        {limit > 0 ? `${Math.round(usedPct)}% del límite en uso` : "Sin crédito: no se le puede fiar."}
      </p>
    </div>

    <form
      className="mt-5 flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="flex-1">
        <Label className="text-gray-500">Límite de crédito ($)</Label>
        <Input type="number" min="0" step="0.01" value={draft} onChange={(e) => onDraftChange(e.target.value)} disabled={saving} />
      </div>
      <Button type="submit" variant="primary" disabled={saving || !dirty}>
        {saving ? "Guardando..." : "Guardar límite"}
      </Button>
    </form>
  </div>
);
