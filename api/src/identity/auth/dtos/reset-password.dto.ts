import { IsNotEmpty, IsString, Length, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsNotEmpty({ message: "El enlace no es válido" })
  @Length(64, 64, { message: "El enlace no es válido" })
  token!: string;

  @IsNotEmpty({ message: "Contraseña requerida" })
  @IsString({ message: "Contraseña debe ser texto" })
  @MinLength(8, { message: "Contraseña debe tener al menos 8 caracteres" })
  @MaxLength(72, { message: "Contraseña debe tener como máximo 72 caracteres" })
  password!: string;
}
