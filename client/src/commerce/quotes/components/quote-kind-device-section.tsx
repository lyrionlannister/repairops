import type { FC } from "react";
import type { QuoteKind } from "../hooks/use-quotes";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { ServiceTypeMultiSelect } from "@common/components/service-type-multi-select";

interface QuoteKindDeviceSectionProps {
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

export const QuoteKindDeviceSection: FC<QuoteKindDeviceSectionProps> = ({
  kind,
  brand,
  model,
  reportedFailure,
  serviceTypeIds,
  saving,
  disabled,
  onKindChange,
  onBrandChange,
  onModelChange,
  onReportedFailureChange,
  onServiceTypeIdsChange,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de cotización</p>
    <div className="flex gap-2">
      {(
        [
          { value: "product" as const, label: "Producto" },
          { value: "repair" as const, label: "Reparación" },
        ]
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled || saving}
          onClick={() => onKindChange(option.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            kind === option.value
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>

    {kind === "repair" && (
      <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-gray-500">
              Marca <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              placeholder="Ej. Samsung"
              value={brand}
              onChange={(e) => onBrandChange(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <Label className="text-gray-500">
              Modelo <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              placeholder="Ej. S7 Edge"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-gray-500">
              Falla reportada <span className="text-red-500">*</span>
            </Label>
            <TextArea
              required
              rows={3}
              placeholder="Describe la falla reportada por el cliente..."
              value={reportedFailure}
              onChange={(e) => onReportedFailureChange(e.target.value)}
              disabled={saving}
              className="mt-1.5"
            />
          </div>
        </div>
        <div>
          <Label className="text-gray-500">Tipos de servicio</Label>
          <ServiceTypeMultiSelect value={serviceTypeIds} onChange={onServiceTypeIdsChange} disabled={saving} />
        </div>
      </div>
    )}
  </div>
);
