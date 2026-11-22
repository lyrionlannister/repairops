import "reflect-metadata";
import { IsNotEmpty, IsString } from "class-validator";

export class ConnectWhatsappAccountDto {
  @IsNotEmpty({ message: "Cuenta de WhatsApp Business requerida" })
  @IsString({ message: "Cuenta de WhatsApp Business inválida" })
  wabaId!: string;

  @IsNotEmpty({ message: "ID del número de teléfono requerido" })
  @IsString({ message: "ID del número de teléfono inválido" })
  phoneNumberId!: string;

  @IsNotEmpty({ message: "Token de acceso requerido" })
  @IsString({ message: "Token de acceso debe ser texto" })
  accessToken!: string;
}
