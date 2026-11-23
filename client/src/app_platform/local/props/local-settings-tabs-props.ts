import type { LocalTabKey } from "../types/local-page";

export interface LocalSettingsTabsProps {
  active: LocalTabKey;
  dirtyTabs: ReadonlySet<LocalTabKey>;
  onSelect: (tab: LocalTabKey) => void;
}
