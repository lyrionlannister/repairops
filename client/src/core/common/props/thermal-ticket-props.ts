import type { ReactNode } from "react";
import type { TicketLocal, TicketWidth } from "../types/ticket";

export interface ThermalTicketProps {
  local: TicketLocal | null;
  widthMm: TicketWidth;
  documentLabel: string;
  folio: string;
  dateLine: string;
  children: ReactNode;
}

export interface TicketDashedProps {
  margin: string;
}

export interface TicketLeaderProps {
  label: string;
  value: string;
  bold?: boolean;
}

export interface TicketBandProps {
  widthMm: TicketWidth;
  label: string;
  value: string;
}
