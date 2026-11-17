import { useNavigate } from "react-router";
import { ArrowLeft, Printer } from "lucide-react";

import { PageMeta } from "@common/pages/page-meta";
import { PdfPreview } from "@common/components/pdf-preview/pdf-preview";
import type { TicketSize } from "../../../app_platform/local/hooks/use-local";
import { ThermalReceipt } from "../components/thermal-receipt";
import { useRepairNotePrintPage } from "../hooks/use-repair-note-print-page";

export const RepairNotePrintPage: React.FC = () => {
  const navigate = useNavigate();
  const { note, local, loading, ticketSize, setTicketSize, isThermal, pageWidthMm, serviceTypeNames, pdf } =
    useRepairNotePrintPage();

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>;
  }
  if (!note) {
    return <div className="p-8 text-center text-sm text-red-500">Nota no encontrada.</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <PageMeta title="Nota de Reparación" description="Vista previa e impresión" />

      {/* Solo .print-area queda visible al imprimir; @page fija el ancho físico del rollo térmico. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; }
          ${isThermal ? `@page { size: ${pageWidthMm}mm auto; margin: 0; }` : ""}
        }
      `}</style>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 print:hidden">
        <button
          onClick={() => navigate("/commerce/repair-notes")}
          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:p-1.5 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-xl font-semibold text-brand-600 dark:text-brand-400">Nota #{note.controlNumber}</h1>
        <select
          value={ticketSize}
          onChange={(event) => setTicketSize(event.target.value as TicketSize)}
          className="min-h-11 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 md:min-h-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="58mm">Térmico 58mm</option>
          <option value="80mm">Térmico 80mm</option>
          <option value="letter">Carta</option>
        </select>
        {isThermal && (
          <button
            onClick={() => window.print()}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Printer className="size-4" />
            Imprimir
          </button>
        )}
      </div>

      {isThermal ? (
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-2xl border border-gray-200 bg-gray-100 p-8 dark:border-gray-700 dark:bg-gray-900 print:border-0 print:bg-white print:p-0">
          <div className="print-area bg-white shadow">
            <ThermalReceipt note={note} local={local} serviceTypeNames={serviceTypeNames} widthMm={pageWidthMm} />
          </div>
        </div>
      ) : (
        <PdfPreview
          url={pdf.url}
          loading={pdf.loading}
          error={pdf.error}
          title={`Nota ${note.controlNumber}`}
          onDownload={() => pdf.download(`nota-${note.controlNumber}.pdf`)}
          onOpen={pdf.openInTab}
        />
      )}
    </div>
  );
};
