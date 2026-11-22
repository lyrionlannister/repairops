import type { FC } from "react";
import { Unlock, UserRound } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { formatMoney } from "../utils/format";
import type { OpenCashFormProps } from "../props/open-cash-form-props";

export const OpenCashForm: FC<OpenCashFormProps> = ({
  openingBalance,
  suggestedBalance,
  openerName,
  saving,
  onOpeningBalanceChange,
  onSubmit,
}) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
        <Unlock className="size-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Abrir caja</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay un turno abierto en esta sucursal.
        </p>
      </div>
    </div>
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div>
        <Label className="text-gray-500">Fondo inicial en efectivo</Label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-sm text-gray-400">
            $
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            className="pl-8!"
            value={openingBalance}
            onChange={(event) => onOpeningBalanceChange(event.target.value)}
            disabled={saving}
          />
        </div>
        {suggestedBalance !== null && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            En el último corte quedaron {formatMoney(suggestedBalance)} contados.{" "}
            {openingBalance !== suggestedBalance && (
              <button
                type="button"
                onClick={() => onOpeningBalanceChange(suggestedBalance)}
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Usar ese monto
              </button>
            )}
          </p>
        )}
      </div>
      <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
        <UserRound className="size-4 shrink-0 text-gray-400" aria-hidden />
        Se abrirá a nombre de <span className="font-medium">{openerName}</span>
      </p>
      <Button type="submit" variant="primary" className="min-h-11 w-full" disabled={saving}>
        {saving ? "Abriendo..." : "Abrir caja"}
      </Button>
    </form>
  </section>
);
