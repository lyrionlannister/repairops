import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateInventoryTransferDto {
  @IsNotEmpty({ message: "Producto de origen requerido" })
  @IsString({ message: "Producto de origen inválido" })
  fromInventoryItemId!: string;

  @IsNotEmpty({ message: "Producto de destino requerido" })
  @IsString({ message: "Producto de destino inválido" })
  toInventoryItemId!: string;

  @IsInt({ message: "Cantidad debe ser un entero" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsOptional()
  @IsString({ message: "Motivo debe ser texto" })
  reason?: string;

  @IsOptional()
  @IsString({ message: "Empleado que registra inválido" })
  createdByEmployeeId?: string;
}
