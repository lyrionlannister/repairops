import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

const DEPOSIT_METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

export class LayawayItemInputDto {
  @IsNotEmpty({ message: "inventoryItemId requerido" })
  @IsString()
  inventoryItemId!: string;

  @IsNumber({}, { message: "Cantidad debe ser numérica" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsNumber({}, { message: "Precio unitario debe ser numérico" })
  @Min(0)
  unitPrice!: number;
}

export class OpenLayawayDto {
  @IsNotEmpty({ message: "customerId requerido" })
  @IsString()
  customerId!: string;

  @IsNotEmpty({ message: "cashSessionId requerido: no se puede abrir un apartado sin una sesión de caja abierta" })
  @IsString()
  cashSessionId!: string;

  @IsNumber({}, { message: "depositAmount debe ser numérico" })
  @Min(0.01, { message: "El anticipo debe ser mayor a 0" })
  depositAmount!: number;

  @IsIn(DEPOSIT_METHODS, { message: "Método de anticipo inválido" })
  depositMethod!: CashMovementMethod;

  @IsDateString({}, { message: "expiresAt debe ser una fecha válida" })
  expiresAt!: string;

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "El apartado debe tener al menos un item" })
  @ValidateNested({ each: true })
  @Type(() => LayawayItemInputDto)
  items!: LayawayItemInputDto[];
}
