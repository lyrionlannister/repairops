import "reflect-metadata";
import { IsOptional, Matches } from "class-validator";

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export class ReportPeriodQueryDto {
  @IsOptional()
  @Matches(DATE_FORMAT, { message: "Inicio del periodo inválido, usa YYYY-MM-DD" })
  periodStart?: string;

  @IsOptional()
  @Matches(DATE_FORMAT, { message: "Fin del periodo inválido, usa YYYY-MM-DD" })
  periodEnd?: string;
}
