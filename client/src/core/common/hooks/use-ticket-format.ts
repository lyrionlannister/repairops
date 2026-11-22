import { useEffect, useState } from "react";
import type { TicketSize } from "../../../app_platform/local/types/local";
import type { TicketWidth } from "../types/ticket";

// Arranca en el formato por defecto del taller (Mi Local) en cuanto llega su configuración.
export const useTicketFormat = (defaultSize: TicketSize | undefined) => {
  const [ticketSize, setTicketSize] = useState<TicketSize | null>(null);

  useEffect(() => {
    if (defaultSize && ticketSize === null) setTicketSize(defaultSize);
  }, [defaultSize, ticketSize]);

  const size = ticketSize ?? "80mm";
  const pageWidthMm: TicketWidth = size === "58mm" ? 58 : 80;

  return { ticketSize: size, setTicketSize, isThermal: size !== "letter", pageWidthMm };
};
