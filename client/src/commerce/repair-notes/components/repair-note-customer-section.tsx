import type { FC } from "react";
import type { Customer } from "@commerce/customers/hooks/use-customers";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { CustomerSelect } from "@common/components/customer-select";
import { SectionTitle } from "./section-title";

interface RepairNoteCustomerSectionProps {
  customerId: string;
  customerName: string;
  contactNumber: string;
  saving: boolean;
  onCustomerChange: (customerId: string, customer: Customer | null) => void;
  onCustomerNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
}

export const RepairNoteCustomerSection: FC<RepairNoteCustomerSectionProps> = ({
  customerId,
  customerName,
  contactNumber,
  saving,
  onCustomerChange,
  onCustomerNameChange,
  onContactNumberChange,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <SectionTitle>Datos del cliente</SectionTitle>
    <div>
      <Label className="text-gray-500">Cliente existente</Label>
      <CustomerSelect value={customerId} onChange={onCustomerChange} disabled={saving} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          required
          placeholder="Nombre del cliente"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">
          Teléfono {!customerId && <span className="text-red-500">*</span>}
        </Label>
        <Input
          required={!customerId}
          placeholder="Ej. 833 123 4567"
          value={contactNumber}
          onChange={(e) => onContactNumberChange(e.target.value)}
          disabled={saving}
        />
      </div>
    </div>
  </div>
);
