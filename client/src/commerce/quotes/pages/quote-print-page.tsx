import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download } from "lucide-react";
import { useQuotes } from "../hooks/use-quotes";
import { usePdfDownload } from "@common/hooks/use-pdf-download";
import { PageMeta } from "@common/pages/page-meta";
import { QUOTE_STATUS_LABEL, formatCurrency, formatDate } from "../utils/format";

export const QuotePrintPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { quote, loading, fetchQuote, fetchQuoteItems } = useQuotes();
  const { downloading, download } = usePdfDownload();
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchQuoteItems>>>([]);

  useEffect(() => {
    if (!id) return;
    fetchQuote(id);
    fetchQuoteItems(id).then(setItems);
  }, [id, fetchQuote, fetchQuoteItems]);

  const handleDownload = () => {
    if (!id || !quote) return;
    download(`/quotes/${id}/pdf`, `cotizacion-${id}.pdf`);
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>;
  }
  if (!quote) {
    return <div className="p-8 text-center text-sm text-red-500">Cotización no encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Cotización" description="Vista previa de cotización" />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/commerce/quotes")}
          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 md:p-1.5 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-xl font-semibold text-brand-600 dark:text-brand-400">
          Cotización — {quote.customerName}
        </h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          <Download className="size-4" />
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Contacto</p>
            <p className="text-gray-800 dark:text-white/90">{quote.contactNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Válida hasta</p>
            <p className="text-gray-800 dark:text-white/90">{formatDate(quote.validUntil)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Estado</p>
            <p className="text-gray-800 dark:text-white/90">{QUOTE_STATUS_LABEL[quote.status] ?? quote.status}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Descripción</th>
              <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-20">Cant.</th>
              <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">Precio</th>
              <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-gray-800 dark:text-gray-200">{item.description}</td>
                <td className="py-2 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                <td className="py-2 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-gray-400">Total</p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(Number(quote.totalValue))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

