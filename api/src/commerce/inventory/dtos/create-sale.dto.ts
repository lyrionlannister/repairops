import "reflect-metadata";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { SaleOrigin } from "../entities/sale.entity.js";
import { SaleItemLineType } from "../entities/sale-item.entity.js";
import { SalePaymentMethod } from "../../payments/entities/sale-payment.entity.js";

const PAYMENT_METHODS: SalePaymentMethod[] = ["efectivo", "tarjeta", "transferencia", "credito"];
const ORIGINS: SaleOrigin[] = ["counter", "repair_note", "quote"];
const LINE_TYPES: SaleItemLineType[] = ["inventory_item", "service_type"];

export class SaleItemInputDto {
  @IsIn(LINE_TYPES, { message: "lineType inválido" })
  lineType!: SaleItemLineType;

  @IsNotEmpty({ message: "referenceId requerido" })
  @IsString()
  referenceId!: string;

  @IsNumber({}, { message: "Cantidad debe ser numérica" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsNumber({}, { message: "Precio unitario debe ser numérico" })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber({}, { message: "Descuento debe ser numérico" })
  @Min(0)
  @Max(100, { message: "Descuento no puede superar 100%" })
  discountPercent?: number;
}

export class PaymentInputDto {
  @IsIn(PAYMENT_METHODS, { message: "Método de pago inválido" })
  method!: SalePaymentMethod;

  @IsNumber({}, { message: "Monto debe ser numérico" })
  @Min(0.01, { message: "Monto debe ser mayor a 0" })
  amount!: number;

  // Tarjeta en mostrador capturada a mano del terminal físico -- sin
  // llamada a ningún proveedor de pago (ver SPEC-fase3-pos-dinero.md).
  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  providerAuthorizationCode?: string;
}

export class CreateSaleDto {
  @IsNotEmpty({ message: "localId requerido" })
  @IsString()
  localId!: string;

  @IsNotEmpty({ message: "cashSessionId requerido: no se puede cobrar sin una sesión de caja abierta" })
  @IsString()
  cashSessionId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsIn(ORIGINS, { message: "Origen inválido" })
  origin?: SaleOrigin;

  @IsArray()
  @ArrayMinSize(1, { message: "La venta debe tener al menos un pago" })
  @ValidateNested({ each: true })
  @Type(() => PaymentInputDto)
  payments!: PaymentInputDto[];

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  // El IVA no se asume: solo se cobra el taxRatePercent del local si se pide.
  @IsOptional()
  @IsBoolean()
  applyTax?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: "La venta debe tener al menos un item" })
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items!: SaleItemInputDto[];
}
