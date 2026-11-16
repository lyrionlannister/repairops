import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useServiceTypes } from "@common/hooks/use-service-types";
import { useLocal } from "../../../app_platform/local/hooks/use-local";
import { usePdfDownload } from "@common/hooks/use-pdf-download";
import type { TicketSize } from "../../../app_platform/local/hooks/use-local";
import { PageMeta } from "@common/pages/page-meta";
import { ThermalReceipt } from "../components/thermal-receipt";
import { RepairNoteReceipt } from "../components/repair-note-receipt";

// ─── Page ─────────────────────────────────────────────────────────────────────
export const RepairNotePrintPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { note, loading: loadingNote, fetchNote, fetchNoteServiceTypeIds } = useRepairNotes();
  const { local, loading: loadingLocal, fetchLocal } = useLocal();
  const { serviceTypes, fetchAll: fetchServiceTypes } = useServiceTypes();
  const { downloading, error: downloadError, download } = usePdfDownload();
  const [ticketSize, setTicketSize] = useState<TicketSize | null>(null);
  const [serviceTypeNames, setServiceTypeNames] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchNote(id);
    fetchLocal();
    fetchServiceTypes();
  }, [id, fetchNote, fetchLocal, fetchServiceTypes]);

  // Por defecto, el tamaño configurado en "Mi Local" -- pero se puede
  // cambiar aquí mismo para probar/imprimir en otro tamaño sin tocar la
  // configuración del local.
  useEffect(() => {
    if (local && ticketSize === null) setTicketSize(local.defaultTicketSize);
  }, [local, ticketSize]);

  useEffect(() => {
    if (!note) return;
    fetchNoteServiceTypeIds(note.id).then((ids) => {
      const nameById = new Map(serviceTypes.map((t) => [t.id, t.name]));
      setServiceTypeNames(ids.map((noteId) => nameById.get(noteId)).filter((n): n is string => Boolean(n)));
    });
  }, [note, serviceTypes, fetchNoteServiceTypeIds]);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!id || !note) return;
    download(`/repair-notes/${id}/pdf`, `nota-${note.controlNumber}.pdf`);
  };

  if (loadingNote || loadingLocal) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
    );
  }

  if (!note) {
    return <div className="p-8 text-center text-sm text-red-500">Nota no encontrada.</div>;
  }

  const isThermal = ticketSize === "58mm" || ticketSize === "80mm";
  const pageWidthMm = ticketSize === "58mm" ? 58 : 80;

  return (
    <div className="flex h-full flex-col">
      <PageMeta title="Nota de Reparación" description="Vista previa e impresión" />

      {/* Solo .print-area queda visible al imprimir; @page fija el ancho
          físico del papel térmico cuando aplica (letter usa el tamaño por
          defecto del navegador, igual que antes). */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; }
          ${isThermal ? `@page { size: ${pageWidthMm}mm auto; margin: 0; }` : ""}
        }
      `}</style>

      {/* Controls */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 print:hidden">
        <button
          onClick={() => navigate("/commerce/repair-notes")}
          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 md:p-1.5 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-xl font-semibold text-brand-600 dark:text-brand-400">
          Nota #{note.controlNumber}
        </h1>
        <select
          value={ticketSize ?? "80mm"}
          onChange={(event) => setTicketSize(event.target.value as TicketSize)}
          className="min-h-11 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm md:min-h-0 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="58mm">Térmico 58mm</option>
          <option value="80mm">Térmico 80mm</option>
          <option value="letter">Carta</option>
        </select>
        {downloadError && <span className="text-sm text-red-500">{downloadError}</span>}
        {isThermal ? (
          <button
            onClick={handlePrint}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Printer className="size-4" />
            Imprimir
          </button>
        ) : (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            <Download className="size-4" />
            {downloading ? "Generando..." : "Descargar PDF"}
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-2xl border border-gray-200 bg-gray-100 p-8 dark:border-gray-700 dark:bg-gray-900 print:border-0 print:bg-white print:p-0">
        {isThermal ? (
          <div className="print-area bg-white shadow">
            <ThermalReceipt note={note} local={local} serviceTypeNames={serviceTypeNames} widthMm={pageWidthMm} />
          </div>
        ) : (
          <div className="print-area" style={{ width: 720, flexShrink: 0 }}>
            <RepairNoteReceipt note={note} local={local} />
          </div>
        )}
      </div>
    </div>
  );
};

