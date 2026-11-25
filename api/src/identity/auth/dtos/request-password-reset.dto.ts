import { IsEmail, IsNotEmpty } from "class-validator";

export class RequestPasswordResetDto {
  @IsNotEmpty({ message: "Correo electrónico requerido" })
  @IsEmail({}, { message: "Correo electrónico inválido" })
  email!: string;
}
