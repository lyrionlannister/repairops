import type { FC } from "react";
import { Search } from "lucide-react";
import type { SaleListItem } from "../hooks/use-returns";
import { CustomerSelect } from "@common/components/customer-select";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@ui/table/table";
import { formatMoney } from "../utils/format";

interface SaleSearchPanelProps {
  saleNumberInput: string;
  onSaleNumberInputChange: (value: string) => void;
  onSearch: () => void;
  searching: boolean;
  customerId: string;
  onCustomerIdChange: (id: string) => void;
  customerSales: SaleListItem[];
  customerSaleId: string;
  onSelectCustomerSale: (saleId: string) => void;
}

export const SaleSearchPanel: FC<SaleSearchPanelProps> = ({
  saleNumberInput,
  onSaleNumberInputChange,
  onSearch,
  searching,
  customerId,
  onCustomerIdChange,
  customerSales,
  customerSaleId,
  onSelectCustomerSale,
}) => (
  <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Buscar por folio</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">El número impreso en el ticket de venta.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Ej. 1024"
              value={saleNumberInput}
              onChange={(e) => onSaleNumberInputChange(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={searching || !saleNumberInput}>
            <Search className="mr-1.5 size-4" />
            {searching ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-3 md:flex-col md:self-stretch">
        <span className="h-px flex-1 bg-gray-300 dark:bg-gray-700 md:h-auto md:w-px" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">o</span>
        <span className="h-px flex-1 bg-gray-300 dark:bg-gray-700 md:h-auto md:w-px" />
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Buscar por cliente</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Elige un cliente para ver sus ventas.</p>
        </div>
        <CustomerSelect value={customerId} onChange={(id) => onCustomerIdChange(id)} placeholder="Busca por nombre o teléfono" />
      </div>
    </div>

    {customerId && (
      <div className="custom-scrollbar max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        {customerSales.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Este cliente no tiene ventas registradas.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-800">
                {["Folio", "Fecha", "Total", ""].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerSales.map((s) => (
                <TableRow
                  key={s.id}
                  className={`cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2 ${
                    customerSaleId === s.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                  }`}
                  onClick={() => onSelectCustomerSale(s.id)}
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    #{s.saleNumber}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatMoney(s.totalValue)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm text-brand-600 dark:text-brand-400">
                    {customerSaleId === s.id ? "Seleccionada" : "Usar"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    )}
  </div>
);
