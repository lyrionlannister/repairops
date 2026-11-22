import type { ReactNode } from "react";

export interface UserFormSectionProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}
