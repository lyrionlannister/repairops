import type { ReactNode } from "react";

export interface TableProps {
  children: ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * @property isHeader - Si es true, se renderiza como <th>, de lo contrario como <td>.
 */
export interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
}
