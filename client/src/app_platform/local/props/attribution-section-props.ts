import type { AttributionBasis } from "../types/local-page";

export interface AttributionSectionProps {
  value: AttributionBasis;
  saving: boolean;
  message: string | null;
  onChange: (value: AttributionBasis) => void;
}
