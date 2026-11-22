export interface PriceListSupplier {
  id: string;
  name: string;
  phone: string;
}

export interface PriceListItemFormData {
  brand: string;
  model: string;
  price: string;
  supplierId: string;
}

export interface PriceListItem {
  id: string;
  brand: string;
  model: string;
  price: number;
  supplierId: string;
  supplier: PriceListSupplier;
  createdAt: string;
  updatedAt: string;
}
