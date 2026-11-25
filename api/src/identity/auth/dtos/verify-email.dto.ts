import { IsNotEmpty, Length } from "class-validator";

export class VerifyEmailDto {
  @IsNotEmpty({ message: "Código requerido" })
  @Length(6, 6, { message: "Código debe tener 6 dígitos" })
  code!: string;
}
