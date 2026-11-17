import "reflect-metadata";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import type { CashMovementMethod } from "../../cash/entities/cash-movement.entity.js";

const METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

export class RegisterCustomerPaymentDto {
  @IsNotEmpty({ message: "localId requerido" })
  @IsString()
  localId!: string;

  @IsNumber({}, { message: "Monto debe ser numérico" })
  @Min(0.01, { message: "El monto del abono debe ser mayor a 0" })
  amount!: number;

  @IsIn(METHODS, { message: "Método de pago inválido" })
  method!: CashMovementMethod;

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;
}
