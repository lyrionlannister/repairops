import "reflect-metadata";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CloseCashSessionDto {
  @IsNumber({}, { message: "Saldo de cierre debe ser numérico" })
  @Min(0)
  closingBalance!: number;

  // Requerido solo si hay diferencia distinta de cero (CashService.closeSession).
  @IsOptional()
  @IsString()
  reason?: string;

  // Requerido solo si la diferencia supera el límite sin autorizar del tenant.
  @IsOptional()
  @IsString()
  authorizedByEmployeeId?: string;
}
