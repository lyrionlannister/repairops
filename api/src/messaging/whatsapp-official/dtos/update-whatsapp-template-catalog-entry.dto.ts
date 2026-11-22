import "reflect-metadata";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

// Solo texto/variables/enabled son editables -- key/metaName/category/
// language son inmutables tras crear (Meta no permite renombrar una
// plantilla, ver plan Fase 4 Checkpoint 7). El DTO ni siquiera los declara:
// si llegan en el body, el Service los ignora en silencio.
export class UpdateWhatsappTemplateCatalogEntryDto {
  @IsOptional()
  @IsString({ message: "Texto inválido" })
  text?: string;

  @IsOptional()
  @IsArray({ message: "Variables deben ser una lista" })
  @IsString({ each: true, message: "Variables contienen un valor inválido" })
  variables?: string[];

  @IsOptional()
  @IsBoolean({ message: "Activo debe ser verdadero o falso" })
  enabled?: boolean;
}
