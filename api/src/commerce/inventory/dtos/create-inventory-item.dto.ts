import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { InventoryItemKind } from "../entities/inventory-item.entity.js";

const KINDS: InventoryItemKind[] = ["accessory", "part"];

export class CreateInventoryItemDto {
  @IsNotEmpty({ message: "Sucursal requerida" })
  @IsString({ message: "Sucursal inválida" })
  localId!: string;

  @IsNotEmpty({ message: "Nombre requerido" })
  @IsString({ message: "Nombre debe ser texto" })
  name!: string;

  @IsOptional()
  @IsString({ message: "SKU debe ser texto" })
  sku?: string;

  @IsOptional()
  @IsString({ message: "Proveedor inválido" })
  supplierId?: string;

  @IsIn(KINDS, { message: "Tipo inválido" })
  kind!: InventoryItemKind;

  @IsNumber({}, { message: "Precio de costo debe ser numérico" })
  @Min(0, { message: "Precio de costo debe ser mayor o igual a 0" })
  costPrice!: number;

  @IsNumber({}, { message: "Precio de venta debe ser numérico" })
  @Min(0, { message: "Precio de venta debe ser mayor o igual a 0" })
  salePrice!: number;

  @IsOptional()
  @IsNumber({}, { message: "Stock mínimo debe ser numérico" })
  @Min(0, { message: "Stock mínimo debe ser mayor o igual a 0" })
  minStock?: number;
}
