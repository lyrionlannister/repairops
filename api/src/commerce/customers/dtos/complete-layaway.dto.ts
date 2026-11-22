import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

const PAYMENT_METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

export class CompleteLayawayPaymentDto {
  @IsIn(PAYMENT_METHODS, { message: "Método de pago inválido" })
  method!: CashMovementMethod;

  @IsNumber({}, { message: "Monto debe ser numérico" })
  @Min(0.01, { message: "Monto debe ser mayor a 0" })
  amount!: number;
}

export class CompleteLayawayDto {
  @IsNotEmpty({ message: "Sesión de caja requerida" })
  @IsString({ message: "Sesión de caja inválida" })
  cashSessionId!: string;

  @IsArray({ message: "Pagos deben ser una lista" })
  @ArrayMinSize(1, { message: "Se requiere al menos un pago" })
  @ValidateNested({ each: true, message: "Pagos contienen un valor inválido" })
  @Type(() => CompleteLayawayPaymentDto)
  payments!: CompleteLayawayPaymentDto[];
}
