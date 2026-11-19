import type { FC, ReactNode } from "react";
import { Check, X } from "lucide-react";
import { STATUS_CONFIG, type RepairNoteRecord } from "../hooks/use-repair-notes";
import type { DetailItemLine } from "../hooks/use-repair-note-detail";
import { formatCurrency, formatDate } from "../utils/format";

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="space-y-1 border-b border-gray-200 py-4 first:pt-0 dark:border-gray-800">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{children}</div>
  </div>
);

const Check_: FC<{ included?: boolean; children: ReactNode }> = ({ included = true, children }) => (
  <li className="flex items-start gap-3 text-sm">
    {included ? (
      <Check className="mt-0.5 size-4 shrink-0 text-gray-800 dark:text-white/90" />
    ) : (
      <X className="mt-0.5 size-4 shrink-0 text-gray-400" />
    )}
    <span
      className={
        included
          ? "font-medium text-gray-600 dark:text-gray-300"
          : "font-medium text-gray-400 line-through"
      }
    >
      {children}
    </span>
  </li>
);

interface RepairNoteDetailSummaryProps {
  note: RepairNoteRecord;
  technicianName: string | null;
  serviceTypeNames: string[];
  itemLines: DetailItemLine[];
  actions: ReactNode;
}

export const RepairNoteDetailSummary: FC<RepairNoteDetailSummaryProps> = ({
  note,
  technicianName,
  serviceTypeNames,
  itemLines,
  actions,
}) => {
  const status = STATUS_CONFIG[note.status];
  const total = Number(note.totalValue);
  const advance = Number(note.advanceValue ?? 0);
  const paidPct = total > 0 ? Math.min(100, (advance / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Detalles de la nota
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
        <div className="self-start rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="px-5 pt-5">
            <Row label="Cliente">
              {note.customerName}
              {note.contactNumber && (
                <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                  {note.contactNumber}
                </span>
              )}
            </Row>
            <Row label="Equipo">
              {note.brand} {note.model}
            </Row>
            <Row label="Estado">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.className ?? ""}`}
              >
                {status?.label ?? note.status}
              </span>
            </Row>
            <Row label="Recibido">{formatDate(note.receivedAt?.slice(0, 10))}</Row>
            <Row label="Entrega estimada">{formatDate(note.deliveryDate?.slice(0, 10))}</Row>
            <Row label="Técnico">{technicianName ?? "Sin asignar"}</Row>
            <div className="space-y-1 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          {note.requiresAdvance && (
            <div className="space-y-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-gray-800 dark:text-white/90">Anticipo</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatCurrency(advance)} de {formatCurrency(total)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Servicio</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {note.reportedFailure}
              </p>
            </div>

            <ul className="space-y-3.5">
              {serviceTypeNames.map((name) => (
                <Check_ key={name}>{name}</Check_>
              ))}
              {itemLines.map((line) => (
                <Check_ key={line.id}>
                  {line.quantity} × {line.name} (
                  {formatCurrency(line.quantity * Number(line.unitPrice))})
                </Check_>
              ))}
              <Check_ included={note.hasWarranty}>Garantía</Check_>
              <Check_ included={note.hasExtendedWarranty}>
                Garantía extendida
                {note.hasExtendedWarranty && note.extendedWarrantyDays
                  ? ` (${note.extendedWarrantyDays} días)`
                  : ""}
              </Check_>
              <Check_ included={!note.deviceOff}>Equipo encendido al recibirlo</Check_>
            </ul>

            {note.technicianNotes && (
              <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/5">
                <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">
                  Notas del técnico
                </p>
                <p className="text-gray-700 dark:text-gray-300">{note.technicianNotes}</p>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-wrap justify-end gap-3 pt-2">{actions}</div>
        </div>
      </div>
    </div>
  );
};
