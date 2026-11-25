import { useCallback, useEffect, useMemo, useState } from "react";

import { useApiClient } from "@common/hooks/use-api-client";
import { useBranch } from "@common/hooks/use-branch";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useCustomers } from "@commerce/customers/hooks/use-customers";
import type { RepairNoteRecord } from "../types/repair-notes";
import type { DeliveryPaymentLine } from "../types/repair-note-delivery";
import { apiErrorText } from "@common/utils/api-error";

// Redondeo a centavos para comparar (0.1 + 0.2 nunca cuadra exacto en el navegador).
const round2 = (value: number) => Math.round(value * 100) / 100;

export const useRepairNoteDelivery = (note: RepairNoteRecord | null, onDelivered: () => void) => {
  const { apiClient } = useApiClient();
  const { workingBranchId } = useBranch();
  const { session, fetchOpenSession } = useCash();
  const { creditBalances, fetchCreditBalance } = useCustomers();

  const [isOpen, setOpen] = useState(false);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [payments, setPayments] = useState<DeliveryPaymentLine[]>([
    { method: "efectivo", amount: "0" },
  ]);
  const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Number(note?.totalValue ?? 0);
  const balance = Math.max(0, round2(total - advancePaid));
  const customerId = note?.customerId ?? null;
  const credit = customerId ? creditBalances[customerId] : undefined;

  const open = useCallback(async () => {
    if (!note) return;
    setError(null);
    setEmployeeId(note.assignedEmployeeId ?? "");
    const [paymentsResponse] = await Promise.all([
      apiClient(`/repair-notes/${note.id}/payments`),
      fetchOpenSession(workingBranchId),
      note.customerId ? fetchCreditBalance(note.customerId) : Promise.resolve(),
    ]);
    const rows = paymentsResponse.ok
      ? ((await paymentsResponse.json()) as Array<{ kind: string; amount: string | number }>)
      : [];
    const paid = round2(
      rows.filter((r) => r.kind === "advance").reduce((sum, r) => sum + Number(r.amount), 0),
    );
    setAdvancePaid(paid);
    setPayments([
      { method: "efectivo", amount: String(Math.max(0, round2(Number(note.totalValue) - paid))) },
    ]);
    setOpen(true);
  }, [note, apiClient, fetchOpenSession, workingBranchId, fetchCreditBalance]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (isOpen && payments.length === 1)
      setPayments((prev) => [{ ...prev[0]!, amount: String(balance) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, isOpen, payments.length]);

  const paymentsSum = useMemo(
    () => round2(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)),
    [payments],
  );
  const creditAmount = useMemo(
    () =>
      round2(
        payments
          .filter((p) => p.method === "credito")
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      ),
    [payments],
  );
  const hasCashPayment = payments.some((p) => p.method !== "credito" && Number(p.amount) > 0);

  const problem = (() => {
    if (balance === 0) return null;
    if (paymentsSum !== balance)
      return `Los pagos suman ${paymentsSum.toFixed(2)} y el saldo es ${balance.toFixed(2)}.`;
    if (creditAmount > 0 && !customerId)
      return "Para dejar a crédito la nota debe tener un cliente registrado.";
    if (payments.some((p) => p.method === "credito" && !p.dueDate))
      return "Indica la fecha límite en la que el cliente debe pagar el crédito.";
    if (creditAmount > 0 && credit && creditAmount > credit.available)
      return "El crédito supera el disponible del cliente.";
    if (hasCashPayment && !session) return "No hay una caja abierta en esta sucursal para cobrar.";
    if (hasCashPayment && !employeeId) return "Elige quién cobra.";
    return null;
  })();

  const updatePayment = (index: number, patch: Partial<DeliveryPaymentLine>) =>
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const addPayment = () => setPayments((prev) => [...prev, { method: "efectivo", amount: "0" }]);
  const removePayment = (index: number) =>
    setPayments((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (!note || problem) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient(`/repair-notes/${note.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments:
            balance === 0
              ? []
              : payments.map((p) => ({
                  method: p.method,
                  amount: Number(p.amount),
                  dueDate: p.method === "credito" ? p.dueDate : undefined,
                })),
          createdByEmployeeId: employeeId || undefined,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(apiErrorText(data, "No se pudo entregar la nota"));
      }
      setOpen(false);
      onDelivered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return {
    open,
    modalProps: {
      isOpen,
      note,
      total,
      advancePaid,
      balance,
      payments,
      paymentsSum,
      employeeId,
      credit: credit ?? null,
      hasCashSession: Boolean(session),
      hasCashPayment,
      problem,
      error,
      saving,
      onClose: close,
      onEmployeeChange: setEmployeeId,
      onPaymentChange: updatePayment,
      onAddPayment: addPayment,
      onRemovePayment: removePayment,
      onSubmit: submit,
    },
  };
};
