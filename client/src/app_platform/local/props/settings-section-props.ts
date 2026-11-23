import type { ReactNode } from "react";
import type { LocalTabKey } from "../types/local-page";

export interface SettingsSectionProps {
  tab: LocalTabKey;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
}
