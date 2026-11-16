import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class SetCountedInventoryCountItemDto {
  @IsInt({ message: "countedQuantity debe ser un entero" })
  @Min(0, { message: "countedQuantity no puede ser negativo" })
  countedQuantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
