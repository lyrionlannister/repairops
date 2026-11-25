import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Step, Stepper } from "@ui/stepper/stepper";
import { QuoteCustomerSection } from "./quote-customer-section";
import { QuoteKindDeviceSection } from "./quote-kind-device-section";
import { QuoteItemLinesSection } from "./quote-item-lines-section";
import type { QuoteFormProps } from "../props/quote-form-props";

export const QUOTE_FORM_STEPS = ["Cliente", "Tipo y equipo", "Productos"];
export const QuoteForm: FC<QuoteFormProps> = ({
  formRef,
  step,
  isLast,
  onStepClick,
  form,
  saving,
  isEdit,
  showCustomerHistory,
  onCustomerChange,
  onCustomerNameChange,
  onContactNumberChange,
  onValidUntilChange,
  onCreatedByEmployeeIdChange,
  onKindChange,
  onBrandChange,
  onModelChange,
  onReportedFailureChange,
  onServiceTypeIdsChange,
  itemLines,
  branchId,
  onInventoryItemChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
  onBack,
  onNext,
  onSubmit,
  onCancel,
}) => (
  <form
    ref={formRef}
    onSubmit={onSubmit}
    className={showCustomerHistory ? "space-y-6 lg:col-span-2" : "space-y-6"}
  >
    <Stepper steps={QUOTE_FORM_STEPS} current={step} onStepClick={onStepClick} />

    <Step index={0} current={step}>
      <QuoteCustomerSection
        customerId={form.customerId}
        customerName={form.customerName}
        contactNumber={form.contactNumber}
        validUntil={form.validUntil}
        createdByEmployeeId={form.createdByEmployeeId}
        saving={saving}
        onCustomerChange={onCustomerChange}
        onCustomerNameChange={onCustomerNameChange}
        onContactNumberChange={onContactNumberChange}
        onValidUntilChange={onValidUntilChange}
        onCreatedByEmployeeIdChange={onCreatedByEmployeeIdChange}
      />
    </Step>

    <Step index={1} current={step}>
      <QuoteKindDeviceSection
        kind={form.kind}
        brand={form.brand}
        model={form.model}
        reportedFailure={form.reportedFailure}
        serviceTypeIds={form.serviceTypeIds}
        saving={saving}
        disabled={isEdit}
        onKindChange={onKindChange}
        onBrandChange={onBrandChange}
        onModelChange={onModelChange}
        onReportedFailureChange={onReportedFailureChange}
        onServiceTypeIdsChange={onServiceTypeIdsChange}
      />
    </Step>

    <Step index={2} current={step}>
      <QuoteItemLinesSection
        itemLines={itemLines}
        branchId={branchId}
        saving={saving}
        onInventoryItemChange={onInventoryItemChange}
        onLineChange={onLineChange}
        onAddLine={onAddLine}
        onRemoveLine={onRemoveLine}
      />
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
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cotización"}
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
