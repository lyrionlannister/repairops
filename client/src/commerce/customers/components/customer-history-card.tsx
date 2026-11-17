import { useState } from "react";
import type { FC, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Eye } from "lucide-react";
import { STATUS_CONFIG, type RepairNoteRecord } from "@commerce/repair-notes/hooks/use-repair-notes";
import type { Sale } from "@commerce/inventory/hooks/use-sales";
import type { LayawayRecord } from "../hooks/use-layaways";
import { STATUS_LABELS, formatDay, formatMoney } from "../utils/format";

type Tab = "notes" | "sales" | "layaways";

interface CustomerHistoryCardProps {
  notes: RepairNoteRecord[];
  sales: Sale[];
  layaways: LayawayRecord[];
}


const MiniTable: FC<{ head: string[]; empty: string; rows: ReactNode[][] }> = ({ head, empty, rows }) =>
  rows.length === 0 ? (
    <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{empty}</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {head.map((h) => (
              <th key={h} className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, index) => (
            <tr key={index} className="border-b border-gray-100 last:border-0 dark:border-gray-800/50">
              {cells.map((cell, i) => (
                <td key={i} className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

// Historial del cliente: sus reparaciones, ventas y apartados, en pestañas.
export const CustomerHistoryCard: FC<CustomerHistoryCardProps> = ({ notes, sales, layaways }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("notes");
  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "notes", label: "Reparaciones", count: notes.length },
    { key: "sales", label: "Ventas", count: sales.length },
    { key: "layaways", label: "Apartados", count: layaways.length },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Historial</h3>
      <div className="mt-4 flex gap-1 border-b border-gray-200 dark:border-gray-800" role="tablist">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {label} <span className="ml-1 text-xs text-gray-400">{count}</span>
          </button>
        ))}
      </div>

      {tab === "notes" && (
        <MiniTable
          head={["Folio", "Equipo", "Estado", "Recibido", "Total", ""]}
          empty="Aún no tiene reparaciones."
          rows={notes.map((n) => [
            `#${n.controlNumber}`,
            `${n.brand} ${n.model}`,
            <span key="s" className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG[n.status]?.className ?? ""}`}>
              {STATUS_CONFIG[n.status]?.label ?? n.status}
            </span>,
            formatDay(n.receivedAt),
            formatMoney(Number(n.totalValue)),
            <button
              key="v"
              onClick={() => navigate(`/commerce/repair-notes/${n.id}`)}
              title="Ver nota"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <Eye className="size-4" />
            </button>,
          ])}
        />
      )}
      {tab === "sales" && (
        <MiniTable
          head={["Folio", "Fecha", "Total"]}
          empty="Aún no tiene ventas."
          rows={sales.map((s) => [`#${s.saleNumber}`, formatDay(s.createdAt), formatMoney(Number(s.totalValue))])}
        />
      )}
      {tab === "layaways" && (
        <MiniTable
          head={["Estado", "Total", "Anticipo", "Vence"]}
          empty="Aún no tiene apartados."
          rows={layaways.map((l) => [
            STATUS_LABELS[l.status],
            formatMoney(Number(l.totalValue)),
            formatMoney(Number(l.depositAmount)),
            formatDay(l.expiresAt),
          ])}
        />
      )}
    </div>
  );
};
