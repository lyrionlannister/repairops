import "reflect-metadata";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from "class-validator";

const TICKET_SIZES = ["58mm", "80mm", "letter"] as const;
const MAX_FOLIO = 2_000_000_000;

// Lista blanca de lo que el dueño puede cambiar del local: cualquier otra clave del
// body (tenantId, id, publicId, ...) se descarta antes de llegar al Dao.
export class UpdateLocalDto {
  @IsOptional()
  @IsString({ message: "El nombre del local debe ser texto" })
  @MaxLength(255, { message: "El nombre del local admite hasta 255 caracteres" })
  name?: string;

  @IsOptional()
  @IsString({ message: "La dirección debe ser texto" })
  @MaxLength(500, { message: "La dirección admite hasta 500 caracteres" })
  address?: string;

  @IsOptional()
  @IsString({ message: "El teléfono debe ser texto" })
  @MaxLength(50, { message: "El teléfono admite hasta 50 caracteres" })
  phone?: string;

  @IsOptional()
  @IsString({ message: "El logo debe ser texto" })
  logo?: string;

  @IsOptional()
  @IsString({ message: "La moneda debe ser texto" })
  @MaxLength(3, { message: "La moneda es un código de 3 letras" })
  currency?: string;

  @IsOptional()
  @IsIn(TICKET_SIZES, { message: "Formato de ticket inválido" })
  defaultTicketSize?: (typeof TICKET_SIZES)[number];

  @IsOptional()
  @IsString({ message: "La cláusula de garantía debe ser texto" })
  warrantyClause?: string;

  @ValidateIf((dto: UpdateLocalDto) => dto.brandColor !== null && dto.brandColor !== undefined)
  @IsString({ message: "El color de marca debe ser texto" })
  brandColor?: string | null;

  @IsOptional()
  @IsString({ message: "La zona horaria debe ser texto" })
  timeZone?: string;

  @IsOptional()
  @IsNumber({}, { message: "La unidad de redondeo debe ser numérica" })
  @Min(0, { message: "La unidad de redondeo no puede ser negativa" })
  @Max(99.99, { message: "La unidad de redondeo admite hasta 99.99" })
  cashRoundingUnit?: number;

  @IsOptional()
  @IsNumber({}, { message: "El tope de diferencia de caja debe ser numérico" })
  @Min(0, { message: "El tope de diferencia de caja no puede ser negativo" })
  maxUnauthorizedCashVariance?: number;

  @IsOptional()
  @IsNumber({}, { message: "La tasa de impuesto debe ser numérica" })
  @Min(0, { message: "La tasa de impuesto no puede ser negativa" })
  @Max(100, { message: "La tasa de impuesto admite hasta 100" })
  taxRatePercent?: number;

  @IsOptional()
  @IsInt({ message: "El folio de notas debe ser un número entero" })
  @Min(1, { message: "El folio de notas debe ser al menos 1" })
  @Max(MAX_FOLIO, { message: "El folio de notas es demasiado grande" })
  nextControlNumber?: number;

  @IsOptional()
  @IsInt({ message: "El folio de ventas debe ser un número entero" })
  @Min(1, { message: "El folio de ventas debe ser al menos 1" })
  @Max(MAX_FOLIO, { message: "El folio de ventas es demasiado grande" })
  nextSaleNumber?: number;

  @IsOptional()
  @IsInt({ message: "El folio de devoluciones debe ser un número entero" })
  @Min(1, { message: "El folio de devoluciones debe ser al menos 1" })
  @Max(MAX_FOLIO, { message: "El folio de devoluciones es demasiado grande" })
  nextReturnNumber?: number;

  @IsOptional()
  @IsInt({ message: "El folio de cotizaciones debe ser un número entero" })
  @Min(1, { message: "El folio de cotizaciones debe ser al menos 1" })
  @Max(MAX_FOLIO, { message: "El folio de cotizaciones es demasiado grande" })
  nextQuoteNumber?: number;

  @IsOptional()
  @IsInt({ message: "El folio de cortes de caja debe ser un número entero" })
  @Min(1, { message: "El folio de cortes de caja debe ser al menos 1" })
  @Max(MAX_FOLIO, { message: "El folio de cortes de caja es demasiado grande" })
  nextCutNumber?: number;

  @IsOptional()
  @IsInt({ message: "El folio de conteos debe ser un número entero" })
  @Min(1, { message: "El folio de conteos debe ser al menos 1" })
  @Max(MAX_FOLIO, { message: "El folio de conteos es demasiado grande" })
  nextCountNumber?: number;
}
