import type { SaleListItem } from "../types/returns";

export interface SaleSearchPanelProps {
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
