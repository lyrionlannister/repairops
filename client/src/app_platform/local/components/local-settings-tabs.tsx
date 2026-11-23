import type { FC } from "react";
import { LOCAL_TABS } from "../utils/local-tabs";
import type { LocalSettingsTabsProps } from "../props/local-settings-tabs-props";

export const LocalSettingsTabs: FC<LocalSettingsTabsProps> = ({ active, dirtyTabs, onSelect }) => (
  <div
    role="tablist"
    aria-label="Secciones de la configuración"
    className="grid grid-cols-2 gap-x-1 gap-y-2 rounded-lg bg-gray-100 p-0.5 sm:grid-cols-3 lg:grid-cols-5 dark:bg-gray-900"
  >
    {LOCAL_TABS.map((tab) => {
      const selected = tab.key === active;
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`local-tab-${tab.key}`}
          aria-selected={selected}
          aria-controls={`local-panel-${tab.key}`}
          onClick={() => onSelect(tab.key)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:text-gray-900 dark:hover:text-white ${
            selected
              ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {tab.label}
          {dirtyTabs.has(tab.key) && (
            <span className="size-2 rounded-full bg-warning-500" aria-label="Cambios sin guardar" />
          )}
        </button>
      );
    })}
  </div>
);
