import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuotes, type QuoteFormData } from "../hooks/use-quotes";
import { useQuoteCustomerHistory } from "../hooks/use-quote-customer-history";
import { useQuoteItemLines } from "../hooks/use-quote-item-lines";
import { QuoteCustomerHistoryPanel } from "../components/quote-customer-history-panel";
import { QuoteCustomerSection } from "../components/quote-customer-section";
import { QuoteItemLinesSection } from "../components/quote-item-lines-section";
import { useBranchScopedInventory } from "@commerce/inventory/hooks/use-branch-scoped-inventory";
import { useBranch } from "@common/hooks/use-branch";
import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";

const INITIAL_FORM: QuoteFormData = {
  localId: "",
  customerId: "",
  customerName: "",
  contactNumber: "",
  validUntil: "",
  createdByEmployeeId: "",
};

export const QuoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { quote, loading, saving, fetchQuote, fetchQuoteItems, createQuote, updateQuote, clearError } =
    useQuotes();
  const { workingBranchId } = useBranch();

  const [form, setForm] = useState<QuoteFormData>(INITIAL_FORM);

  // La cotizacion pertenece a form.localId -- mismo criterio que RepairNote,
  // no mostrar items de una sucursal distinta a la que cotiza.
  const quoteLocalId = form.localId || workingBranchId;
  const { items: inventoryItems, fetchAll: fetchInventory } = useBranchScopedInventory(quoteLocalId);

  const {
    itemLines,
    loadFromRecords,
    updateItemLine,
    handleInventoryItemChange,
    addItemLine,
    removeItemLine,
    buildItemsPayload,
  } = useQuoteItemLines(inventoryItems);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (isEdit && id) {
      fetchQuote(id);
      fetchQuoteItems(id).then(loadFromRecords);
    }
  }, [isEdit, id, fetchQuote, fetchQuoteItems]);

  useEffect(() => {
    if (quote && isEdit) {
      setForm({
        localId: quote.localId,
        customerId: quote.customerId ?? "",
        customerName: quote.customerName,
        contactNumber: quote.contactNumber ?? "",
        validUntil: quote.validUntil ?? "",
        createdByEmployeeId: quote.createdByEmployeeId ?? "",
      });
    }
  }, [quote, isEdit]);

  useEffect(() => {
    if (!isEdit && workingBranchId && !form.localId) {
      setForm((prev) => ({ ...prev, localId: workingBranchId }));
    }
  }, [isEdit, workingBranchId, form.localId]);

  const set = (field: keyof QuoteFormData, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const items = buildItemsPayload();
    if (isEdit && id) {
      const result = await updateQuote(id, form, items);
      if (result) navigate("/commerce/quotes");
    } else {
      const result = await createQuote(form, items);
      if (result) navigate("/commerce/quotes");
    }
  };

  // Panel de historial solo aplica editando una cotizacion con cliente real
  // seleccionado (customerId), nunca en alta ni con solo nombre libre.
  const showCustomerHistory = isEdit && Boolean(form.customerId);
  const { otherQuotes } = useQuoteCustomerHistory(showCustomerHistory ? form.customerId : null, id);

  if (loading && isEdit) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando cotización...</div>;
  }

  return (
    <PageShell
      title={isEdit ? "Editar cotización" : "Nueva cotización"}
      description={isEdit ? "Modifica los datos de la cotización." : "Genera una cotización para un cliente."}
    >

      <div className={showCustomerHistory ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : "mx-auto w-full max-w-2xl"}>
        <form onSubmit={handleSubmit} className={showCustomerHistory ? "space-y-6 lg:col-span-2" : "space-y-6"}>
          <QuoteCustomerSection
            customerId={form.customerId}
            customerName={form.customerName}
            contactNumber={form.contactNumber}
            validUntil={form.validUntil}
            createdByEmployeeId={form.createdByEmployeeId}
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
            onValidUntilChange={(value) => set("validUntil", value)}
            onCreatedByEmployeeIdChange={(value) => set("createdByEmployeeId", value)}
          />

          <QuoteItemLinesSection
            itemLines={itemLines}
            inventoryItems={inventoryItems}
            saving={saving}
            onInventoryItemChange={handleInventoryItemChange}
            onLineChange={updateItemLine}
            onAddLine={addItemLine}
            onRemoveLine={removeItemLine}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/commerce/quotes")} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cotización"}
            </Button>
          </div>
        </form>

        {showCustomerHistory && (
          <div className="lg:col-span-1 space-y-4">
            <QuoteCustomerHistoryPanel otherQuotes={otherQuotes} />
          </div>
        )}
      </div>
    </PageShell>
  );
};
