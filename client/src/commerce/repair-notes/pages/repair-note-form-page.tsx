import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useBranch } from "@common/hooks/use-branch";
import { createInitialForm } from "../hooks/use-repair-notes";
import { localToday } from "@common/utils/local-date";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useRepairNoteCustomerHistory } from "../hooks/use-repair-note-customer-history";
import { useRepairNoteItemLines } from "../hooks/use-repair-note-item-lines";
import { useKnownBrands } from "../hooks/use-known-brands";
import { RepairNoteCustomerHistoryPanel } from "../components/repair-note-customer-history-panel";
import { RepairNoteForm, REPAIR_NOTE_FORM_STEPS } from "../components/repair-note-form";
import { useFormSteps } from "@common/hooks/use-form-steps";
import { noteToForm } from "../utils/note-to-form";
import { EMPTY_DEVICE, removeDeviceAt, updateDeviceAt } from "../utils/devices";
import type { AdvancePaymentInput, RepairNoteFormData, RepairNoteStatus } from "../types/repair-notes";
export const RepairNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    note,
    loading,
    saving,
    fetchNote,
    fetchNoteItems,
    createNote,
    updateNote,
    clearError,
  } = useRepairNotes();
  const knownBrands = useKnownBrands();
  const { workingBranchId } = useBranch();

  const [form, setForm] = useState<RepairNoteFormData>(createInitialForm);
  const [advanceMethod, setAdvanceMethod] = useState<AdvancePaymentInput["method"]>("efectivo");
  const [advanceEmployeeId, setAdvanceEmployeeId] = useState("");

  // La nota pertenece a form.localId (su propia sucursal, no necesariamente
  // la activa en el header al editar una nota de otra sucursal) -- las
  // refacciones a reservar deben salir del stock de esa misma sucursal.
  const noteLocalId = form.localId || workingBranchId;

  const {
    itemLines,
    loadFromRecords,
    updateItemLine,
    handleItemChange,
    addItemLine,
    removeItemLine,
    buildItemsPayload,
  } = useRepairNoteItemLines();

  useEffect(() => {
    if (!isEdit && workingBranchId) {
      setForm((prev) => (prev.localId ? prev : { ...prev, localId: workingBranchId }));
    }
  }, [isEdit, workingBranchId]);

  useEffect(() => {
    if (isEdit && id) {
      fetchNote(id);
      fetchNoteItems(id).then(loadFromRecords);
    }
  }, [isEdit, id, fetchNote, fetchNoteItems]);

  useEffect(() => {
    if (note && isEdit) {
      setForm(noteToForm(note));
    }
  }, [note, isEdit]);

  const set = (field: keyof RepairNoteFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const { step, isLast, formRef, next, back, goTo } = useFormSteps(REPAIR_NOTE_FORM_STEPS.length);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Enter en un paso intermedio avanza en lugar de guardar.
    if (!isLast) return next();
    clearError();
    const items = buildItemsPayload();
    if (isEdit && id) {
      const result = await updateNote(id, form, items);
      if (!result) return;
      navigate(`/commerce/repair-notes/${result.id}`, { state: { saved: "updated" } });
    } else {
      const hasAdvance = form.requiresAdvance && Number(form.advanceValue) > 0;
      const result = await createNote(
        form,
        items,
        hasAdvance ? { method: advanceMethod, createdByEmployeeId: advanceEmployeeId } : undefined,
      );
      if (result) navigate(`/commerce/repair-notes/${result.id}`, { state: { saved: "created" } });
    }
  };

  const showCustomerHistory = isEdit && Boolean(form.customerId);
  const { otherNotes } = useRepairNoteCustomerHistory(form.customerId || null, id);

  if (loading && isEdit) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando nota...
      </div>
    );
  }

  return (
    <PageShell
      title={isEdit ? `Editar nota #${note?.controlNumber ?? ""}` : "Nueva nota de reparación"}
      description={
        isEdit ? "Modifica los datos de la nota." : "Registra un nuevo equipo en el taller."
      }
    >
      <div
        className={
          showCustomerHistory ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : "mx-auto w-full max-w-2xl"
        }
      >
        <RepairNoteForm
          formRef={formRef}
          step={step}
          isLast={isLast}
          onStepClick={goTo}
          form={form}
          note={note}
          saving={saving}
          isEdit={isEdit}
          showCustomerHistory={showCustomerHistory}
          knownBrands={knownBrands}
          onCustomerChange={(customerId, customer) =>
            setForm((prev) => ({
              ...prev,
              customerId,
              customerName: customer ? customer.name : prev.customerName,
              contactNumber: customer ? (customer.phone ?? "") : prev.contactNumber,
            }))
          }
          onCustomerNameChange={(value) => set("customerName", value)}
          onContactNumberChange={(value) => set("contactNumber", value)}
          onDeviceChange={(index, patch) =>
            setForm((prev) => ({ ...prev, devices: updateDeviceAt(prev.devices, index, patch) }))
          }
          onAddDevice={() => setForm((prev) => ({ ...prev, devices: [...prev.devices, { ...EMPTY_DEVICE }] }))}
          onRemoveDevice={(index) => setForm((prev) => ({ ...prev, devices: removeDeviceAt(prev.devices, index) }))}
          onReceivedAtChange={(value) => set("receivedAt", value)}
          onDeliveryDateChange={(value) => set("deliveryDate", value)}
          onAssignedEmployeeIdChange={(value) => set("assignedEmployeeId", value)}
          onTechnicianNotesChange={(value) => set("technicianNotes", value)}
          onAdditionalFindingsChange={(value) => set("additionalFindings", value)}
          itemLines={itemLines}
          branchId={noteLocalId}
          onItemChange={handleItemChange}
          onLineChange={updateItemLine}
          onAddLine={addItemLine}
          onRemoveLine={removeItemLine}
          onTotalValueChange={(value) => set("totalValue", value)}
          onRequiresAdvanceToggle={() => set("requiresAdvance", !form.requiresAdvance)}
          onAdvanceValueChange={(value) => set("advanceValue", value)}
          advanceMethod={advanceMethod}
          onAdvanceMethodChange={(value) =>
            setAdvanceMethod(value as AdvancePaymentInput["method"])
          }
          advanceEmployeeId={advanceEmployeeId}
          onAdvanceEmployeeIdChange={setAdvanceEmployeeId}
          onHasWarrantyToggle={() => set("hasWarranty", !form.hasWarranty)}
          onHasExtendedWarrantyToggle={() => set("hasExtendedWarranty", !form.hasExtendedWarranty)}
          onExtendedWarrantyDaysChange={(value) => set("extendedWarrantyDays", value)}
          onStatusChange={(newStatus: RepairNoteStatus) =>
            setForm((prev) => ({
              ...prev,
              status: newStatus,
              deliveryDate:
                newStatus === "delivered" && !prev.deliveryDate
                  ? localToday()
                  : prev.deliveryDate,
            }))
          }
          onBack={back}
          onNext={next}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(isEdit && id ? `/commerce/repair-notes/${id}` : "/commerce/repair-notes")
          }
        />

        {showCustomerHistory && (
          <div className="lg:col-span-1 space-y-4">
            <RepairNoteCustomerHistoryPanel otherNotes={otherNotes} />
          </div>
        )}
      </div>
    </PageShell>
  );
};
