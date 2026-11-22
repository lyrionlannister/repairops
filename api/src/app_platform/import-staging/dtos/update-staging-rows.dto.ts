import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { StagingRowDto } from "./staging-row.dto.js";

export class UpdateStagingRowsDto {
  @IsArray({ message: "Filas deben ser una lista" })
  @ArrayMinSize(0, { message: "Filas inválidas" })
  @ValidateNested({ each: true, message: "Filas contienen un valor inválido" })
  @Type(() => StagingRowDto)
  rows!: StagingRowDto[];
}
