import { round2 } from "../utils/format";

export type LineDraft = { saleItemId: string; quantity: string; refundAmount: string };

// Solo lineas con cantidad > 0 cuentan para el total a reembolsar -- el
// cajero deja las demas en 0 en vez de quitarlas de la lista.
export const useReturnRefund = (lines: LineDraft[]) => {
  const activeLines = lines.filter((l) => Number(l.quantity) > 0);
  const totalRefunded = round2(activeLines.reduce((sum, l) => sum + (Number(l.refundAmount) || 0), 0));
  return { activeLines, totalRefunded };
};
