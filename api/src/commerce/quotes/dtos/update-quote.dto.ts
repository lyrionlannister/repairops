import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { QuoteItemInputDto } from "./quote-item-input.dto.js";

export class UpdateQuoteDto {
  @IsOptional()
  @IsString({ message: "Cliente inválido" })
  customerId?: string;

  @IsOptional()
  @IsString({ message: "Nombre del cliente debe ser texto" })
  customerName?: string;

  @IsOptional()
  @IsString({ message: "Número de contacto debe ser texto" })
  contactNumber?: string;

  @ValidateIf((o: UpdateQuoteDto) => o.brand !== undefined || o.model !== undefined || o.reportedFailure !== undefined)
  @IsString({ message: "Marca debe ser texto" })
  brand?: string;

  @ValidateIf((o: UpdateQuoteDto) => o.brand !== undefined || o.model !== undefined || o.reportedFailure !== undefined)
  @IsString({ message: "Modelo debe ser texto" })
  model?: string;

  @ValidateIf((o: UpdateQuoteDto) => o.brand !== undefined || o.model !== undefined || o.reportedFailure !== undefined)
  @IsString({ message: "Falla reportada debe ser texto" })
  reportedFailure?: string;

  @IsOptional()
  @IsArray({ message: "Tipos de servicio deben ser una lista" })
  @IsString({ each: true, message: "Tipos de servicio contienen un valor inválido" })
  serviceTypeIds?: string[];

  @IsOptional()
  @IsString({ message: "Vigencia debe ser texto" })
  validUntil?: string;

  @IsOptional()
  @IsString({ message: "Empleado que registra inválido" })
  createdByEmployeeId?: string;

  @IsOptional()
  @IsArray({ message: "Renglones deben ser una lista" })
  @ArrayMinSize(1, { message: "La cotización debe tener al menos un producto" })
  @ValidateNested({ each: true, message: "Renglones contienen un valor inválido" })
  @Type(() => QuoteItemInputDto)
  items?: QuoteItemInputDto[];
}
