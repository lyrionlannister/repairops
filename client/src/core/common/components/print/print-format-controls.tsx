import type { FC } from "react";
import { Printer } from "lucide-react";
import type { TicketSize } from "../../../../app_platform/local/types/local";
import type { PrintFormatControlsProps } from "../../props/print-preview-props";

export const PrintFormatControls: FC<PrintFormatControlsProps> = ({
  ticketSize,
  isThermal,
  onTicketSizeChange,
}) => (
  <div className="flex flex-wrap items-center gap-3 print:hidden">
    <select
      value={ticketSize}
      onChange={(event) => onTicketSizeChange(event.target.value as TicketSize)}
      className="min-h-11 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 md:min-h-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
    >
      <option value="58mm">Térmico 58mm</option>
      <option value="80mm">Térmico 80mm</option>
      <option value="letter">Carta</option>
    </select>
    {isThermal && (
      <button
        type="button"
        onClick={() => window.print()}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        <Printer className="size-4" />
        Imprimir
      </button>
    )}
  </div>
);
