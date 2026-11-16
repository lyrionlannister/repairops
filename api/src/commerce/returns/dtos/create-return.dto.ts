import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

const REFUND_METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

export class ReturnItemInputDto {
  @IsNotEmpty({ message: "saleItemId requerido" })
  @IsString()
  saleItemId!: string;

  @IsNumber({}, { message: "Cantidad debe ser numérica" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsNumber({}, { message: "Monto a reembolsar debe ser numérico" })
  @Min(0.01, { message: "Monto a reembolsar debe ser mayor a 0" })
  refundAmount!: number;
}

export class CreateReturnDto {
  @IsNotEmpty({ message: "saleId requerido" })
  @IsString()
  saleId!: string;

  @IsNotEmpty({ message: "cashSessionId requerido: no se puede devolver sin una sesión de caja abierta" })
  @IsString()
  cashSessionId!: string;

  @IsIn(REFUND_METHODS, { message: "Método de reembolso inválido" })
  refundMethod!: CashMovementMethod;

  @IsNotEmpty({ message: "reason requerido" })
  @IsString()
  reason!: string;

  @IsNumber({}, { message: "totalRefunded debe ser numérico" })
  @Min(0.01, { message: "totalRefunded debe ser mayor a 0" })
  totalRefunded!: number;

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "La devolución debe tener al menos un item" })
  @ValidateNested({ each: true })
  @Type(() => ReturnItemInputDto)
  items!: ReturnItemInputDto[];
}
