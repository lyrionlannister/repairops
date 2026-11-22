export type TicketWidth = 58 | 80;

export interface TicketSizeSpec {
  pad: string;
  base: number;
  name: number;
  small: number;
  label: number;
  falla: number;
  folio: number;
  saldo: number;
  legal: number;
  logo: number;
  qr: string;
  barcode: number;
  barcodeH: number;
}

export interface TicketLocal {
  name?: string;
  address?: string;
  phone?: string;
  logo?: string;
}

export interface PdfPreviewState {
  url: string | null;
  loading: boolean;
  error: string | null;
  download: (filename: string) => void;
  openInTab: () => void;
}
