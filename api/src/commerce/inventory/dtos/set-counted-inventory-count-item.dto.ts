import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class SetCountedInventoryCountItemDto {
  @IsInt({ message: "Cantidad contada debe ser un entero" })
  @Min(0, { message: "Cantidad contada no puede ser negativa" })
  countedQuantity!: number;

  @IsOptional()
  @IsString({ message: "Motivo debe ser texto" })
  reason?: string;
}
