import { Column, PrimaryGeneratedColumn } from "typeorm";

// `id` es la PK interna (bigint autoincremental), la que deben usar FKs y
// joins -- comparar bigint es mas rapido que comparar uuid. `publicId` es el
// unico identificador que debe salir hacia la API/URL/logs: no permite
// enumerar registros ni revela volumen de negocio (igual que en `template`).
export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  // v7 (ordenable por tiempo) para que el indice unique crezca al final en vez de
  // fragmentarse; requiere Postgres 18+. Las filas previas conservan su v4.
  @Column({ type: "uuid", name: "public_id", unique: true, default: () => "uuidv7()" })
  publicId!: string;
}
