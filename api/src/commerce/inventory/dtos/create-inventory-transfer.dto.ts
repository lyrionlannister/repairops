import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateInventoryTransferDto {
  @IsNotEmpty({ message: "fromInventoryItemId requerido" })
  @IsString()
  fromInventoryItemId!: string;

  @IsNotEmpty({ message: "toInventoryItemId requerido" })
  @IsString()
  toInventoryItemId!: string;

  @IsInt({ message: "Cantidad debe ser un entero" })
  @Min(1, { message: "Cantidad debe ser al menos 1" })
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;
}
