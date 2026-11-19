import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useBranchScopedInventory } from "@commerce/inventory/hooks/use-branch-scoped-inventory";
import { useBranch } from "@common/hooks/use-branch";
import {
  INITIAL_FORM,
  type AdvancePaymentInput,
  type RepairNoteFormData,
  type RepairNoteStatus,
} from "../hooks/use-repair-notes";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useRepairNoteCustomerHistory } from "../hooks/use-repair-note-customer-history";
import { useRepairNoteItemLines } from "../hooks/use-repair-note-item-lines";
import { useKnownBrands } from "../hooks/use-known-brands";
import { RepairNoteCustomerHistoryPanel } from "../components/repair-note-customer-history-panel";
import { RepairNoteForm, REPAIR_NOTE_FORM_STEPS } from "../components/repair-note-form";
import { useFormSteps } from "@common/hooks/use-form-steps";
import { noteToForm } from "../utils/note-to-form";

export const RepairNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    note,
    notes,
    loading,
    saving,
    fetchNotes,
    fetchNote,
    fetchNoteItems,
    fetchNoteServiceTypeIds,
    createNote,
    updateNote,
    clearError,
  } = useRepairNotes();
  const knownBrands = useKnownBrands(notes);
  const { workingBranchId } = useBranch();

  const [form, setForm] = useState<RepairNoteFormData>(INITIAL_FORM);
  const [initialServiceTypeIds, setInitialServiceTypeIds] = useState<string[]>([]);
  const [advanceMethod, setAdvanceMethod] = useState<AdvancePaymentInput["method"]>("efectivo");
  const [advanceEmployeeId, setAdvanceEmployeeId] = useState("");

  // La nota pertenece a form.localId (su propia sucursal, no necesariamente
  // la activa en el header al editar una nota de otra sucursal) -- las
  // refacciones a reservar deben salir del stock de esa misma sucursal.
  const noteLocalId = form.localId || workingBranchId;
  const { items: inventoryItems, fetchAll: fetchInventory } = useBranchScopedInventory(noteLocalId);

  const {
    itemLines,
    loadFromRecords,
    updateItemLine,
    handleItemChange,
    addItemLine,
    removeItemLine,
    buildItemsPayload,
  } = useRepairNoteItemLines(inventoryItems);

  useEffect(() => {
    fetchInventory();
    fetchNotes();
  }, [fetchInventory, fetchNotes]);

  useEffect(() => {
    if (!isEdit && workingBranchId) {
      setForm((prev) => (prev.localId ? prev : { ...prev, localId: workingBranchId }));
    }
  }, [isEdit, workingBranchId]);

  useEffect(() => {
    if (isEdit && id) {
      fetchNote(id);
      fetchNoteItems(id).then(loadFromRecords);
      fetchNoteServiceTypeIds(id).then(setInitialServiceTypeIds);
    }
  }, [isEdit, id, fetchNote, fetchNoteItems, fetchNoteServiceTypeIds]);

  useEffect(() => {
    if (note && isEdit) {
      setForm({ ...noteToForm(note), serviceTypeIds: initialServiceTypeIds });
    }
  }, [note, isEdit, initialServiceTypeIds]);

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
              contactNumber: customer ? customer.phone : prev.contactNumber,
            }))
          }
          onCustomerNameChange={(value) => set("customerName", value)}
          onContactNumberChange={(value) => set("contactNumber", value)}
          onBrandChange={(value) => set("brand", value)}
          onModelChange={(value) => set("model", value)}
          onReportedFailureChange={(value) => set("reportedFailure", value)}
          onServiceTypeIdsChange={(serviceTypeIds) =>
            setForm((prev) => ({ ...prev, serviceTypeIds }))
          }
          onDeviceOffChange={(value) => set("deviceOff", value)}
          onReceivedAtChange={(value) => set("receivedAt", value)}
          onDeliveryDateChange={(value) => set("deliveryDate", value)}
          onAssignedEmployeeIdChange={(value) => set("assignedEmployeeId", value)}
          onTechnicianNotesChange={(value) => set("technicianNotes", value)}
          onAdditionalFindingsChange={(value) => set("additionalFindings", value)}
          itemLines={itemLines}
          inventoryItems={inventoryItems}
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
                  ? new Date().toISOString().split("T")[0]
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
