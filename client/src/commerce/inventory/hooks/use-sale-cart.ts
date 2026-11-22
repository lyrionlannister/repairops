import { useEffect, useState } from "react";
import type { InventoryItem } from "../types/inventory";
import type { SaleLineItem, SalePaymentLine } from "../types/sale-cart";

const emptyLine: SaleLineItem = { inventoryItemId: "", quantity: "1", unitPrice: "" };
const emptyPayment = (amount: string): SalePaymentLine => ({
  method: "efectivo",
  amount,
  providerReference: "",
  providerAuthorizationCode: "",
});

// Redondeo a centavos para comparar -- evita que 0.1 + 0.2 nunca cuadre
// exacto en el navegador (misma razón por la que el server usa Decimal).
const round2 = (v: number) => Math.round(v * 100) / 100;

export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const useSaleCart = ({
  taxRatePercent,
  isOnline,
  inventoryItems,
  customerId,
}: {
  taxRatePercent: number;
  isOnline: boolean;
  inventoryItems: InventoryItem[];
  customerId: string;
}) => {
  // El IVA no se asume: el cajero lo marca por venta.
  const [applyTax, setApplyTax] = useState(false);
  const [lines, setLines] = useState<SaleLineItem[]>([{ ...emptyLine }]);
  const [payments, setPayments] = useState<SalePaymentLine[]>([emptyPayment("0.00")]);
  // Protege contra doble clic en "Registrar venta": la misma clave manda la
  // misma venta dos veces, SaleService.create devuelve la que ya existe en
  // vez de crear una segunda. Se regenera tras cada venta exitosa.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const updateLine = (index: number, patch: Partial<SaleLineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleItemChange = (index: number, inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    updateLine(index, { inventoryItemId, unitPrice: item ? String(item.salePrice) : "" });
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const subtotal = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
  const taxAmount = round2(subtotal * ((applyTax ? taxRatePercent : 0) / 100));
  const total = round2(subtotal + taxAmount);

  const updatePayment = (index: number, patch: Partial<SalePaymentLine>) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };
  const addPayment = () => setPayments((prev) => [...prev, emptyPayment("0.00")]);
  const removePayment = (index: number) => setPayments((prev) => prev.filter((_, i) => i !== index));

  const paymentsSum = round2(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
  const paymentsMatchTotal = paymentsSum === total;
  // Credito exige cliente registrado -- no se puede fiar a un cliente
  // anonimo de mostrador (ver SaleService.create, sexta precondicion).
  const hasCreditoWithoutCustomer = payments.some((p) => p.method === "credito") && !customerId;

  // Con un solo método (el caso común), el monto sigue al total automático
  // -- el cajero solo tiene que pensar en el split cuando de verdad divide
  // el pago entre métodos.
  useEffect(() => {
    if (payments.length === 1) {
      setPayments([{ ...payments[0], amount: total.toFixed(2) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, payments.length]);

  // Sin conexion no hay forma de validar tarjeta en terminal ni el limite de
  // credito del cliente contra el server -- se fuerza efectivo, no queda
  // como opcion mal elegida (ver plan Fase 5, Rama Venta sin internet).
  useEffect(() => {
    if (!isOnline) {
      setPayments((prev) => prev.map((p) => ({ ...p, method: "efectivo" as const })));
    }
  }, [isOnline]);

  const validLines = lines.filter((l) => l.inventoryItemId && Number(l.quantity) > 0);

  const reset = () => {
    setApplyTax(false);
    setLines([{ ...emptyLine }]);
    setPayments([emptyPayment("0.00")]);
    setIdempotencyKey(newIdempotencyKey());
  };

  return {
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
    validLines,
    updateLine,
    handleItemChange,
    addLine,
    removeLine,
    updatePayment,
    addPayment,
    removePayment,
    reset,
  };
};
