import "reflect-metadata";
import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { StagingRowDto } from "./staging-row.dto.js";

export class ImportStagingCallbackDto {
  @IsNotEmpty({ message: "Taller requerido" })
  @IsString({ message: "Taller inválido" })
  tenantId!: string;

  @IsNotEmpty({ message: "Importación requerida" })
  @IsString({ message: "Importación inválida" })
  importId!: string;

  @IsOptional()
  @IsArray({ message: "Filas deben ser una lista" })
  @ValidateNested({ each: true, message: "Filas contienen un valor inválido" })
  @Type(() => StagingRowDto)
  rows?: StagingRowDto[];

  @IsOptional()
  @IsString({ message: "Error debe ser texto" })
  error?: string;
}
