import type { ReactNode } from "react";
import type { TicketSize } from "../../../app_platform/local/types/local";
import type { PdfPreviewState, TicketWidth } from "../types/ticket";

export interface PrintPreviewProps {
  isThermal: boolean;
  pageWidthMm: TicketWidth;
  pdf: PdfPreviewState;
  pdfTitle: string;
  pdfFilename: string;
  children: ReactNode;
}

export interface PrintFormatControlsProps {
  ticketSize: TicketSize;
  isThermal: boolean;
  onTicketSizeChange: (size: TicketSize) => void;
}
