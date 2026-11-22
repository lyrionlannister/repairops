import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {
  @IsNotEmpty({ message: "Correo electrónico requerido" })
  @IsEmail({}, { message: "Correo electrónico inválido" })
  email!: string;

  @IsNotEmpty({ message: "Contraseña requerida" })
  @IsString({ message: "Contraseña debe ser texto" })
  password!: string;
}
