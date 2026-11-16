import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useOfflineSalesQueue } from "../hooks/use-offline-sales-queue";
import { useBranchScopedInventory } from "../hooks/use-branch-scoped-inventory";
import { useSaleCart } from "../hooks/use-sale-cart";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useLocal } from "@app-platform/local/hooks/use-local";
import { useCustomers } from "@commerce/customers/hooks/use-customers";
import { useBranch } from "@common/hooks/use-branch";
import { EmployeeSelect } from "@common/components/employee-select";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { OfflineSalesQueueBanner } from "../components/offline-sales-queue-banner";
import { SaleCartLinesSection } from "../components/sale-cart-lines-section";
import { SaleCartTotals } from "../components/sale-cart-totals";
import { SalePaymentsSection } from "../components/sale-payments-section";
import { formatMoney } from "../utils/format";

export const QuickSalePage: React.FC = () => {
  const { queue: offlineQueue, isOnline, syncing, submitOrQueue, sync } = useOfflineSalesQueue();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeBranchId } = useBranch();
  // Solo items de la sucursal activa -- vender de otra sucursal decrementaria
  // stock que el cajero no puede ver ni reponer desde aqui.
  const { items: inventoryItems, fetchAll: fetchInventory } = useBranchScopedInventory(activeBranchId);
  const { session: cashSession, loading: loadingCashSession, fetchOpenSession } = useCash();
  const { local, fetchLocal } = useLocal();
  const { customers, fetchAll: fetchCustomers } = useCustomers();

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [createdByEmployeeId, setCreatedByEmployeeId] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const taxRate = Number(local?.taxRatePercent ?? 0);
  const {
    lines,
    payments,
    idempotencyKey,
    subtotal,
    taxAmount,
    total,
    paymentsSum,
    paymentsMatchTotal,
    hasCreditoWithoutCustomer,
    validLines,
    updateLine,
    handleItemChange,
    addLine,
    removeLine,
    updatePayment,
    addPayment,
    removePayment,
    reset: resetCart,
  } = useSaleCart({ taxRatePercent: taxRate, isOnline, inventoryItems, customerId });

  useEffect(() => {
    fetchInventory();
    fetchLocal();
    fetchCustomers();
  }, [fetchInventory, fetchLocal, fetchCustomers]);

  useEffect(() => {
    if (activeBranchId) fetchOpenSession(activeBranchId);
  }, [activeBranchId, fetchOpenSession]);

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setCreatedByEmployeeId("");
    resetCart();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranchId || !cashSession || !paymentsMatchTotal || hasCreditoWithoutCustomer) return;
    if (validLines.length === 0) return;

    const salePayload = {
      localId: activeBranchId,
      cashSessionId: cashSession.id,
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      createdByEmployeeId: createdByEmployeeId || undefined,
      idempotencyKey,
      payments: payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount) || 0,
        providerReference: p.providerReference || undefined,
        providerAuthorizationCode: p.providerAuthorizationCode || undefined,
      })),
      items: validLines.map((l) => ({
        lineType: "inventory_item" as const,
        referenceId: l.inventoryItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    };

    setCreating(true);
    setError(null);
    // Siempre se intenta el POST real primero -- navigator.onLine no detecta
    // "el server no responde", solo la interfaz de red del sistema. La cola
    // es el resultado de que la llamada de verdad haya fallado por red, no
    // una decision tomada de antemano por isOnline (ver use-offline-sales-queue).
    const result = await submitOrQueue(salePayload);
    setCreating(false);

    if ("sale" in result) {
      setSuccessMsg(`Venta #${result.sale.saleNumber} registrada por ${formatMoney(result.sale.totalValue)}.`);
      resetForm();
      fetchInventory();
      setTimeout(() => setSuccessMsg(null), 3500);
    } else if ("queued" in result) {
      setSuccessMsg(`Sin conexión: venta guardada como ${result.queued.localFolio}, se sincroniza sola al reconectar.`);
      resetForm();
      setTimeout(() => setSuccessMsg(null), 4500);
    } else {
      setError(result.error);
    }
  };

  return (
    <PageShell title="Venta Rápida" description="Venta de mostrador: cada item descuenta su stock automáticamente.">
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}
      {!isOnline && (
        <Alert
          variant="warning"
          title="Sin conexión"
          message="Solo se puede cobrar en efectivo. Las ventas se guardan en este equipo y se sincronizan solas al reconectar."
        />
      )}
      {offlineQueue.length > 0 && (
        <OfflineSalesQueueBanner offlineQueue={offlineQueue} isOnline={isOnline} syncing={syncing} onSync={sync} />
      )}
      {!loadingCashSession && !cashSession && (
        <Alert
          variant="warning"
          title="Sin sesión de caja"
          message="No hay una sesión de caja abierta para este local. Ábrela en Caja antes de cobrar."
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-gray-500">Nombre del cliente (opcional, solo para el ticket)</Label>
            <Input placeholder="Opcional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label className="text-gray-500">Empleado</Label>
            <EmployeeSelect value={createdByEmployeeId} onChange={setCreatedByEmployeeId} />
          </div>
        </div>

        <div>
          <Label className="text-gray-500">Cliente registrado (requerido para vender a crédito)</Label>
          <Select
            value={customerId}
            onChange={setCustomerId}
            placeholder="Sin cliente registrado"
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <SaleCartLinesSection
          lines={lines}
          inventoryItems={inventoryItems}
          onItemChange={handleItemChange}
          onLineChange={updateLine}
          onAddLine={addLine}
          onRemoveLine={removeLine}
        />

        <SaleCartTotals subtotal={subtotal} taxRate={taxRate} taxAmount={taxAmount} total={total} />

        <SalePaymentsSection
          payments={payments}
          isOnline={isOnline}
          paymentsSum={paymentsSum}
          paymentsMatchTotal={paymentsMatchTotal}
          hasCreditoWithoutCustomer={hasCreditoWithoutCustomer}
          total={total}
          onPaymentChange={updatePayment}
          onAddPayment={addPayment}
          onRemovePayment={removePayment}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={creating || !cashSession || !paymentsMatchTotal || hasCreditoWithoutCustomer}
        >
          <ShoppingCart className="mr-1.5 size-4" />
          {creating ? "Registrando..." : "Registrar venta"}
        </Button>
      </form>
    </PageShell>
  );
};
