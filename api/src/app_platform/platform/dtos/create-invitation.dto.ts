import { IsEmail, IsInt, IsOptional, Max, Min } from "class-validator";

export class CreateInvitationDto {
  @IsOptional()
  @IsEmail({}, { message: "Correo electrónico inválido" })
  email?: string;

  @IsOptional()
  @IsInt({ message: "Días de vigencia debe ser un número entero" })
  @Min(1, { message: "La vigencia mínima es 1 día" })
  @Max(90, { message: "La vigencia máxima es 90 días" })
  expiresInDays?: number;
}
