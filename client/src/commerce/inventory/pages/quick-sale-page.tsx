import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@common/hooks/use-toast";
import { useOfflineSalesQueue } from "../hooks/use-offline-sales-queue";
import { useSaleCart } from "../hooks/use-sale-cart";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useLocal } from "@app-platform/local/hooks/use-local";
import { CustomerSelect } from "@common/components/customer-select";
import { useBranch } from "@common/hooks/use-branch";
import { EmployeeSelect } from "@common/components/employee-select";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { OfflineSalesQueueBanner } from "../components/offline-sales-queue-banner";
import { SaleCartLinesSection } from "../components/sale-cart-lines-section";
import { SaleCartTotals } from "../components/sale-cart-totals";
import { SalePaymentsSection } from "../components/sale-payments-section";

export const QuickSalePage: React.FC = () => {
  const { queue: offlineQueue, isOnline, syncing, submitOrQueue, sync } = useOfflineSalesQueue();
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
  const { workingBranchId } = useBranch();
  const { session: cashSession, loading: loadingCashSession, fetchOpenSession } = useCash();
  const { local, fetchLocal } = useLocal();

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [createdByEmployeeId, setCreatedByEmployeeId] = useState("");

  const taxRate = Number(local?.taxRatePercent ?? 0);
  const {
    lines,
    payments,
    idempotencyKey,
    applyTax,
    setApplyTax,
    subtotal,
    taxAmount,
    total,
    paymentsSum,
    paymentsMatchTotal,
    hasCreditoWithoutCustomer,
    hasCreditoWithoutDueDate,
    validLines,
    updateLine,
    handleItemChange,
    addLine,
    removeLine,
    updatePayment,
    addPayment,
    removePayment,
    reset: resetCart,
  } = useSaleCart({
    taxRatePercent: taxRate,
    isOnline,
    customerId,
  });

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  useEffect(() => {
    if (workingBranchId) fetchOpenSession(workingBranchId);
  }, [workingBranchId, fetchOpenSession]);

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setCreatedByEmployeeId("");
    resetCart();
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workingBranchId || !cashSession || !paymentsMatchTotal || hasCreditoWithoutCustomer || hasCreditoWithoutDueDate)
      return;
    if (validLines.length === 0) return;

    const salePayload = {
      localId: workingBranchId,
      cashSessionId: cashSession.id,
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      createdByEmployeeId: createdByEmployeeId || undefined,
      idempotencyKey,
      applyTax,
      payments: payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount) || 0,
        providerReference: p.providerReference || undefined,
        providerAuthorizationCode: p.providerAuthorizationCode || undefined,
        dueDate: p.method === "credito" ? p.dueDate : undefined,
      })),
      items: validLines.map((l) => ({
        lineType: "inventory_item" as const,
        referenceId: l.inventoryItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    };

    setCreating(true);
    // Siempre se intenta el POST real primero -- navigator.onLine no detecta
    // "el server no responde", solo la interfaz de red del sistema. La cola
    // es el resultado de que la llamada de verdad haya fallado por red, no
    // una decision tomada de antemano por isOnline (ver use-offline-sales-queue).
    const result = await submitOrQueue(salePayload);
    setCreating(false);

    if ("sale" in result) {
      resetForm();
    } else if ("queued" in result) {
      showToast({
        title: "Sin conexión",
        message: `Venta guardada como ${result.queued.localFolio}; se sincroniza sola al reconectar.`,
        variant: "info",
      });
      resetForm();
    }
  };

  return (
    <PageShell
      title="Venta Rápida"
      description="Venta de mostrador: cada producto descuenta su stock automáticamente."
    >
      {!isOnline && (
        <Alert
          variant="warning"
          title="Sin conexión"
          message="Solo se puede cobrar en efectivo. Las ventas se guardan en este equipo y se sincronizan solas al reconectar."
        />
      )}
      {offlineQueue.length > 0 && (
        <OfflineSalesQueueBanner
          offlineQueue={offlineQueue}
          isOnline={isOnline}
          syncing={syncing}
          onSync={sync}
        />
      )}
      {!loadingCashSession && !cashSession && (
        <Alert
          variant="warning"
          title="Sin sesión de caja"
          message="No hay una sesión de caja abierta para este local. Ábrela en Caja antes de cobrar."
        />
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-gray-500">
                Nombre del cliente (opcional, solo para el ticket)
              </Label>
              <Input
                placeholder="Opcional"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-500">Empleado</Label>
              <EmployeeSelect value={createdByEmployeeId} onChange={setCreatedByEmployeeId} />
            </div>
          </div>

          <div>
            <Label className="text-gray-500">
              Cliente registrado (requerido para vender a crédito)
            </Label>
            <CustomerSelect
              value={customerId}
              onChange={(id) => setCustomerId(id)}
              placeholder="Busca un cliente (opcional)"
            />
          </div>

          <SaleCartLinesSection
            lines={lines}
            branchId={workingBranchId}
            onItemChange={handleItemChange}
            onLineChange={updateLine}
            onAddLine={addLine}
            onRemoveLine={removeLine}
          />
        </div>

        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <SaleCartTotals
            subtotal={subtotal}
            taxRate={taxRate}
            taxAmount={taxAmount}
            total={total}
            applyTax={applyTax}
            onApplyTaxChange={setApplyTax}
          />

          <SalePaymentsSection
            payments={payments}
            isOnline={isOnline}
            paymentsSum={paymentsSum}
            paymentsMatchTotal={paymentsMatchTotal}
            hasCreditoWithoutCustomer={hasCreditoWithoutCustomer}
            hasCreditoWithoutDueDate={hasCreditoWithoutDueDate}
            total={total}
            onPaymentChange={updatePayment}
            onAddPayment={addPayment}
            onRemovePayment={removePayment}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={creating || !cashSession || !paymentsMatchTotal || hasCreditoWithoutCustomer || hasCreditoWithoutDueDate}
          >
            <ShoppingCart className="mr-1.5 size-4" />
            {creating ? "Registrando..." : "Registrar venta"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
};
