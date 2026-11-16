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
// filas de datos, nunca sobre el encabezado, sin el truco fragil de
// position:sticky (que sigue dejando ver el thumb del scrollbar "detras"
// del header).
// El overflow-x-auto vive en este wrapper exterior (no en cada <table> por
// separado) para que el scroll horizontal de una tabla ancha mueva header y
// body a la vez sin JS: ambas <table> son hijas del mismo contenedor, asi
// que comparten una sola barra horizontal; el overflow-y-auto sigue aparte,
// solo alrededor del body. Solo se activa cuando el caller pasa `className`
// (siempre un min-w-*, para una tabla con mas columnas de las que caben) --
// dejarlo siempre encendido le agrega una barra horizontal fantasma a tablas
// angostas por puro redondeo de table-fixed, aunque nunca haya overflow real.
export const ScrollTable: FC<ScrollTableProps> = ({ colgroup, header, children, className = "" }) => (
  <div className={`custom-scrollbar flex flex-1 min-h-0 flex-col ${className ? "overflow-x-auto" : "overflow-hidden"}`}>
    <table className={`w-full table-fixed text-sm ${className}`}>
      {colgroup}
      <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        {header}
      </thead>
    </table>
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
      <table className={`w-full table-fixed text-sm ${className}`}>
        {colgroup}
        {children}
      </table>
    </div>
  </div>
);

