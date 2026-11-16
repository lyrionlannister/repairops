import { useEffect, useState } from "react";
import { useReturns, type SaleWithItems, type SaleListItem, type RefundMethod } from "../hooks/use-returns";
import { useInventory } from "@commerce/inventory/hooks/use-inventory";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useBranch } from "@common/hooks/use-branch";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useReturnRefund, type LineDraft } from "../hooks/use-return-refund";
import { SaleSearchPanel } from "../components/sale-search-panel";
import { ReturnLinesForm } from "../components/return-lines-form";
import { formatMoney, newIdempotencyKey } from "../utils/format";

export const ReturnPage: React.FC = () => {
  const { searching, searchError, saving, error, findSaleByNumber, findSaleById, listSalesByCustomer, getReturnedQuantities, create } =
    useReturns();
  const { activeBranchId } = useBranch();
  const { items: inventoryItems, fetchAll: fetchInventory } = useInventory();
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  const itemNames = Object.fromEntries(inventoryItems.map((i) => [i.id, i.name]));
  const { session: cashSession, loading: loadingCashSession, fetchOpenSession } = useCash();

  const [saleNumberInput, setSaleNumberInput] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSales, setCustomerSales] = useState<SaleListItem[]>([]);
  const [customerSaleId, setCustomerSaleId] = useState("");
  const [sale, setSale] = useState<SaleWithItems | null>(null);
  const [alreadyReturned, setAlreadyReturned] = useState<Record<string, number>>({});
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("efectivo");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Protege contra doble clic en "Confirmar devolución", mismo mecanismo que
  // venta rápida -- ReturnService.create devuelve la misma devolución en vez
  // de crear una segunda.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  useEffect(() => {
    if (activeBranchId) fetchOpenSession(activeBranchId);
  }, [activeBranchId, fetchOpenSession]);

  useEffect(() => {
    setCustomerSaleId("");
    if (!customerId) {
      setCustomerSales([]);
      return;
    }
    listSalesByCustomer(customerId).then(setCustomerSales);
  }, [customerId, listSalesByCustomer]);

  // Calcula alreadyReturned y lines ANTES de setSale -- si setSale corriera
  // primero, el render que sigue a ese await usaria "lines" todavia viejas
  // (de la venta anterior) contra los items de la venta nueva, y
  // lines.find(...)! regresaria undefined.
  const applySale = async (found: SaleWithItems | null) => {
    if (!found) {
      setSale(null);
      setLines([]);
      return;
    }
    const returned = await getReturnedQuantities(found.id);
    setAlreadyReturned(returned);
    setLines(found.items.map((item) => ({ saleItemId: item.id, quantity: "0", refundAmount: "0.00" })));
    setSale(found);
  };

  const handleSearch = async () => {
    const saleNumber = Number(saleNumberInput);
    if (!saleNumber) return;
    await applySale(await findSaleByNumber(saleNumber));
  };

  const handleSelectCustomerSale = async (saleId: string) => {
    setCustomerSaleId(saleId);
    if (!saleId) {
      await applySale(null);
      return;
    }
    await applySale(await findSaleById(saleId));
  };

  const updateLine = (saleItemId: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.saleItemId === saleItemId ? { ...l, ...patch } : l)));
  };

  const { activeLines, totalRefunded } = useReturnRefund(lines);

  const resetForm = () => {
    setSaleNumberInput("");
    setCustomerId("");
    setCustomerSales([]);
    setCustomerSaleId("");
    setSale(null);
    setLines([]);
    setReason("");
    setIdempotencyKey(newIdempotencyKey());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale || !cashSession || activeLines.length === 0 || !reason) return;

    const theReturn = await create({
      saleId: sale.id,
      cashSessionId: cashSession.id,
      refundMethod,
      reason,
      totalRefunded,
      idempotencyKey,
      items: activeLines.map((l) => ({
        saleItemId: l.saleItemId,
        quantity: Number(l.quantity),
        refundAmount: Number(l.refundAmount),
      })),
    });

    if (theReturn) {
      setSuccessMsg(`Devolución #${theReturn.returnNumber} registrada por ${formatMoney(theReturn.totalRefunded)}.`);
      resetForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <PageShell
      title="Devoluciones"
      description="Busca una venta por su folio para devolver una o más líneas. Nunca modifica la venta original."
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}
      {!loadingCashSession && !cashSession && (
        <Alert
          variant="warning"
          title="Sin sesión de caja"
          message="No hay una sesión de caja abierta para este local. Ábrela en Caja antes de devolver."
        />
      )}

      <SaleSearchPanel
        saleNumberInput={saleNumberInput}
        onSaleNumberInputChange={setSaleNumberInput}
        onSearch={handleSearch}
        searching={searching}
        customerId={customerId}
        onCustomerIdChange={setCustomerId}
        customerSales={customerSales}
        customerSaleId={customerSaleId}
        onSelectCustomerSale={handleSelectCustomerSale}
      />

      {searchError && <Alert variant="error" title="No encontrada" message={searchError} />}

      {sale && (
        <ReturnLinesForm
          sale={sale}
          lines={lines}
          alreadyReturned={alreadyReturned}
          itemNames={itemNames}
          refundMethod={refundMethod}
          reason={reason}
          totalRefunded={totalRefunded}
          saving={saving}
          canSubmit={Boolean(cashSession) && activeLines.length > 0 && Boolean(reason)}
          onLineChange={updateLine}
          onRefundMethodChange={setRefundMethod}
          onReasonChange={setReason}
          onSubmit={handleSubmit}
        />
      )}
    </PageShell>
  );
};
