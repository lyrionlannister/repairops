import "reflect-metadata";
import { IsNotEmpty, IsString } from "class-validator";

export class ConnectWhatsappAccountDto {
  @IsNotEmpty({ message: "wabaId requerido" })
  @IsString()
  wabaId!: string;

  @IsNotEmpty({ message: "phoneNumberId requerido" })
  @IsString()
  phoneNumberId!: string;

  @IsNotEmpty({ message: "accessToken requerido" })
  @IsString()
  accessToken!: string;
}
