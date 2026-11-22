import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength, IsArray, ArrayNotEmpty, ArrayUnique } from "class-validator";
import { PayCycle, USER_ROLES, UserRole } from "../entities/user.entity.js";

const PAY_CYCLES: PayCycle[] = ["weekly", "biweekly", "monthly"];

export class UpdateEmployeeDto {
  @IsNotEmpty({ message: "Nombre requerido" })
  @IsString({ message: "Nombre debe ser texto" })
  firstName!: string;

  @IsNotEmpty({ message: "Apellido requerido" })
  @IsString({ message: "Apellido debe ser texto" })
  lastName!: string;

  @IsNotEmpty({ message: "Email requerido" })
  @IsEmail({}, { message: "Email inválido" })
  email!: string;

  // Opcional a proposito: dejarlo vacio significa "no cambiar la
  // contrasena actual" (a diferencia de CreateEmployeeDto, donde si es
  // obligatorio).
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password debe tener al menos 8 caracteres" })
  password?: string;

  // Los permisos del usuario son la unión de los de sus roles.
  // Sin roles se conservan los actuales.
  @IsOptional()
  @IsArray({ message: "roles debe ser una lista" })
  @ArrayNotEmpty({ message: "Elige al menos un rol" })
  @ArrayUnique({ message: "Roles repetidos" })
  @IsIn(USER_ROLES, { each: true, message: "Rol inválido" })
  roles?: UserRole[];

  @IsOptional()
  @IsNumber({}, { message: "Salario debe ser numérico" })
  @Min(0, { message: "Salario no puede ser negativo" })
  salaryAmount?: number;

  @IsOptional()
  @IsIn(PAY_CYCLES, { message: "Ciclo de pago inválido" })
  payCycle?: PayCycle;

  // Sucursales del usuario (obligatorio para quien no es owner; el owner accede a todas).
  @IsOptional()
  @IsArray({ message: "branchIds debe ser una lista" })
  @IsString({ each: true })
  branchIds?: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;
}
