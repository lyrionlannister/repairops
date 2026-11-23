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
    isDirty,
    dirtyTabs,
    activeTab,
    selectTab,
    cashBranchId,
    viewCashBranch,
    attributionBasis,
    attributionSaving,
    attributionMessage,
    handleChange,
    setField,
    handleLogoChange,
    handleAttributionBasisChange,
    handleSubmit,
    discardChanges,
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
    <PageShell title="Mi Local" description="Identidad, folios y reglas de operación de tu taller.">
      <LocalSettingsForm
        local={local}
        form={form}
        saving={saving}
        isDirty={isDirty}
        activeTab={activeTab}
        dirtyTabs={dirtyTabs}
        onSelectTab={selectTab}
        cashBranchId={cashBranchId}
        onViewCashBranch={viewCashBranch}
        fileInputRef={fileInputRef}
        attributionBasis={attributionBasis}
        attributionSaving={attributionSaving}
        attributionMessage={attributionMessage}
        onChange={handleChange}
        onSetField={setField}
        onLogoChange={handleLogoChange}
        onAttributionBasisChange={handleAttributionBasisChange}
        onSubmit={handleSubmit}
        onDiscard={discardChanges}
        onRemoveLogo={removeLogo}
        onSetBrandColor={setBrandColor}
      />
    </PageShell>
  );
};
