import { useLayoutEffect, useRef } from "react";
import type { FC } from "react";
import type { ScrollTableProps } from "../../../props/scroll-table-props";

// Separa el <thead> (fijo, nunca scrollea) del <tbody> (su propio
// overflow-y-auto) en dos <table> distintas que comparten el mismo
// <colgroup> -- asi el scroll de una lista larga queda SOLO sobre las
// filas de datos, nunca sobre el encabezado.
// El overflow-x-auto vive en el wrapper exterior para que el scroll horizontal
// mueva header y body a la vez; el div del body lleva el mismo min-w para no
// crear una segunda barra horizontal. Solo se activa cuando el caller pasa
// `className` (siempre un min-w-*).
// En < xl (ver .stack-table en index.css) las filas se muestran como tarjetas:
// el efecto copia cada <th> al data-label de la celda de su misma columna. Ahí
// no hay scroll interno: con filtros arriba, el área de la lista quedaba de
// tarjeta y media en un celular; scrollea la página completa.
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
      className={`stack-table custom-scrollbar flex flex-col xl:flex-1 xl:min-h-0 ${className ? "overflow-x-auto" : "overflow-hidden"}`}
    >
      <table className={`w-full table-fixed text-sm ${className}`}>
        {colgroup}
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          {header}
        </thead>
      </table>
      <div className={`custom-scrollbar overflow-x-hidden xl:min-h-0 xl:flex-1 xl:overflow-y-auto ${className}`}>
        <table className={`w-full table-fixed text-sm ${className}`}>
          {colgroup}
          {children}
        </table>
      </div>
    </div>
  );
};
