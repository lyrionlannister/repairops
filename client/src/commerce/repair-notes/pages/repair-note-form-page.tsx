import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useBranchScopedInventory } from "@commerce/inventory/hooks/use-branch-scoped-inventory";
import { useCash, type CashMovementMethod } from "@commerce/cash/hooks/use-cash";
import { useBranch } from "@common/hooks/use-branch";
import {
  INITIAL_FORM,
  type RepairNoteFormData,
  type RepairNoteRecord,
  type RepairNoteStatus,
} from "../hooks/use-repair-notes";
import { Button } from "@ui/button/button";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useRepairNoteCustomerHistory } from "../hooks/use-repair-note-customer-history";
import { useRepairNoteItemLines } from "../hooks/use-repair-note-item-lines";
import { useKnownBrands } from "../hooks/use-known-brands";
import { RepairNoteCustomerHistoryPanel } from "../components/repair-note-customer-history-panel";
import { RepairNoteCustomerSection } from "../components/repair-note-customer-section";
import { RepairNoteDeviceSection } from "../components/repair-note-device-section";
import { RepairNoteDatesSection } from "../components/repair-note-dates-section";
import { RepairNoteItemLinesSection } from "../components/repair-note-item-lines-section";
import { RepairNoteCostSection, RepairNoteWarrantySection } from "../components/repair-note-cost-warranty-section";
import { RepairNoteStatusSection } from "../components/repair-note-status-section";
import { RepairNoteChargeModal } from "../components/repair-note-charge-modal";
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
    error,
    fetchNotes,
    fetchNote,
    fetchNoteItems,
    fetchNoteServiceTypeIds,
    createNote,
    updateNote,
    clearError,
  } = useRepairNotes();
  const knownBrands = useKnownBrands(notes);
  const { activeBranchId } = useBranch();
  const {
    session: cashSession,
    saving: cashSaving,
    error: cashError,
    fetchOpenSession,
    registerMovement,
    clearError: clearCashError,
  } = useCash();

  const [form, setForm] = useState<RepairNoteFormData>(INITIAL_FORM);
  const [initialServiceTypeIds, setInitialServiceTypeIds] = useState<string[]>([]);
  const [chargeNote, setChargeNote] = useState<RepairNoteRecord | null>(null);
  const [cashAmount, setCashAmount] = useState("0");
  const [cashMethod, setCashMethod] = useState<CashMovementMethod>("efectivo");
  const [cashEmployeeId, setCashEmployeeId] = useState("");

  // La nota pertenece a form.localId (su propia sucursal, no necesariamente
  // la activa en el header al editar una nota de otra sucursal) -- las
  // refacciones a reservar deben salir del stock de esa misma sucursal.
  const noteLocalId = form.localId || activeBranchId;
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
    if (!isEdit && activeBranchId) {
      setForm((prev) => (prev.localId ? prev : { ...prev, localId: activeBranchId }));
    }
  }, [isEdit, activeBranchId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const items = buildItemsPayload();
    if (isEdit && id) {
      const result = await updateNote(id, form, items);
      if (!result) return;
      const turningDelivered = form.status === "delivered" && note?.status !== "delivered";
      if (turningDelivered) {
        await fetchOpenSession(activeBranchId);
        // El anticipo ya se cobro al recibir el equipo: aqui solo se cobra el saldo.
        setCashAmount(String(Math.max(0, Number(result.totalValue) - Number(result.advanceValue ?? 0))));
        setCashEmployeeId(result.assignedEmployeeId ?? "");
        setChargeNote(result);
        return;
      }
      navigate("/app/repair-notes");
    } else {
      const result = await createNote(form, items);
      if (result) navigate("/app/repair-notes");
    }
  };

  const closeChargeModal = () => {
    setChargeNote(null);
    clearCashError();
    navigate("/app/repair-notes");
  };

  const handleRegisterCharge = async () => {
    if (!chargeNote || !cashSession) return;
    const ok = await registerMovement(cashSession.id, {
      type: "income",
      method: cashMethod,
      amount: Number(cashAmount) || 0,
      createdByEmployeeId: cashEmployeeId,
      relatedEntityType: "repair_note",
      relatedEntityId: chargeNote.id,
    });
    if (ok) closeChargeModal();
  };

  // Panel de historial solo aplica editando una nota con cliente real
  // seleccionado (customerId), nunca en alta ni con solo nombre libre.
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
      description={isEdit ? "Modifica los datos de la nota." : "Registra un nuevo equipo en el taller."}
    >
      {error && <Alert variant="error" title="Error" message={error} />}

      <div className={showCustomerHistory ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : "mx-auto w-full max-w-2xl"}>
        <form onSubmit={handleSubmit} className={showCustomerHistory ? "space-y-6 lg:col-span-2" : "space-y-6"}>
          <RepairNoteCustomerSection
            customerId={form.customerId}
            customerName={form.customerName}
            contactNumber={form.contactNumber}
            saving={saving}
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
          />

          <RepairNoteDeviceSection
            brand={form.brand}
            model={form.model}
            reportedFailure={form.reportedFailure}
            serviceTypeIds={form.serviceTypeIds}
            deviceOff={form.deviceOff}
            knownBrands={knownBrands}
            saving={saving}
            onBrandChange={(value) => set("brand", value)}
            onModelChange={(value) => set("model", value)}
            onReportedFailureChange={(value) => set("reportedFailure", value)}
            onServiceTypeIdsChange={(serviceTypeIds) => setForm((prev) => ({ ...prev, serviceTypeIds }))}
            onDeviceOffChange={(value) => set("deviceOff", value)}
          />

          <RepairNoteDatesSection
            receivedAt={form.receivedAt}
            deliveryDate={form.deliveryDate}
            assignedEmployeeId={form.assignedEmployeeId}
            technicianNotes={form.technicianNotes}
            additionalFindings={form.additionalFindings}
            isEdit={isEdit}
            saving={saving}
            onReceivedAtChange={(value) => set("receivedAt", value)}
            onDeliveryDateChange={(value) => set("deliveryDate", value)}
            onAssignedEmployeeIdChange={(value) => set("assignedEmployeeId", value)}
            onTechnicianNotesChange={(value) => set("technicianNotes", value)}
            onAdditionalFindingsChange={(value) => set("additionalFindings", value)}
          />

          <RepairNoteItemLinesSection
            itemLines={itemLines}
            inventoryItems={inventoryItems}
            saving={saving}
            onItemChange={handleItemChange}
            onLineChange={updateItemLine}
            onAddLine={addItemLine}
            onRemoveLine={removeItemLine}
          />

          <RepairNoteCostSection
            totalValue={form.totalValue}
            requiresAdvance={form.requiresAdvance}
            advanceValue={form.advanceValue}
            saving={saving}
            onTotalValueChange={(value) => set("totalValue", value)}
            onRequiresAdvanceToggle={() => set("requiresAdvance", !form.requiresAdvance)}
            onAdvanceValueChange={(value) => set("advanceValue", value)}
          />

          <RepairNoteWarrantySection
            hasWarranty={form.hasWarranty}
            hasExtendedWarranty={form.hasExtendedWarranty}
            extendedWarrantyDays={form.extendedWarrantyDays}
            saving={saving}
            onHasWarrantyToggle={() => set("hasWarranty", !form.hasWarranty)}
            onHasExtendedWarrantyToggle={() => set("hasExtendedWarranty", !form.hasExtendedWarranty)}
            onExtendedWarrantyDaysChange={(value) => set("extendedWarrantyDays", value)}
          />

          {isEdit && (
            <RepairNoteStatusSection
              status={form.status}
              saving={saving}
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
            />
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/app/repair-notes")} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear nota"}
            </Button>
          </div>
        </form>

        {showCustomerHistory && (
          <div className="lg:col-span-1 space-y-4">
            <RepairNoteCustomerHistoryPanel otherNotes={otherNotes} />
          </div>
        )}
      </div>

      <RepairNoteChargeModal
        isOpen={Boolean(chargeNote)}
        cashSession={cashSession}
        cashError={cashError}
        cashAmount={cashAmount}
        cashMethod={cashMethod}
        cashEmployeeId={cashEmployeeId}
        cashSaving={cashSaving}
        onClose={closeChargeModal}
        onCashAmountChange={setCashAmount}
        onCashMethodChange={setCashMethod}
        onCashEmployeeIdChange={setCashEmployeeId}
        onRegisterCharge={handleRegisterCharge}
      />
    </PageShell>
  );
};
