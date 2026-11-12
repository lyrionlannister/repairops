import { useEffect, useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { useSales, type PaymentMethod } from "../hooks/use-sales";
import { useInventory } from "../hooks/use-inventory";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useLocal } from "@app-platform/local/hooks/use-local";
import useBranch from "@common/hooks/use-branch";
import EmployeeSelect from "@common/components/employee-select";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import Alert from "@ui/alert/alert";
import PageMeta from "@common/pages/page-meta";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

type LineItem = { inventoryItemId: string; quantity: string; unitPrice: string };
type PaymentLine = { method: PaymentMethod; amount: string; providerReference: string; providerAuthorizationCode: string };

const emptyLine: LineItem = { inventoryItemId: "", quantity: "1", unitPrice: "" };
const emptyPayment = (amount: string): PaymentLine => ({
  method: "efectivo",
  amount,
  providerReference: "",
  providerAuthorizationCode: "",
});

const formatMoney = (v: number) => `$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
// Redondeo a centavos para comparar -- evita que 0.1 + 0.2 nunca cuadre
// exacto en el navegador (misma razón por la que el server usa Decimal).
const round2 = (v: number) => Math.round(v * 100) / 100;

const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const QuickSalePage: React.FC = () => {
  const { creating, error, create } = useSales();
  const { items: inventoryItems, fetchAll: fetchInventory } = useInventory();
  const { activeBranchId } = useBranch();
  const { session: cashSession, fetchOpenSession } = useCash();
  const { local, fetchLocal } = useLocal();

  const [customerName, setCustomerName] = useState("");
  const [createdByEmployeeId, setCreatedByEmployeeId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [payments, setPayments] = useState<PaymentLine[]>([emptyPayment("0.00")]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Protege contra doble clic en "Registrar venta": la misma clave manda la
  // misma venta dos veces, SaleService.create devuelve la que ya existe en
  // vez de crear una segunda. Se regenera tras cada venta exitosa.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  useEffect(() => {
    fetchInventory();
    fetchLocal();
  }, [fetchInventory, fetchLocal]);

  useEffect(() => {
    if (activeBranchId) fetchOpenSession(activeBranchId);
  }, [activeBranchId, fetchOpenSession]);

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleItemChange = (index: number, inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    updateLine(index, { inventoryItemId, unitPrice: item ? String(item.salePrice) : "" });
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const subtotal = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
  const taxRate = Number(local?.taxRatePercent ?? 0);
  const taxAmount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + taxAmount);

  const updatePayment = (index: number, patch: Partial<PaymentLine>) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };
  const addPayment = () => setPayments((prev) => [...prev, emptyPayment("0.00")]);
  const removePayment = (index: number) => setPayments((prev) => prev.filter((_, i) => i !== index));

  const paymentsSum = round2(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
  const paymentsMatchTotal = paymentsSum === total;

  // Con un solo método (el caso común), el monto sigue al total automático
  // -- el cajero solo tiene que pensar en el split cuando de verdad divide
  // el pago entre métodos.
  useEffect(() => {
    if (payments.length === 1) {
      setPayments([{ ...payments[0], amount: total.toFixed(2) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, payments.length]);

  const resetForm = () => {
    setCustomerName("");
    setCreatedByEmployeeId("");
    setLines([{ ...emptyLine }]);
    setPayments([emptyPayment("0.00")]);
    setIdempotencyKey(newIdempotencyKey());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranchId || !cashSession || !paymentsMatchTotal) return;
    const validLines = lines.filter((l) => l.inventoryItemId && Number(l.quantity) > 0);
    if (validLines.length === 0) return;

    const sale = await create({
      localId: activeBranchId,
      cashSessionId: cashSession.id,
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
        lineType: "inventory_item",
        referenceId: l.inventoryItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });

    if (sale) {
      setSuccessMsg(`Venta #${sale.saleNumber} registrada por ${formatMoney(sale.totalValue)}.`);
      resetForm();
      fetchInventory();
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta title="Venta Rápida" description="Venta directa de accesorios" />
      <div>
        <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">Venta Rápida</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Venta de mostrador: cada item descuenta su stock automáticamente.
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}
      {!cashSession && (
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
            <Label className="text-gray-500">Cliente</Label>
            <Input placeholder="Opcional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label className="text-gray-500">Empleado</Label>
            <EmployeeSelect value={createdByEmployeeId} onChange={setCreatedByEmployeeId} />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-gray-500">Items</Label>
          {lines.map((line, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Select
                  value={line.inventoryItemId}
                  onChange={(value) => handleItemChange(index, value)}
                  placeholder="Selecciona un item"
                  options={inventoryItems.map((i) => ({
                    value: i.id,
                    label: `${i.name} (stock: ${i.quantityOnHand})`,
                  }))}
                />
              </div>
              <div className="w-full sm:w-24">
                <Input
                  type="number"
                  placeholder="Cant."
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input
                  type="number"
                  placeholder="Precio"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(index, { unitPrice: e.target.value })}
                />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus className="mr-1.5 size-4" />
            Agregar item
          </Button>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Impuesto ({taxRate}%)</span>
              <span>{formatMoney(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(total)}</span>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Label className="text-gray-500">Pago</Label>
          {payments.map((payment, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40">
                <Select
                  value={payment.method}
                  onChange={(value) => updatePayment(index, { method: value as PaymentMethod })}
                  options={Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input
                  type="number"
                  placeholder="Monto"
                  value={payment.amount}
                  onChange={(e) => updatePayment(index, { amount: e.target.value })}
                />
              </div>
              {payment.method === "tarjeta" && (
                <>
                  <div className="flex-1">
                    <Input
                      placeholder="Referencia de la terminal"
                      value={payment.providerReference}
                      onChange={(e) => updatePayment(index, { providerReference: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Código de autorización"
                      value={payment.providerAuthorizationCode}
                      onChange={(e) => updatePayment(index, { providerAuthorizationCode: e.target.value })}
                    />
                  </div>
                </>
              )}
              {payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePayment(index)}
                  className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addPayment}>
            <Plus className="mr-1.5 size-4" />
            Dividir pago
          </Button>
          {!paymentsMatchTotal && (
            <p className="text-sm text-red-500">
              Los pagos suman {formatMoney(paymentsSum)}, pero el total es {formatMoney(total)}.
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={creating || !cashSession || !paymentsMatchTotal}
        >
          <ShoppingCart className="mr-1.5 size-4" />
          {creating ? "Registrando..." : "Registrar venta"}
        </Button>
      </form>
    </div>
  );
};

export default QuickSalePage;
