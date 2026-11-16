import { STATUS_CONFIG, type RepairNoteStatus } from "../hooks/use-repair-notes";
import { formatCurrency, formatDate } from "../utils/format";

interface HistoryEntry {
  id: string;
  brand: string;
  model: string;
  status: RepairNoteStatus;
  totalValue: number;
  receivedAt: string;
}

interface RepairNoteCustomerHistoryPanelProps {
  otherNotes: HistoryEntry[];
}

export const RepairNoteCustomerHistoryPanel: React.FC<RepairNoteCustomerHistoryPanelProps> = ({ otherNotes }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Historial del cliente</p>
    {otherNotes.length === 0 ? (
      <p className="text-sm text-gray-400">Sin historial previo.</p>
    ) : (
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {otherNotes.map((n) => (
          <div key={n.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                {n.brand} {n.model}
              </p>
              <p className="text-xs text-gray-400">
                {STATUS_CONFIG[n.status].label} · {formatDate(n.receivedAt)}
              </p>
            </div>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {formatCurrency(n.totalValue)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

