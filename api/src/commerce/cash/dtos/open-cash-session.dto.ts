import "reflect-metadata";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class OpenCashSessionDto {
  @IsNotEmpty({ message: "Sucursal requerida" })
  @IsString({ message: "Sucursal inválida" })
  localId!: string;

  @IsNumber({}, { message: "Saldo de apertura debe ser numérico" })
  @Min(0, { message: "Saldo de apertura debe ser mayor o igual a 0" })
  openingBalance!: number;
}
