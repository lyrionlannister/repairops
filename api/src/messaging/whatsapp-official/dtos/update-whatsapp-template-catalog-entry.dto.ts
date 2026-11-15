import "reflect-metadata";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

// Solo texto/variables/enabled son editables -- key/metaName/category/
// language son inmutables tras crear (Meta no permite renombrar una
// plantilla, ver plan Fase 4 Checkpoint 7). El DTO ni siquiera los declara:
// si llegan en el body, el Service los ignora en silencio.
export class UpdateWhatsappTemplateCatalogEntryDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
