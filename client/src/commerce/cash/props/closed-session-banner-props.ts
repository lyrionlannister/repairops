import type { CashSessionRecord } from "../types/cash";

export interface ClosedSessionBannerProps {
  closedSession: CashSessionRecord;
  onDismiss: () => void;
}
