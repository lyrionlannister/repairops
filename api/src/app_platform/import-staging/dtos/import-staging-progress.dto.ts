import "reflect-metadata";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class ImportStagingProgressDto {
  @IsNotEmpty({ message: "Taller requerido" })
  @IsString({ message: "Taller inválido" })
  tenantId!: string;

  @IsNotEmpty({ message: "Importación requerida" })
  @IsString({ message: "Importación inválida" })
  importId!: string;

  @IsInt({ message: "Total de bloques debe ser un entero" })
  @Min(1, { message: "Total de bloques debe ser mayor a 0" })
  chunksTotal!: number;

  @IsInt({ message: "Productos del bloque debe ser un entero" })
  @Min(0, { message: "Productos del bloque debe ser mayor o igual a 0" })
  itemsInChunk!: number;
}
