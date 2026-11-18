import type { FC, RefObject } from "react";

import { Button } from "@ui/button/button";
import { Step, Stepper } from "@ui/stepper/stepper";

import type { Customer } from "@commerce/customers/hooks/use-customers";
import type { InventoryItem } from "@commerce/inventory/hooks/use-inventory";
import type {
  AdvancePaymentInput,
  RepairNoteFormData,
  RepairNoteRecord,
  RepairNoteStatus,
} from "../hooks/use-repair-notes";
import type { RepairNoteItemLine } from "../hooks/use-repair-note-item-lines";
import { RepairNoteCustomerSection } from "./repair-note-customer-section";
import { RepairNoteDeviceSection } from "./repair-note-device-section";
import { RepairNoteDatesSection } from "./repair-note-dates-section";
import { RepairNoteItemLinesSection } from "./repair-note-item-lines-section";
import { RepairNoteCostSection, RepairNoteWarrantySection } from "./repair-note-cost-warranty-section";
import { RepairNoteStatusSection } from "./repair-note-status-section";

export const REPAIR_NOTE_FORM_STEPS = ["Cliente", "Equipo", "Servicio", "Costo y garantía"];

interface RepairNoteFormProps {
  formRef: RefObject<HTMLFormElement | null>;
  step: number;
  isLast: boolean;
  onStepClick: (step: number) => void;
  form: RepairNoteFormData;
  note: RepairNoteRecord | null;
  saving: boolean;
  isEdit: boolean;
  showCustomerHistory: boolean;
  knownBrands: string[];
  onCustomerChange: (customerId: string, customer: Customer | null) => void;
  onCustomerNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onReportedFailureChange: (value: string) => void;
  onServiceTypeIdsChange: (serviceTypeIds: string[]) => void;
  onDeviceOffChange: (value: boolean) => void;
  onReceivedAtChange: (value: string) => void;
  onDeliveryDateChange: (value: string) => void;
  onAssignedEmployeeIdChange: (value: string) => void;
  onTechnicianNotesChange: (value: string) => void;
  onAdditionalFindingsChange: (value: string) => void;
  itemLines: RepairNoteItemLine[];
  inventoryItems: InventoryItem[];
  onItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<RepairNoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onTotalValueChange: (value: string) => void;
  onRequiresAdvanceToggle: () => void;
  onAdvanceValueChange: (value: string) => void;
  advanceMethod: AdvancePaymentInput["method"];
  onAdvanceMethodChange: (value: AdvancePaymentInput["method"]) => void;
  advanceEmployeeId: string;
  onAdvanceEmployeeIdChange: (value: string) => void;
  onHasWarrantyToggle: () => void;
  onHasExtendedWarrantyToggle: () => void;
  onExtendedWarrantyDaysChange: (value: string) => void;
  onStatusChange: (status: RepairNoteStatus) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const RepairNoteForm: FC<RepairNoteFormProps> = ({
  formRef,
  step,
  isLast,
  onStepClick,
  form,
  note,
  saving,
  isEdit,
  showCustomerHistory,
  knownBrands,
  onCustomerChange,
  onCustomerNameChange,
  onContactNumberChange,
  onBrandChange,
  onModelChange,
  onReportedFailureChange,
  onServiceTypeIdsChange,
  onDeviceOffChange,
  onReceivedAtChange,
  onDeliveryDateChange,
  onAssignedEmployeeIdChange,
  onTechnicianNotesChange,
  onAdditionalFindingsChange,
  itemLines,
  inventoryItems,
  onItemChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
  onTotalValueChange,
  onRequiresAdvanceToggle,
  onAdvanceValueChange,
  advanceMethod,
  onAdvanceMethodChange,
  advanceEmployeeId,
  onAdvanceEmployeeIdChange,
  onHasWarrantyToggle,
  onHasExtendedWarrantyToggle,
  onExtendedWarrantyDaysChange,
  onStatusChange,
  onBack,
  onNext,
  onSubmit,
  onCancel,
}) => (
  <form ref={formRef} onSubmit={onSubmit} className={showCustomerHistory ? "space-y-6 lg:col-span-2" : "space-y-6"}>
    <Stepper steps={REPAIR_NOTE_FORM_STEPS} current={step} onStepClick={onStepClick} />

    <Step index={0} current={step}>
      <RepairNoteCustomerSection
        customerId={form.customerId}
        customerName={form.customerName}
        contactNumber={form.contactNumber}
        saving={saving}
        onCustomerChange={onCustomerChange}
        onCustomerNameChange={onCustomerNameChange}
        onContactNumberChange={onContactNumberChange}
      />
    </Step>

    <Step index={1} current={step}>
      <RepairNoteDeviceSection
        brand={form.brand}
        model={form.model}
        reportedFailure={form.reportedFailure}
        serviceTypeIds={form.serviceTypeIds}
        deviceOff={form.deviceOff}
        knownBrands={knownBrands}
        saving={saving}
        onBrandChange={onBrandChange}
        onModelChange={onModelChange}
        onReportedFailureChange={onReportedFailureChange}
        onServiceTypeIdsChange={onServiceTypeIdsChange}
        onDeviceOffChange={onDeviceOffChange}
      />
    </Step>

    <Step index={2} current={step}>
      <RepairNoteDatesSection
        receivedAt={form.receivedAt}
        deliveryDate={form.deliveryDate}
        assignedEmployeeId={form.assignedEmployeeId}
        technicianNotes={form.technicianNotes}
        additionalFindings={form.additionalFindings}
        isEdit={isEdit}
        saving={saving}
        onReceivedAtChange={onReceivedAtChange}
        onDeliveryDateChange={onDeliveryDateChange}
        onAssignedEmployeeIdChange={onAssignedEmployeeIdChange}
        onTechnicianNotesChange={onTechnicianNotesChange}
        onAdditionalFindingsChange={onAdditionalFindingsChange}
      />

      <RepairNoteItemLinesSection
        itemLines={itemLines}
        inventoryItems={inventoryItems}
        saving={saving}
        onItemChange={onItemChange}
        onLineChange={onLineChange}
        onAddLine={onAddLine}
        onRemoveLine={onRemoveLine}
      />
    </Step>

    <Step index={3} current={step}>
      <RepairNoteCostSection
        totalValue={form.totalValue}
        requiresAdvance={form.requiresAdvance}
        advanceValue={form.advanceValue}
        saving={saving}
        onTotalValueChange={onTotalValueChange}
        onRequiresAdvanceToggle={onRequiresAdvanceToggle}
        onAdvanceValueChange={onAdvanceValueChange}
        advanceLocked={isEdit && Boolean(note?.requiresAdvance) && Number(note?.advanceValue) > 0}
        advanceMethod={isEdit ? undefined : advanceMethod}
        advanceEmployeeId={advanceEmployeeId}
        onAdvanceMethodChange={isEdit ? undefined : onAdvanceMethodChange}
        onAdvanceEmployeeChange={isEdit ? undefined : onAdvanceEmployeeIdChange}
      />

      <RepairNoteWarrantySection
        hasWarranty={form.hasWarranty}
        hasExtendedWarranty={form.hasExtendedWarranty}
        extendedWarrantyDays={form.extendedWarrantyDays}
        saving={saving}
        onHasWarrantyToggle={onHasWarrantyToggle}
        onHasExtendedWarrantyToggle={onHasExtendedWarrantyToggle}
        onExtendedWarrantyDaysChange={onExtendedWarrantyDaysChange}
      />

      {isEdit && (
        <RepairNoteStatusSection
          status={form.status}
          saving={saving}
          onStatusChange={onStatusChange}
        />
      )}
    </Step>

    <div className="flex justify-between gap-3">
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
            Atrás
          </Button>
        )}
        {isLast ? (
          <Button key="submit" type="submit" variant="primary" disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear nota"}
          </Button>
        ) : (
          <Button key="next" type="button" variant="primary" onClick={onNext}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  </form>
);
