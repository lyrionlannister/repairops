import type { FC } from "react";
import { Search } from "lucide-react";
import type { SaleListItem } from "../hooks/use-returns";
import { CustomerSelect } from "@common/components/customer-select";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-40">
        <Label className="text-gray-500">Folio de venta</Label>
        <Input
          type="number"
          placeholder="# venta"
          value={saleNumberInput}
          onChange={(e) => onSaleNumberInputChange(e.target.value)}
        />
      </div>
      <Button type="button" variant="outline" onClick={onSearch} disabled={searching}>
        <Search className="mr-1.5 size-4" />
        {searching ? "Buscando..." : "Buscar"}
      </Button>
      <div className="hidden h-11 items-center text-sm text-gray-400 sm:flex">o</div>
      <div className="w-full sm:flex-1">
        <Label className="text-gray-500">Buscar por cliente</Label>
        <CustomerSelect value={customerId} onChange={(id) => onCustomerIdChange(id)} />
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
