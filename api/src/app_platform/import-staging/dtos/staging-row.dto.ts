import "reflect-metadata";
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from "class-validator";

export class StagingRowDto {
  @IsNotEmpty({ message: "Marca requerida" })
  @IsString({ message: "Marca debe ser texto" })
  @MaxLength(100, { message: "Marca excede 100 caracteres" })
  brand!: string;

  @IsNotEmpty({ message: "Modelo requerido" })
  @IsString({ message: "Modelo debe ser texto" })
  @MaxLength(255, { message: "Modelo excede 255 caracteres" })
  model!: string;

  @IsNumber({}, { message: "Precio debe ser numérico" })
  @Min(0, { message: "Precio debe ser mayor o igual a 0" })
  @Max(99999999.99, { message: "Precio excede el máximo permitido" })
  price!: number;
}
