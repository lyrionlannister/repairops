import { useLayoutEffect, useRef } from "react";
import type { FC, ReactNode } from "react";

interface ScrollTableProps {
  colgroup?: ReactNode;
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

// Separa el <thead> (fijo, nunca scrollea) del <tbody> (su propio
// overflow-y-auto) en dos <table> distintas que comparten el mismo
// <colgroup> -- asi el scroll de una lista larga queda SOLO sobre las
// filas de datos, nunca sobre el encabezado.
// El overflow-x-auto vive en el wrapper exterior para que el scroll horizontal
// mueva header y body a la vez; el div del body lleva el mismo min-w para no
// crear una segunda barra horizontal. Solo se activa cuando el caller pasa
// `className` (siempre un min-w-*).
// En < md (ver .stack-table en index.css) las filas se muestran como tarjetas:
// el efecto copia cada <th> al data-label de la celda de su misma columna.
export const ScrollTable: FC<ScrollTableProps> = ({ colgroup, header, children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const labels = Array.from(root.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
    root.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => cell.setAttribute("data-label", labels[index] ?? ""));
    });
  });

  return (
    <div
      ref={ref}
      className={`stack-table custom-scrollbar flex flex-1 min-h-0 flex-col ${className ? "overflow-x-auto" : "overflow-hidden"}`}
    >
      <table className={`w-full table-fixed text-sm ${className}`}>
        {colgroup}
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          {header}
        </thead>
      </table>
      <div className={`custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${className}`}>
        <table className={`w-full table-fixed text-sm ${className}`}>
          {colgroup}
          {children}
        </table>
      </div>
    </div>
  );
};
