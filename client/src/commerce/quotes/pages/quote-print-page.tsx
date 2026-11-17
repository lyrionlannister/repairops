import { PageShell } from "@common/components/page-shell/page-shell";
import { PdfPreview } from "@common/components/pdf-preview/pdf-preview";
import { useQuotePrintPage } from "../hooks/use-quote-print-page";

export const QuotePrintPage: React.FC = () => {
  const { id, quote, loading, pdf } = useQuotePrintPage();

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>;
  }
  if (!quote) {
    return <div className="p-8 text-center text-sm text-red-500">Cotización no encontrada.</div>;
  }

  return (
    <PageShell title={`Cotización — ${quote.customerName}`} description="Vista previa de cotización">
      <PdfPreview
        url={pdf.url}
        loading={pdf.loading}
        error={pdf.error}
        title="Cotización"
        onDownload={() => pdf.download(`cotizacion-${id}.pdf`)}
        onOpen={pdf.openInTab}
      />
    </PageShell>
  );
};
