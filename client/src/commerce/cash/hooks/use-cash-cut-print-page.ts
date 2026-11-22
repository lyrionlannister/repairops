import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useApiClient } from "@common/hooks/use-api-client";
import { usePdfPreview } from "@common/hooks/use-pdf-preview";
import { useTicketFormat } from "@common/hooks/use-ticket-format";
import { useLocal } from "@app-platform/local/hooks/use-local";
import type { CashCutDetail } from "../types/cash";

export const useCashCutPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const { apiClient } = useApiClient();
  const { local, loading: loadingLocal, fetchLocal } = useLocal();
  const [detail, setDetail] = useState<CashCutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const format = useTicketFormat(local?.defaultTicketSize);
  const pdf = usePdfPreview(!format.isThermal && id ? `/cash/cuts/${id}/pdf` : null);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    apiClient(`/cash/cuts/${id}`)
      .then(async (res) => {
        if (!cancelled) setDetail(res.ok ? ((await res.json()) as CashCutDetail) : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, id]);

  return { id, detail, local, loading: loading || loadingLocal, pdf, ...format };
};
