import "reflect-metadata";
import { IsArray, IsIn, IsNotEmpty, IsString } from "class-validator";
import type { WhatsappTemplateCategory } from "../entities/whatsapp-template-catalog-entry.entity.js";

const CATEGORIES: WhatsappTemplateCategory[] = ["UTILITY", "MARKETING", "AUTHENTICATION"];

// triggerEvent no es parte del DTO a proposito: solo las entradas con
// disparador automatico (ej. order_ready, sembrada por el sistema) lo
// tienen -- ningun consumidor lee un triggerEvent arbitrario creado a mano
// todavia (ver plan Fase 4, Checkpoint 7, Boundary).
export class CreateWhatsappTemplateCatalogEntryDto {
  @IsNotEmpty({ message: "key requerido" })
  @IsString()
  key!: string;

  @IsNotEmpty({ message: "metaName requerido" })
  @IsString()
  metaName!: string;

  @IsIn(CATEGORIES, { message: "category inválida" })
  category!: WhatsappTemplateCategory;

  @IsNotEmpty({ message: "language requerido" })
  @IsString()
  language!: string;

  @IsNotEmpty({ message: "text requerido" })
  @IsString()
  text!: string;

  @IsArray({ message: "variables debe ser un arreglo" })
  @IsString({ each: true })
  variables!: string[];
}
