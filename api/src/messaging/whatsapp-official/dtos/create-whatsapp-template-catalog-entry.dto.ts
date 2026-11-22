import "reflect-metadata";
import { IsArray, IsIn, IsNotEmpty, IsString } from "class-validator";
import type { WhatsappTemplateCategory } from "../entities/whatsapp-template-catalog-entry.entity.js";

const CATEGORIES: WhatsappTemplateCategory[] = ["UTILITY", "MARKETING", "AUTHENTICATION"];

// triggerEvent no es parte del DTO a proposito: solo las entradas con
// disparador automatico (ej. order_ready, sembrada por el sistema) lo
// tienen -- ningun consumidor lee un triggerEvent arbitrario creado a mano
// todavia (ver plan Fase 4, Checkpoint 7, Boundary).
export class CreateWhatsappTemplateCatalogEntryDto {
  @IsNotEmpty({ message: "Clave requerida" })
  @IsString({ message: "Clave debe ser texto" })
  key!: string;

  @IsNotEmpty({ message: "Nombre en Meta requerido" })
  @IsString({ message: "Nombre en Meta debe ser texto" })
  metaName!: string;

  @IsIn(CATEGORIES, { message: "Categoría inválida" })
  category!: WhatsappTemplateCategory;

  @IsNotEmpty({ message: "Idioma requerido" })
  @IsString({ message: "Idioma debe ser texto" })
  language!: string;

  @IsNotEmpty({ message: "Texto requerido" })
  @IsString({ message: "Texto inválido" })
  text!: string;

  @IsArray({ message: "Variables deben ser una lista" })
  @IsString({ each: true, message: "Variables contienen un valor inválido" })
  variables!: string[];
}
