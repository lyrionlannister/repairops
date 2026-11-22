import type { QuoteKind } from "../types/quotes";

export interface QuoteKindDeviceSectionProps {
  kind: QuoteKind;
  brand: string;
  model: string;
  reportedFailure: string;
  serviceTypeIds: string[];
  saving: boolean;
  disabled?: boolean;
  onKindChange: (kind: QuoteKind) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onReportedFailureChange: (value: string) => void;
  onServiceTypeIdsChange: (serviceTypeIds: string[]) => void;
}
