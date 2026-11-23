import type { ReactNode } from "react";
import type { OPERATION_LINKS } from "../utils/operation-links";

export interface OperationRow {
  label: string;
  hint?: string;
  value: ReactNode;
  valueClassName?: string;
  link: (typeof OPERATION_LINKS)[keyof typeof OPERATION_LINKS];
  icon: ReactNode;
  tone: string;
}
