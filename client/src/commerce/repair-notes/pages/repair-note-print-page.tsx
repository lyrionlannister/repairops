import { PageShell } from "@common/components/page-shell/page-shell";
import { PrintFormatControls } from "@common/components/print/print-format-controls";
import { PrintPreview } from "@common/components/print/print-preview";
import { ThermalReceipt } from "../components/thermal-receipt";
import { useRepairNotePrintPage } from "../hooks/use-repair-note-print-page";

export const RepairNotePrintPage: React.FC = () => {
  const {
    note,
    local,
    loading,
    ticketSize,
    setTicketSize,
    isThermal,
    pageWidthMm,
    serviceTypeNames,
    pdf,
  } = useRepairNotePrintPage();

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
    );
  }
  if (!note) {
    return <div className="p-8 text-center text-sm text-red-500">Nota no encontrada.</div>;
  }

  return (
    <PageShell
      title={`Nota #${note.controlNumber}`}
      description="Vista previa e impresión"
      action={
        <PrintFormatControls
          ticketSize={ticketSize}
          isThermal={isThermal}
          onTicketSizeChange={setTicketSize}
        />
      }
    >
      <PrintPreview
        isThermal={isThermal}
        pageWidthMm={pageWidthMm}
        pdf={pdf}
        pdfTitle={`Nota ${note.controlNumber}`}
        pdfFilename={`nota-${note.controlNumber}.pdf`}
      >
        <ThermalReceipt
          note={note}
          local={local}
          serviceTypeNames={serviceTypeNames}
          widthMm={pageWidthMm}
        />
      </PrintPreview>
    </PageShell>
  );
};
