import { MigrationInterface, QueryRunner } from "typeorm";

// Backfillea los usuarios existentes como ya verificados (con su propia
// fecha_creacion): si no se verifica un correo, ya pasaron el registro
// alguna vez antes de que este gate existiera -- solo las cuentas nuevas,
// creadas después de esta migración, nacen con email_verificado_en NULL.
export class AddEmailVerifiedAtToUsers1795600000020 implements MigrationInterface {
  name = "AddEmailVerifiedAtToUsers1795600000020";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "usuarios" ADD "email_verificado_en" TIMESTAMP
        `);
    await queryRunner.query(`
          UPDATE "usuarios" SET "email_verificado_en" = "fecha_creacion"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "usuarios" DROP COLUMN "email_verificado_en"
        `);
  }
}
