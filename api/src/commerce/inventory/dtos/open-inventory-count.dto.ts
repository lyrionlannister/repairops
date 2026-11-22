import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class OpenInventoryCountDto {
  @IsNotEmpty({ message: "Sucursal requerida" })
  @IsString({ message: "Sucursal inválida" })
  branchId!: string;

  @IsOptional()
  @IsString({ message: "Empleado que abre inválido" })
  openedByEmployeeId?: string;
}
