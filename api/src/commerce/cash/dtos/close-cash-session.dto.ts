import "reflect-metadata";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CloseCashSessionDto {
  @IsNumber({}, { message: "Saldo de cierre debe ser numérico" })
  @Min(0, { message: "Saldo de cierre debe ser mayor o igual a 0" })
  closingBalance!: number;

  // Requerido solo si hay diferencia distinta de cero (CashService.closeSession).
  @IsOptional()
  @IsString({ message: "Motivo debe ser texto" })
  reason?: string;

  // Requerido solo si la diferencia supera el límite sin autorizar del tenant.
  @IsOptional()
  @IsString({ message: "Empleado que autoriza inválido" })
  authorizedByEmployeeId?: string;
}
