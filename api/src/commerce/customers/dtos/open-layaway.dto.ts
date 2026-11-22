import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

const DEPOSIT_METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

export class LayawayItemInputDto {
  @IsNotEmpty({ message: "Producto requerido" })
  @IsString({ message: "Producto inválido" })
  inventoryItemId!: string;

  @IsNumber({}, { message: "Cantidad debe ser numérica" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsNumber({}, { message: "Precio unitario debe ser numérico" })
  @Min(0, { message: "Precio unitario debe ser mayor o igual a 0" })
  unitPrice!: number;
}

export class OpenLayawayDto {
  @IsNotEmpty({ message: "Cliente requerido" })
  @IsString({ message: "Cliente inválido" })
  customerId!: string;

  @IsNotEmpty({ message: "Sesión de caja requerida: no se puede abrir un apartado sin una sesión de caja abierta" })
  @IsString({ message: "Sesión de caja inválida" })
  cashSessionId!: string;

  @IsNumber({}, { message: "Anticipo debe ser numérico" })
  @Min(0.01, { message: "El anticipo debe ser mayor a 0" })
  depositAmount!: number;

  @IsIn(DEPOSIT_METHODS, { message: "Método de anticipo inválido" })
  depositMethod!: CashMovementMethod;

  @IsDateString({}, { message: "Fecha de vencimiento debe ser una fecha válida" })
  expiresAt!: string;

  @IsOptional()
  @IsString({ message: "Empleado que registra inválido" })
  createdByEmployeeId?: string;

  @IsArray({ message: "Renglones deben ser una lista" })
  @ArrayMinSize(1, { message: "El apartado debe tener al menos un item" })
  @ValidateNested({ each: true, message: "Renglones contienen un valor inválido" })
  @Type(() => LayawayItemInputDto)
  items!: LayawayItemInputDto[];
}
