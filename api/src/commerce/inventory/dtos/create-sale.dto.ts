import "reflect-metadata";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
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
  @IsIn(LINE_TYPES, { message: "Tipo de renglón inválido" })
  lineType!: SaleItemLineType;

  @IsNotEmpty({ message: "Referencia requerida" })
  @IsString({ message: "Referencia inválida" })
  referenceId!: string;

  @IsNumber({}, { message: "Cantidad debe ser numérica" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsNumber({}, { message: "Precio unitario debe ser numérico" })
  @Min(0, { message: "Precio unitario debe ser mayor o igual a 0" })
  unitPrice!: number;

  @IsOptional()
  @IsNumber({}, { message: "Descuento debe ser numérico" })
  @Min(0, { message: "Descuento debe ser mayor o igual a 0" })
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
  @IsString({ message: "Referencia del proveedor debe ser texto" })
  providerReference?: string;

  @IsOptional()
  @IsString({ message: "Código de autorización debe ser texto" })
  providerAuthorizationCode?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: "Fecha límite de pago inválida" })
  dueDate?: string;
}

export class CreateSaleDto {
  @IsNotEmpty({ message: "Sucursal requerida" })
  @IsString({ message: "Sucursal inválida" })
  localId!: string;

  @IsNotEmpty({ message: "Sesión de caja requerida: no se puede cobrar sin una sesión de caja abierta" })
  @IsString({ message: "Sesión de caja inválida" })
  cashSessionId!: string;

  @IsOptional()
  @IsString({ message: "Cliente inválido" })
  customerId?: string;

  @IsOptional()
  @IsString({ message: "Nombre del cliente debe ser texto" })
  customerName?: string;

  @IsOptional()
  @IsIn(ORIGINS, { message: "Origen inválido" })
  origin?: SaleOrigin;

  @IsArray({ message: "Pagos deben ser una lista" })
  @ArrayMinSize(1, { message: "La venta debe tener al menos un pago" })
  @ValidateNested({ each: true, message: "Pagos contienen un valor inválido" })
  @Type(() => PaymentInputDto)
  payments!: PaymentInputDto[];

  @IsOptional()
  @IsString({ message: "Empleado que registra inválido" })
  createdByEmployeeId?: string;

  @IsOptional()
  @IsString({ message: "Clave de idempotencia debe ser texto" })
  idempotencyKey?: string;

  // El IVA no se asume: solo se cobra el taxRatePercent del local si se pide.
  @IsOptional()
  @IsBoolean({ message: "Aplicar impuesto debe ser verdadero o falso" })
  applyTax?: boolean;

  @IsArray({ message: "Renglones deben ser una lista" })
  @ArrayMinSize(1, { message: "La venta debe tener al menos un producto" })
  @ValidateNested({ each: true, message: "Renglones contienen un valor inválido" })
  @Type(() => SaleItemInputDto)
  items!: SaleItemInputDto[];
}
