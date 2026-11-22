import "reflect-metadata";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { QuoteItemInputDto } from "./quote-item-input.dto.js";
import type { QuoteKind } from "../entities/quote.entity.js";

const KINDS: QuoteKind[] = ["product", "repair"];

export class CreateQuoteDto {
  @IsNotEmpty({ message: "Sucursal requerida" })
  @IsString({ message: "Sucursal inválida" })
  localId!: string;

  // Cotización sobre una nota existente. Obligatoria para quien solo cotiza sus notas.
  @IsOptional()
  @IsString({ message: "Nota de reparación inválida" })
  repairNoteId?: string;

  @IsOptional()
  @IsIn(KINDS, { message: "Tipo de cotización inválido" })
  kind?: QuoteKind;

  @IsOptional()
  @IsString({ message: "Cliente inválido" })
  customerId?: string;

  @IsNotEmpty({ message: "Nombre del cliente requerido" })
  @IsString({ message: "Nombre del cliente debe ser texto" })
  customerName!: string;

  @IsOptional()
  @IsString({ message: "Número de contacto debe ser texto" })
  contactNumber?: string;

  @ValidateIf((o: CreateQuoteDto) => o.kind === "repair")
  @IsNotEmpty({ message: "Marca requerida en una cotización de reparación" })
  @IsString({ message: "Marca debe ser texto" })
  brand?: string;

  @ValidateIf((o: CreateQuoteDto) => o.kind === "repair")
  @IsNotEmpty({ message: "Modelo requerido en una cotización de reparación" })
  @IsString({ message: "Modelo debe ser texto" })
  model?: string;

  @ValidateIf((o: CreateQuoteDto) => o.kind === "repair")
  @IsNotEmpty({ message: "Falla reportada requerida en una cotización de reparación" })
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

  @IsArray({ message: "Renglones deben ser una lista" })
  @ArrayMinSize(1, { message: "La cotización debe tener al menos un item" })
  @ValidateNested({ each: true, message: "Renglones contienen un valor inválido" })
  @Type(() => QuoteItemInputDto)
  items!: QuoteItemInputDto[];
}
