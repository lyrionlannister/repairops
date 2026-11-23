import type { FC } from "react";
import { AttributionSection } from "./attribution-section";
import { FolioSettings } from "./folio-settings";
import { LocalCashSection } from "./local-cash-section";
import { LocalIdentitySection } from "./local-identity-section";
import { LocalPrintSection } from "./local-print-section";
import { LocalSaveBar } from "./local-save-bar";
import { LocalSettingsTabs } from "./local-settings-tabs";
import { LOCAL_SETTINGS_FORM_ID } from "../utils/local-tabs";
import type { LocalSettingsFormProps } from "../props/local-settings-form-props";

export const LocalSettingsForm: FC<LocalSettingsFormProps> = ({
  local,
  form,
  saving,
  isDirty,
  activeTab,
  dirtyTabs,
  fileInputRef,
  attributionBasis,
  attributionSaving,
  attributionMessage,
  onSelectTab,
  cashBranchId,
  onViewCashBranch,
  onChange,
  onSetField,
  onLogoChange,
  onAttributionBasisChange,
  onSubmit,
  onDiscard,
  onRemoveLogo,
  onSetBrandColor,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
    <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 xl:flex-row xl:items-center xl:justify-between xl:px-6 xl:py-5 dark:border-gray-800">
      <LocalSettingsTabs active={activeTab} dirtyTabs={dirtyTabs} onSelect={onSelectTab} />
      <LocalSaveBar isDirty={isDirty} saving={saving} onDiscard={onDiscard} />
    </div>

    <div className="p-4 sm:p-6">
      {activeTab === "cash" ? (
        <LocalCashSection
          form={form}
          saving={saving}
          onChange={onChange}
          onSetField={onSetField}
          cashBranchId={cashBranchId}
          onViewCashBranch={onViewCashBranch}
          onSubmit={onSubmit}
        />
      ) : (
        <form id={LOCAL_SETTINGS_FORM_ID} onSubmit={onSubmit}>
          {activeTab === "identity" && (
            <LocalIdentitySection
              form={form}
              palette={local?.brandPalette ?? null}
              saving={saving}
              fileInputRef={fileInputRef}
              onChange={onChange}
              onLogoChange={onLogoChange}
              onRemoveLogo={onRemoveLogo}
              onSetBrandColor={onSetBrandColor}
            />
          )}
          {activeTab === "folios" && (
            <FolioSettings values={form} saving={saving} onChange={onChange} />
          )}
          {activeTab === "print" && (
            <LocalPrintSection
              form={form}
              saving={saving}
              onChange={onChange}
              onSetField={onSetField}
            />
          )}
          {activeTab === "attribution" && (
            <AttributionSection
              value={attributionBasis}
              saving={attributionSaving}
              message={attributionMessage}
              onChange={onAttributionBasisChange}
            />
          )}
        </form>
      )}
    </div>
  </div>
);
