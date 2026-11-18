import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { useApiClient } from "@common/hooks/use-api-client";
import { useBranch } from "@common/hooks/use-branch";
import { useRepairNotes } from "@commerce/repair-notes/hooks/use-repair-notes";
import { useSales } from "@commerce/inventory/hooks/use-sales";
import { useCustomers } from "./use-customers";
import { useLayaways } from "./use-layaways";
import { useCustomerPayments, type CustomerPaymentMethod } from "./use-customer-payments";

export interface CustomerDebtRow {
  kind: "sale" | "repair_note";
  reference: number;
  date: string;
  amount: string;
}

interface CustomerDebts {
  creditLimit: number;
  balance: number;
  available: number;
  items: CustomerDebtRow[];
}

export interface ProfileDraft {
  name: string;
  phone: string;
  email: string;
}

// Ficha de un cliente: sus datos (editables aquí mismo), su crédito (límite, lo que
// debe y lo disponible), las deudas que lo componen y su historial de notas, ventas y
// apartados. Hace los fetch y los cálculos; los componentes solo pintan.
export const useCustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { apiClient } = useApiClient();
  const { customers, loading, saving, error, fetchAll, update } = useCustomers();
  const { notes, fetchNotes } = useRepairNotes();
  const { sales, fetchAll: fetchSales } = useSales();
  const { layaways, fetchAll: fetchLayaways } = useLayaways();
  const { workingBranchId } = useBranch();
  const { payments, saving: savingPayment, error: paymentError, fetchPayments, registerPayment, clearError: clearPaymentError } =
    useCustomerPayments();

  const [debts, setDebts] = useState<CustomerDebts | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ name: "", phone: "", email: "" });
  const [creditDraft, setCreditDraft] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{ amount: string; method: CustomerPaymentMethod; createdByEmployeeId: string }>({
    amount: "",
    method: "efectivo",
    createdByEmployeeId: "",
  });

  const customer = useMemo(() => customers.find((c) => c.id === id) ?? null, [customers, id]);

  const fetchDebts = useCallback(async () => {
    if (!id) return;
    const response = await apiClient(`/customers/${id}/debts`);
    if (response.ok) setDebts((await response.json()) as CustomerDebts);
  }, [apiClient, id]);

  useEffect(() => {
    fetchAll();
    fetchNotes();
    fetchSales();
    fetchLayaways();
    fetchDebts();
    if (id) fetchPayments(id);
  }, [fetchAll, fetchNotes, fetchSales, fetchLayaways, fetchDebts, fetchPayments, id]);

  useEffect(() => {
    if (customer) setCreditDraft(String(customer.creditLimit));
  }, [customer]);

  const startEditing = () => {
    if (!customer) return;
    setProfileDraft({ name: customer.name, phone: customer.phone, email: customer.email ?? "" });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!customer || !id) return;
    const ok = await update(id, {
      name: profileDraft.name.trim(),
      phone: profileDraft.phone.trim(),
      email: profileDraft.email.trim() || null,
      creditLimit: customer.creditLimit,
    });
    if (ok) setEditingProfile(false);
  };

  const saveCredit = async () => {
    if (!customer || !id) return;
    const ok = await update(id, {
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? null,
      creditLimit: Number(creditDraft) || 0,
    });
    if (ok) await fetchDebts();
  };

  const creditLimit = debts?.creditLimit ?? customer?.creditLimit ?? 0;
  const balance = debts?.balance ?? 0;

  const openPaymentModal = () => {
    setPaymentForm({ amount: "", method: "efectivo", createdByEmployeeId: "" });
    clearPaymentError();
    setPaymentModalOpen(true);
  };

  const submitPayment = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !workingBranchId) return;
    const ok = await registerPayment(id, {
      localId: workingBranchId,
      amount: Number(paymentForm.amount) || 0,
      method: paymentForm.method,
      createdByEmployeeId: paymentForm.createdByEmployeeId,
    });
    if (ok) {
      setPaymentModalOpen(false);
      await fetchDebts();
    }
  };

  return {
    customer,
    loading,
    saving,
    error,
    credit: {
      limit: creditLimit,
      balance,
      available: debts?.available ?? creditLimit,
      usedPct: creditLimit > 0 ? Math.min(100, (balance / creditLimit) * 100) : 0,
      draft: creditDraft,
      setDraft: setCreditDraft,
      dirty: Number(creditDraft) !== (customer?.creditLimit ?? 0),
      save: saveCredit,
    },
    debts: debts?.items ?? [],
    profile: {
      editing: editingProfile,
      draft: profileDraft,
      setDraft: setProfileDraft,
      start: startEditing,
      cancel: () => setEditingProfile(false),
      save: saveProfile,
    },
    history: {
      notes: notes.filter((n) => n.customerId === id),
      sales: sales.filter((s) => s.customerId === id),
      layaways: layaways.filter((l) => l.customerId === id),
    },
    payment: {
      items: payments,
      modalOpen: paymentModalOpen,
      form: paymentForm,
      setForm: setPaymentForm,
      saving: savingPayment,
      error: paymentError,
      open: openPaymentModal,
      close: () => setPaymentModalOpen(false),
      submit: submitPayment,
    },
  };
};
