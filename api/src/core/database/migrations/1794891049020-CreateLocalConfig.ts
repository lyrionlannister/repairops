import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocalConfig1794891049020 implements MigrationInterface {
  name = "CreateLocalConfig1794891049020";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "local_config" (
            "id" BIGSERIAL NOT NULL,
            "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" bigint NOT NULL,
            "nombre" character varying(255),
            "direccion" character varying(500),
            "telefono" character varying(50),
            "logo" text,
            "siguiente_numero_control" integer NOT NULL DEFAULT '1',
            "siguiente_numero_venta" integer NOT NULL DEFAULT '1',
            "siguiente_numero_devolucion" integer NOT NULL DEFAULT '1',
            "tasa_impuesto" numeric(5, 2) NOT NULL DEFAULT '16',
            "tope_descuento_por_rol" jsonb NOT NULL DEFAULT '{}',
            "unidad_redondeo_caja" numeric(4, 2) NOT NULL DEFAULT '0',
            "tope_diferencia_caja_sin_autorizar" numeric(10, 2) NOT NULL DEFAULT '50',
            "moneda" character varying(3) NOT NULL DEFAULT 'MXN',
            "formato_ticket" character varying(10) NOT NULL DEFAULT '80mm',
            "color_marca" character varying(7),
            "zona_horaria" character varying(64) NOT NULL DEFAULT 'America/Mexico_City',
            "clausula_garantia" text,
            "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
            "fecha_actualizacion" TIMESTAMP DEFAULT now(),
            CONSTRAINT "UQ_482d2b34d9cdf9568c43570b869" UNIQUE ("public_id"),
            CONSTRAINT "UQ_f23d36d434394af5515a7349d92" UNIQUE ("tenant_id"),
            CONSTRAINT "CHK_local_config_color_marca" CHECK (
              "color_marca" IS NULL
              OR "color_marca" ~ '^#[0-9a-f]{6}$'
            ),
            CONSTRAINT "PK_18f4b3de7b55af2b1b6aa5ca1c8" PRIMARY KEY ("id")
          )
        `);
    await queryRunner.query(`
          ALTER TABLE "local_config"
          ADD CONSTRAINT "FK_local_config_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "local_config"
          DROP CONSTRAINT "FK_local_config_tenant"
        `);
    await queryRunner.query(`
          DROP TABLE "local_config"
        `);
  }
}
