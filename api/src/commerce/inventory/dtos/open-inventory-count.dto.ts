import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class OpenInventoryCountDto {
  @IsNotEmpty({ message: "branchId requerido" })
  @IsString()
  branchId!: string;

  @IsOptional()
  @IsString()
  openedByEmployeeId?: string;
}
