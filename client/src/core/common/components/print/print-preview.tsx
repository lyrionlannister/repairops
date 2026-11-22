import type { FC } from "react";
import { PdfPreview } from "../pdf-preview/pdf-preview";
import type { PrintPreviewProps } from "../../props/print-preview-props";

// Ticket térmico (lo dibuja el navegador) o PDF carta (lo genera la API), según el formato elegido.
export const PrintPreview: FC<PrintPreviewProps> = ({
  isThermal,
  pageWidthMm,
  pdf,
  pdfTitle,
  pdfFilename,
  children,
}) => (
  <>
    {/* Solo .print-area queda visible al imprimir; @page fija el ancho físico del rollo térmico. */}
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; }
        ${isThermal ? `@page { size: ${pageWidthMm}mm auto; margin: 0; }` : ""}
      }
    `}</style>

    {isThermal ? (
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-2xl border border-gray-200 bg-gray-100 p-8 dark:border-gray-700 dark:bg-gray-900 print:border-0 print:bg-white print:p-0">
        <div className="print-area bg-white shadow">{children}</div>
      </div>
    ) : (
      <PdfPreview
        url={pdf.url}
        loading={pdf.loading}
        error={pdf.error}
        title={pdfTitle}
        onDownload={() => pdf.download(pdfFilename)}
        onOpen={pdf.openInTab}
      />
    )}
  </>
);
