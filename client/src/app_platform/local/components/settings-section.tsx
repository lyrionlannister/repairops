import type { FC } from "react";
import type { SettingsSectionProps } from "../props/settings-section-props";

export const SettingsSection: FC<SettingsSectionProps> = ({
  tab,
  title,
  description,
  children,
  aside,
}) => (
  <section
    role="tabpanel"
    id={`local-panel-${tab}`}
    aria-labelledby={`local-tab-${tab}`}
    className="space-y-6"
  >
    <header className="border-b border-gray-100 pb-5 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </header>
    {aside ? (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
        <div className="min-w-0 space-y-5">{children}</div>
        <aside className="xl:sticky xl:top-0 xl:self-start">{aside}</aside>
      </div>
    ) : (
      <div className="space-y-5">{children}</div>
    )}
  </section>
);
