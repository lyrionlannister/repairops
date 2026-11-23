import "reflect-metadata";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateServiceTypeDto {
  @IsString({ message: "Nombre debe ser texto" })
  @IsNotEmpty({ message: "El nombre del tipo de servicio es obligatorio" })
  @MaxLength(100, { message: "Nombre no puede exceder 100 caracteres" })
  name!: string;

  // Precio base del servicio. Opcional: null/sin valor = el precio lo fija
  // un humano en cada venta y queda en bitácora.
  @IsOptional()
  @IsNumber({}, { message: "Precio base debe ser numérico" })
  @Min(0, { message: "Precio base no puede ser negativo" })
  basePrice?: number;
}
