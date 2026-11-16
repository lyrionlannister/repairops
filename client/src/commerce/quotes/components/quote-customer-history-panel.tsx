import type { QuoteStatus } from "../hooks/use-quotes";

const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

interface QuoteCustomerHistoryPanelProps {
  otherQuotes: { id: string; status: QuoteStatus; totalValue: number }[];
}

export const QuoteCustomerHistoryPanel: React.FC<QuoteCustomerHistoryPanelProps> = ({ otherQuotes }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Historial del cliente</p>
    {otherQuotes.length === 0 ? (
      <p className="text-sm text-gray-400">Sin historial previo.</p>
    ) : (
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {otherQuotes.map((q) => (
          <div key={q.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-gray-700 dark:text-gray-300">{QUOTE_STATUS_LABEL[q.status]}</span>
            <span className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(q.totalValue)}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default QuoteCustomerHistoryPanel;
