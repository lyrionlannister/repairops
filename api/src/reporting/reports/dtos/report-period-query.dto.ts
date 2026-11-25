import "reflect-metadata";
import { IsISO8601, IsOptional, Matches } from "class-validator";

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// IsISO8601 strict rechaza fechas imposibles (2026-02-30) que el regex deja pasar
// y que Postgres convertiria en un 500 al castear a ::date.
export class ReportPeriodQueryDto {
  @IsOptional()
  @Matches(DATE_FORMAT, { message: "Fecha de inicio inválida" })
  @IsISO8601({ strict: true }, { message: "Fecha de inicio inválida" })
  periodStart?: string;

  @IsOptional()
  @Matches(DATE_FORMAT, { message: "Fecha de fin inválida" })
  @IsISO8601({ strict: true }, { message: "Fecha de fin inválida" })
  periodEnd?: string;
}
