import "reflect-metadata";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateServiceTypeDto {
  @IsString({ message: "Nombre debe ser texto" })
  @IsNotEmpty({ message: "El nombre del tipo de servicio es obligatorio" })
  @MaxLength(100, { message: "Nombre no puede exceder 100 caracteres" })
  name!: string;
}
