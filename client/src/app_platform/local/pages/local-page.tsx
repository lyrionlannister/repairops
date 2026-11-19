import { useApiClient } from "@common/hooks/use-api-client";
import { PageShell } from "@common/components/page-shell/page-shell";

import { LocalSettingsForm } from "../components/local-settings-form";
import { useLocal } from "../hooks/use-local";
import { useLocalPage } from "../hooks/use-local-page";

export const LocalPage = () => {
  const { apiClient } = useApiClient();
  const { local, loading, saving, saveSuccess, error, fetchLocal, updateLocal } = useLocal();
  const {
    fileInputRef,
    form,
    attributionBasis,
    attributionSaving,
    attributionMessage,
    handleChange,
    handleLogoChange,
    handleAttributionBasisChange,
    handleSubmit,
    removeLogo,
    setBrandColor,
  } = useLocalPage({
    local,
    loading,
    saving,
    saveSuccess,
    error,
    fetchLocal,
    updateLocal,
    apiClient,
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando configuración...
      </div>
    );
  }

  return (
    <PageShell
      title="Configuración del Local"
      description="Datos que aparecerán en las notas de reparación impresas."
    >
      <LocalSettingsForm
        local={local}
        form={form}
        saving={saving}
        fileInputRef={fileInputRef}
        attributionBasis={attributionBasis}
        attributionSaving={attributionSaving}
        attributionMessage={attributionMessage}
        onChange={handleChange}
        onLogoChange={handleLogoChange}
        onAttributionBasisChange={handleAttributionBasisChange}
        onSubmit={handleSubmit}
        onRemoveLogo={removeLogo}
        onSetBrandColor={setBrandColor}
      />
    </PageShell>
  );
};
