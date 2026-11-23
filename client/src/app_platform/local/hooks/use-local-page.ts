import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { LocalRecord, TicketSize } from "../types/local";
import type { LocalFormState, AttributionBasis, LocalTabKey } from "../types/local-page";
import { dirtyLocalTabs, toLocalTab } from "../utils/local-tabs";
import { EMPTY_LOCAL_FORM, isSameForm, toLocalForm, toLocalUpdate } from "../utils/local-form";

export type { TicketSize };

export const useLocalPage = ({
  local,
  loading,
  saving,
  saveSuccess,
  error,
  fetchLocal,
  updateLocal,
  apiClient,
}: {
  local: LocalRecord | null;
  loading: boolean;
  saving: boolean;
  saveSuccess: boolean;
  error: string | null;
  fetchLocal: () => Promise<void>;
  updateLocal: (data: Partial<LocalRecord>) => Promise<boolean>;
  apiClient: (input: string, init?: RequestInit) => Promise<Response>;
}) => {
  const savedForm = useMemo(() => (local ? toLocalForm(local) : EMPTY_LOCAL_FORM), [local]);
  const [form, setForm] = useState<LocalFormState>(savedForm);
  const [attributionBasis, setAttributionBasis] = useState<AttributionBasis>("total_value");
  const [attributionSaving, setAttributionSaving] = useState(false);
  const [attributionMessage, setAttributionMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttributionBasis = useCallback(async () => {
    const response = await apiClient("/settings/revenue-attribution");

    if (!response.ok) {
      throw new Error("No se pudo cargar la base de atribución");
    }

    const payload = (await response.json()) as { attributionBasis?: AttributionBasis };
    setAttributionBasis(payload.attributionBasis ?? "total_value");
  }, [apiClient]);

  useEffect(() => {
    fetchLocal();
    fetchAttributionBasis().catch((err) => {
      console.error(err);
    });
  }, [fetchLocal, fetchAttributionBasis]);

  useEffect(() => {
    setForm(savedForm);
  }, [savedForm]);

  const isDirty = !isSameForm(form, savedForm);
  const dirtyTabs = useMemo(() => dirtyLocalTabs(form, savedForm), [form, savedForm]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = toLocalTab(searchParams.get("tab"));
  const selectTab = (tab: LocalTabKey) => setSearchParams({ tab }, { replace: true });
  const cashBranchId = searchParams.get("branch");
  const viewCashBranch = (branchId: string | null) =>
    setSearchParams(branchId ? { tab: "cash", branch: branchId } : { tab: "cash" });
  const discardChanges = () => setForm(savedForm);
  const setField = (name: keyof LocalFormState, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAttributionBasisChange = async (nextBasis: AttributionBasis) => {
    setAttributionBasis(nextBasis);
    setAttributionMessage(null);
    setAttributionSaving(true);

    try {
      const response = await apiClient("/settings/revenue-attribution", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attributionBasis: nextBasis }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "No se pudo guardar la base de atribución");
      }

      setAttributionMessage("Base de atribución actualizada correctamente.");
    } catch (err) {
      setAttributionMessage(
        err instanceof Error ? err.message : "No se pudo guardar la base de atribución.",
      );
    } finally {
      setAttributionSaving(false);
    }
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateLocal(toLocalUpdate(form, savedForm, local));
  };

  const setBrandColor = (brandColor: string) => setForm((prev) => ({ ...prev, brandColor }));

  const removeLogo = () => setForm((prev) => ({ ...prev, logo: "" }));

  return {
    fileInputRef,
    form,
    setForm,
    attributionBasis,
    attributionSaving,
    attributionMessage,
    loading,
    saving,
    saveSuccess,
    error,
    fetchLocal,
    updateLocal,
    handleChange,
    handleLogoChange,
    handleAttributionBasisChange,
    handleSubmit,
    removeLogo,
    setBrandColor,
    setField,
    isDirty,
    discardChanges,
    dirtyTabs,
    activeTab,
    selectTab,
    cashBranchId,
    viewCashBranch,
  };
};
