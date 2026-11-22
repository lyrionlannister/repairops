import { PageShell } from "@common/components/page-shell/page-shell";
import { PrintFormatControls } from "@common/components/print/print-format-controls";
import { PrintPreview } from "@common/components/print/print-preview";
import { CashCutReceipt } from "../components/cash-cut-receipt";
import { useCashCutPrintPage } from "../hooks/use-cash-cut-print-page";

export const CashCutPrintPage: React.FC = () => {
  const { id, detail, local, loading, pdf, ticketSize, setTicketSize, isThermal, pageWidthMm } =
    useCashCutPrintPage();

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
    );
  }
  if (!detail) {
    return <div className="p-8 text-center text-sm text-red-500">Corte de caja no encontrado.</div>;
  }

  return (
    <PageShell
      title={`Corte de caja #${id}`}
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
        pdfTitle={`Corte ${id}`}
        pdfFilename={`corte-${id}.pdf`}
      >
        <CashCutReceipt detail={detail} local={local} widthMm={pageWidthMm} />
      </PrintPreview>
    </PageShell>
  );
};
