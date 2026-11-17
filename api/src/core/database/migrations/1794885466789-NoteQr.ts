import { MigrationInterface, QueryRunner } from "typeorm";

export class NoteQr1794885466789 implements MigrationInterface {
    name = 'NoteQr1794885466789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repair_notes" ADD "public_ref" character varying(8)`);
        // Notas existentes: referencia al azar de 8 caracteres (alfabeto Crockford) a
        // partir de bytes de gen_random_uuid() (CSPRNG). Los bytes 6 y 8 de un uuid v4
        // llevan bits fijos, por eso se usan los demas. Se reintenta ante choque.
        await queryRunner.query(`
            DO $$
            DECLARE
                note_row record;
                candidate text;
                alphabet text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
                bytes bytea;
                i int;
            BEGIN
                FOR note_row IN SELECT id FROM repair_notes WHERE public_ref IS NULL LOOP
                    LOOP
                        bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
                        candidate := '';
                        FOREACH i IN ARRAY ARRAY[0, 1, 2, 3, 4, 5, 9, 10] LOOP
                            candidate := candidate || substr(alphabet, 1 + (get_byte(bytes, i) % 32), 1);
                        END LOOP;
                        EXIT WHEN NOT EXISTS (SELECT 1 FROM repair_notes WHERE public_ref = candidate);
                    END LOOP;
                    UPDATE repair_notes SET public_ref = candidate WHERE id = note_row.id;
                END LOOP;
            END $$
        `);
        await queryRunner.query(`ALTER TABLE "repair_notes" ALTER COLUMN "public_ref" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "repair_note_id" bigint`);
        await queryRunner.query(`ALTER TABLE "whatsapp_accounts" ADD "display_phone_number" character varying(32)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_repair_notes_public_ref" ON "repair_notes" ("public_ref") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_repair_note" ON "chat_messages" ("repair_note_id") `);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_repair_note" FOREIGN KEY ("repair_note_id") REFERENCES "repair_notes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_repair_note"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_repair_note"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_repair_notes_public_ref"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_accounts" DROP COLUMN "display_phone_number"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "repair_note_id"`);
        await queryRunner.query(`ALTER TABLE "repair_notes" DROP COLUMN "public_ref"`);
    }

}
