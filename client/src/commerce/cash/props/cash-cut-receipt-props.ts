import type { TicketLocal, TicketWidth } from "@common/types/ticket";
import type { CashCutDetail } from "../types/cash";

export interface CashCutReceiptProps {
  detail: CashCutDetail;
  local: TicketLocal | null;
  widthMm: TicketWidth;
}
