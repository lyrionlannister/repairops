import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength, IsArray, ArrayNotEmpty, ArrayUnique } from "class-validator";
import { PayCycle, USER_ROLES, UserRole } from "../entities/user.entity.js";

const PAY_CYCLES: PayCycle[] = ["weekly", "biweekly", "monthly"];

export class CreateEmployeeDto {
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

  @IsArray({ message: "Roles deben ser una lista" })
  @ArrayNotEmpty({ message: "Elige al menos un rol" })
  @ArrayUnique({ message: "Roles repetidos" })
  @IsIn(USER_ROLES, { each: true, message: "Rol inválido" })
  roles!: UserRole[];

  @IsOptional()
  @IsNumber({}, { message: "Salario debe ser numérico" })
  @Min(0, { message: "Salario no puede ser negativo" })
  salaryAmount?: number;

  @IsOptional()
  @IsIn(PAY_CYCLES, { message: "Ciclo de pago inválido" })
  payCycle?: PayCycle;

  // Sucursales del usuario (obligatorio para quien no es owner; el owner accede a todas).
  @IsOptional()
  @IsArray({ message: "Sucursales deben ser una lista" })
  @IsString({ each: true, message: "Sucursales contienen un valor inválido" })
  branchIds?: string[];

  @IsOptional()
  @IsString({ message: "Sucursal principal inválida" })
  primaryBranchId?: string;
}
