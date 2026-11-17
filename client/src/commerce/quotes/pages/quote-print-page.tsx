import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import { PageMeta } from "@common/pages/page-meta";
import { PdfPreview } from "@common/components/pdf-preview/pdf-preview";
import { useQuotePrintPage } from "../hooks/use-quote-print-page";

export const QuotePrintPage: React.FC = () => {
  const navigate = useNavigate();
  const { id, quote, loading, pdf } = useQuotePrintPage();

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>;
  }
  if (!quote) {
    return <div className="p-8 text-center text-sm text-red-500">Cotización no encontrada.</div>;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <PageMeta title="Cotización" description="Vista previa de cotización" />
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/commerce/quotes")}
          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:p-1.5 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-xl font-semibold text-brand-600 dark:text-brand-400">
          Cotización — {quote.customerName}
        </h1>
      </div>
      <PdfPreview
        url={pdf.url}
        loading={pdf.loading}
        error={pdf.error}
        title="Cotización"
        onDownload={() => pdf.download(`cotizacion-${id}.pdf`)}
        onOpen={pdf.openInTab}
      />
    </div>
  );
};
