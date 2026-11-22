import type { ReactNode } from "react";
import type { Trend } from "../types/dashboard-page";

export interface StatCardProps {
  icon: ReactNode;
  // Clases de fondo y color del icono, p. ej. "bg-brand-50 text-brand-600 ...".
  iconTone: string;
  label: string;
  value: string | number;
  trend?: Trend | null;
}
