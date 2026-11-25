import { useEffect, useState } from "react";
import {
  useReturns
} from "../hooks/use-returns";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useBranch } from "@common/hooks/use-branch";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useReturnRefund } from "../hooks/use-return-refund";
import { SaleSearchPanel } from "../components/sale-search-panel";
import { ReturnLinesForm } from "../components/return-lines-form";
import { newIdempotencyKey } from "../utils/format";
import type { SaleWithItems, SaleListItem, RefundMethod } from "../types/returns";
import type { LineDraft } from "../types/return-refund";

export const ReturnPage: React.FC = () => {
  const {
    searching,
    saving,
    findSaleByNumber,
    findSaleById,
    listSalesByCustomer,
    getReturnedQuantities,
    create,
  } = useReturns();
  const { workingBranchId } = useBranch();
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
  // Protege contra doble clic en "Confirmar devolución", mismo mecanismo que
  // venta rápida -- ReturnService.create devuelve la misma devolución en vez
  // de crear una segunda.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  useEffect(() => {
    if (workingBranchId) fetchOpenSession(workingBranchId);
  }, [workingBranchId, fetchOpenSession]);

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
    setLines(
      found.items.map((item) => ({ saleItemId: item.id, quantity: "0", refundAmount: "0.00" })),
    );
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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
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
      resetForm();
    }
  };

  return (
    <PageShell
      title="Devoluciones"
      description="Busca una venta por su folio para devolver una o más líneas. Nunca modifica la venta original."
    >
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

      {sale && (
        <ReturnLinesForm
          sale={sale}
          lines={lines}
          alreadyReturned={alreadyReturned}
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
