import type { SelectOption } from "@common/types/select";
import type { AttributionOption } from "../types/local-page";

export const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "MXN", label: "Peso mexicano (MXN)" },
  { value: "USD", label: "Dólar estadounidense (USD)" },
];

export const TICKET_SIZE_OPTIONS: SelectOption[] = [
  { value: "58mm", label: "Térmico 58 mm" },
  { value: "80mm", label: "Térmico 80 mm" },
  { value: "letter", label: "Hoja carta" },
];

export const ATTRIBUTION_OPTIONS: AttributionOption[] = [
  {
    value: "total_value",
    label: "Total cobrado",
    description: "Todo lo que el cliente pagó por la nota o venta.",
  },
  {
    value: "margin",
    label: "Margen",
    description: "Lo cobrado menos el costo de las piezas usadas.",
  },
  {
    value: "labor_only",
    label: "Solo mano de obra",
    description: "Únicamente los servicios, sin piezas ni accesorios.",
  },
];
