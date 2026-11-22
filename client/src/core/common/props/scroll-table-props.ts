import type { ReactNode } from "react";

export interface ScrollTableProps {
  colgroup?: ReactNode;
  header: ReactNode;
  children: ReactNode;
  className?: string;
}
