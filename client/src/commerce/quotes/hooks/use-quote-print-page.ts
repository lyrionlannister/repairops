import { useEffect } from "react";
import { useParams } from "react-router";

import { usePdfPreview } from "@common/hooks/use-pdf-preview";
import { useQuotes } from "./use-quotes";

export const useQuotePrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const { quote, loading, fetchQuote } = useQuotes();
  const pdf = usePdfPreview(id ? `/quotes/${id}/pdf` : null);

  useEffect(() => {
    if (id) fetchQuote(id);
  }, [id, fetchQuote]);

  return { id, quote, loading, pdf };
};
