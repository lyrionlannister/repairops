import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export const MAX_PAGE_SIZE = 100;

export class PageQueryDto {
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero" })
  @Min(1, { message: "La página debe ser 1 o mayor" })
  page!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El tamaño de página debe ser un número entero" })
  @Min(1, { message: "El tamaño de página debe ser 1 o mayor" })
  @Max(MAX_PAGE_SIZE, { message: `El tamaño de página no puede ser mayor a ${MAX_PAGE_SIZE}` })
  pageSize?: number;

  @IsOptional()
  @IsString({ message: "La búsqueda debe ser texto" })
  @MaxLength(100, { message: "La búsqueda no puede pasar de 100 caracteres" })
  search?: string;
}

export class LookupQueryDto {
  @IsOptional()
  @IsString({ message: "La búsqueda debe ser texto" })
  @MaxLength(100, { message: "La búsqueda no puede pasar de 100 caracteres" })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El límite debe ser un número entero" })
  @Min(1, { message: "El límite debe ser 1 o mayor" })
  @Max(50, { message: "El límite no puede ser mayor a 50" })
  limit?: number;
}
