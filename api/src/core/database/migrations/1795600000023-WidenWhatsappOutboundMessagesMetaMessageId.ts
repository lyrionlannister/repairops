import { MigrationInterface, QueryRunner } from "typeorm";

// varchar(50) truncaba wamids reales (Meta los manda de ~60-90 caracteres,
// ej. "wamid.HBgNNTIx...NgA=") -- cada intento de INSERT tronaba con
// "value too long for type character varying(50)" DESPUES de que Meta ya
// habia aceptado el envio real: WhatsappSendService.sendFreeTextOnce
// reenviaba en el siguiente reintento del job (ver whatsapp-inbound-queue)
// sin que ninguna fila quedara grabada. 128 iguala a chat_messages.wa_message_id,
// que ya usa ese tamaño para el mismo tipo de valor.
export class WidenWhatsappOutboundMessagesMetaMessageId1795600000023 implements MigrationInterface {
  name = "WidenWhatsappOutboundMessagesMetaMessageId1795600000023";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "whatsapp_outbound_messages"
      ALTER COLUMN "meta_message_id" TYPE character varying(128)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "whatsapp_outbound_messages"
      ALTER COLUMN "meta_message_id" TYPE character varying(50)
    `);
  }
}
