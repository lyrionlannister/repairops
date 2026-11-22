import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterUserDto {
  @IsNotEmpty({ message: "Nombre requerido" })
  @IsString({ message: "Nombre debe ser texto" })
  firstName!: string;

  @IsNotEmpty({ message: "Apellido requerido" })
  @IsString({ message: "Apellido debe ser texto" })
  lastName!: string;

  @IsNotEmpty({ message: "Correo electrónico requerido" })
  @IsEmail({}, { message: "Correo electrónico inválido" })
  email!: string;

  @IsNotEmpty({ message: "Contraseña requerida" })
  @IsString({ message: "Contraseña debe ser texto" })
  @MinLength(8, { message: "Contraseña debe tener al menos 8 caracteres" })
  password!: string;
}
