import { Download, ExternalLink } from "lucide-react";

import { useMediaQuery } from "@common/hooks/use-media-query";
import type { PdfPreviewProps } from "../../props/pdf-preview-props";

// En pantallas chicas los navegadores móviles no muestran bien un PDF incrustado:
// ahí solo se ofrecen los botones.
export const PdfPreview: React.FC<PdfPreviewProps> = ({ url, loading, error, title, onDownload, onOpen }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const actionClass =
    "flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button onClick={onDownload} disabled={!url} className={`${actionClass} bg-brand-500 text-white hover:bg-brand-600`}>
          <Download className="size-4" />
          Descargar PDF
        </button>
        <button
          onClick={onOpen}
          disabled={!url}
          className={`${actionClass} border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800`}
        >
          <ExternalLink className="size-4" />
          Abrir en pestaña
        </button>
      </div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Generando PDF...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {isDesktop && url && (
        <iframe title={title} src={url} className="min-h-0 w-full flex-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-700" />
      )}
    </div>
  );
};
