import type { FC } from "react";
import type { Customer } from "@commerce/customers/hooks/use-customers";
import { EmployeeSelect } from "@common/components/employee-select";
import { CustomerSelect } from "@common/components/customer-select";
import { Input } from "@ui/inputs/input";
import { DatePicker } from "@ui/date-picker/date-picker";
import { Label } from "@ui/inputs/label";

interface QuoteCustomerSectionProps {
  customerId: string;
  customerName: string;
  contactNumber: string;
  validUntil: string;
  createdByEmployeeId: string;
  saving: boolean;
  onCustomerChange: (customerId: string, customer: Customer | null) => void;
  onCustomerNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onValidUntilChange: (value: string) => void;
  onCreatedByEmployeeIdChange: (value: string) => void;
}

export const QuoteCustomerSection: FC<QuoteCustomerSectionProps> = ({
  customerId,
  customerName,
  contactNumber,
  validUntil,
  createdByEmployeeId,
  saving,
  onCustomerChange,
  onCustomerNameChange,
  onContactNumberChange,
  onValidUntilChange,
  onCreatedByEmployeeIdChange,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-4">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos del cliente</p>
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
        <Label className="text-gray-500">Número de contacto</Label>
        <Input
          placeholder="Ej. 833 123 4567"
          value={contactNumber}
          onChange={(e) => onContactNumberChange(e.target.value)}
          disabled={saving}
        />
      </div>
      <div>
        <Label className="text-gray-500">Válida hasta</Label>
        <DatePicker value={validUntil} onChange={onValidUntilChange} disabled={saving} />
      </div>
      <div>
        <Label className="text-gray-500">Generada por</Label>
        <EmployeeSelect value={createdByEmployeeId} onChange={onCreatedByEmployeeIdChange} disabled={saving} />
      </div>
    </div>
  </div>
);
