import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto {
  @IsNotEmpty({ message: "Token requerido" })
  @IsString({ message: "Token debe ser texto" })
  token!: string;
}
