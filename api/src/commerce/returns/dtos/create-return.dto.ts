import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

const REFUND_METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

export class ReturnItemInputDto {
  @IsNotEmpty({ message: "Renglón de venta requerido" })
  @IsString({ message: "Renglón de venta inválido" })
  saleItemId!: string;

  @IsNumber({}, { message: "Cantidad debe ser numérica" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsNumber({}, { message: "Monto a reembolsar debe ser numérico" })
  @Min(0.01, { message: "Monto a reembolsar debe ser mayor a 0" })
  refundAmount!: number;
}

export class CreateReturnDto {
  @IsNotEmpty({ message: "Venta requerida" })
  @IsString({ message: "Venta inválida" })
  saleId!: string;

  @IsNotEmpty({ message: "Sesión de caja requerida: no se puede devolver sin una sesión de caja abierta" })
  @IsString({ message: "Sesión de caja inválida" })
  cashSessionId!: string;

  @IsIn(REFUND_METHODS, { message: "Método de reembolso inválido" })
  refundMethod!: CashMovementMethod;

  @IsNotEmpty({ message: "Motivo requerido" })
  @IsString({ message: "Motivo debe ser texto" })
  reason!: string;

  @IsNumber({}, { message: "Total reembolsado debe ser numérico" })
  @Min(0.01, { message: "Total reembolsado debe ser mayor a 0" })
  totalRefunded!: number;

  @IsOptional()
  @IsString({ message: "Empleado que registra inválido" })
  createdByEmployeeId?: string;

  @IsOptional()
  @IsString({ message: "Clave de idempotencia debe ser texto" })
  idempotencyKey?: string;

  @IsArray({ message: "Renglones deben ser una lista" })
  @ArrayMinSize(1, { message: "La devolución debe tener al menos un item" })
  @ValidateNested({ each: true, message: "Renglones contienen un valor inválido" })
  @Type(() => ReturnItemInputDto)
  items!: ReturnItemInputDto[];
}
