import type { WhatsappPackageOption, WhatsappPackageSize } from "../types/whatsapp-package";

export interface WhatsappPackagesSectionProps {
  packages: WhatsappPackageOption[];
  loading: boolean;
  buyingSize: WhatsappPackageSize | null;
  portalLoading: boolean;
  error: string | null;
  canManage: boolean;
  onBuy: (size: WhatsappPackageSize) => void;
  onOpenPortal: () => void;
}
