import { Link } from "react-router";
import { Smartphone } from "lucide-react";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useCustomerDetail } from "../hooks/use-customer-detail";
import { CustomerProfileCard } from "../components/customer-profile-card";
import { CustomerCreditCard } from "../components/customer-credit-card";
import { CustomerDebtsCard } from "../components/customer-debts-card";
import { CustomerPaymentsCard } from "../components/customer-payments-card";
import { CustomerHistoryCard } from "../components/customer-history-card";
import { RegisterPaymentModal } from "../components/register-payment-modal";

export const CustomerDetailPage: React.FC = () => {
  const { customer, loading, saving, error, credit, debts, profile, history, payment } = useCustomerDetail();

  if (!customer) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {loading ? "Cargando cliente..." : "Cliente no encontrado."}
      </div>
    );
  }

  return (
    <PageShell
      scrollHeader
      title={customer.name}
      description="Datos, crédito, deudas e historial del cliente."
      action={
        <Link
          to={`/commerce/customers/${customer.id}/devices`}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3"
        >
          <Smartphone className="size-4" />
          Historial de equipos
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CustomerProfileCard
          customer={customer}
          editing={profile.editing}
          draft={profile.draft}
          saving={saving}
          error={error}
          onDraftChange={profile.setDraft}
          onStart={profile.start}
          onCancel={profile.cancel}
          onSave={profile.save}
        />
        <CustomerCreditCard
          limit={credit.limit}
          balance={credit.balance}
          available={credit.available}
          usedPct={credit.usedPct}
          draft={credit.draft}
          dirty={credit.dirty}
          saving={saving}
          onDraftChange={credit.setDraft}
          onSave={credit.save}
        />
      </div>

      <CustomerDebtsCard debts={debts} balance={credit.balance} onRegisterPayment={payment.open} />
      <CustomerPaymentsCard payments={payment.items} />
      <CustomerHistoryCard notes={history.notes} sales={history.sales} layaways={history.layaways} />

      <RegisterPaymentModal
        isOpen={payment.modalOpen}
        form={payment.form}
        balance={credit.balance}
        saving={payment.saving}
        error={payment.error}
        onFormChange={payment.setForm}
        onClose={payment.close}
        onSubmit={payment.submit}
      />
    </PageShell>
  );
};
