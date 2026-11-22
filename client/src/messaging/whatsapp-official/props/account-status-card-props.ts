import type { WhatsappAccountStatus } from "../types/whatsapp-account";

export interface AccountStatusCardProps {
  account: WhatsappAccountStatus | null;
  loading: boolean;
  canConnect: boolean;
  onConnect: () => void;
}
