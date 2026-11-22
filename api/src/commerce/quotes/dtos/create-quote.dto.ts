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
  @IsNotEmpty({ message: "localId requerido" })
  @IsString()
  localId!: string;

  // Cotización sobre una nota existente. Obligatoria para quien solo cotiza sus notas.
  @IsOptional()
  @IsString()
  repairNoteId?: string;

  @IsOptional()
  @IsIn(KINDS, { message: "Tipo de cotización inválido" })
  kind?: QuoteKind;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsNotEmpty({ message: "Nombre del cliente requerido" })
  @IsString()
  customerName!: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ValidateIf((o: CreateQuoteDto) => o.kind === "repair")
  @IsNotEmpty({ message: "Marca requerida en una cotización de reparación" })
  @IsString()
  brand?: string;

  @ValidateIf((o: CreateQuoteDto) => o.kind === "repair")
  @IsNotEmpty({ message: "Modelo requerido en una cotización de reparación" })
  @IsString()
  model?: string;

  @ValidateIf((o: CreateQuoteDto) => o.kind === "repair")
  @IsNotEmpty({ message: "Falla reportada requerida en una cotización de reparación" })
  @IsString()
  reportedFailure?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceTypeIds?: string[];

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "La cotización debe tener al menos un item" })
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  items!: QuoteItemInputDto[];
}
