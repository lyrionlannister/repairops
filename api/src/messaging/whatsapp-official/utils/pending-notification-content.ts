// Copy del aviso proactivo (texto libre, nunca plantilla HSM) por estado de
// la nota. Se entrega a quien escriba el ref correcto, no solo al
// numero_contacto registrado (el cliente puede estar consultando desde otro
// telefono -- el suyo esta en reparacion). Por eso, igual que
// buildNoteStatusReply, nunca lleva el nombre del cliente ni otro dato
// personal: un ref ajeno no debe filtrar nada.
//
// "delivered" no tiene entrada a proposito: la entrega es presencial (cobra
// el saldo ahi mismo), el cliente ya esta frente al taller y no hace falta
// avisarle nada -- ver WhatsappNotificationQueueService.
const PENDING_NOTIFICATION_CONTENT: Record<string, (controlNumber: number) => string> = {
  received: (numero) =>
    `✅ *Recibimos tu equipo* en nuestro taller.\n\n📋 Nota de control: *#${numero}*\n\nTe avisamos por aquí en cuanto el técnico tenga el diagnóstico. ¡Gracias por tu confianza!`,
  in_repair: (numero) =>
    `🔧 Tu equipo (nota #${numero}) ya está en manos de nuestro técnico.\n\nTe escribimos de nuevo con el diagnóstico o cuando esté listo.`,
  done: (numero) =>
    `🎉 *¡Buenas noticias!*\n\nTu equipo (nota #${numero}) ya está *listo para recoger*.\n\nTe esperamos en nuestro horario habitual. ¡Gracias por tu paciencia!`,
  cancelled: (numero) =>
    `❌ Tu nota *#${numero}* fue *cancelada*.\n\nSi tienes dudas o quieres más información, contáctanos. Estamos a tus órdenes.`,
};

// Mismo vocabulario que whatsapp_template_catalog_entries.trigger_event (ej.
// "order_ready" ya sembrado usa "repair_note.status_changed_to_terminada").
const PENDING_NOTIFICATION_EVENT_KEY: Record<string, string> = {
  received: "repair_note.status_changed_to_recibida",
  in_repair: "repair_note.status_changed_to_en_reparacion",
  done: "repair_note.status_changed_to_terminada",
  cancelled: "repair_note.status_changed_to_cancelada",
};

export interface PendingNotificationContent {
  eventKey: string;
  messageText: string;
}

// null si el estado no tiene aviso propio (ej. "delivered", o un estado
// desconocido): el caller no debe encolar ni enviar nada en ese caso.
export function buildPendingNotificationContent(
  status: string,
  controlNumber: number,
): PendingNotificationContent | null {
  const build = PENDING_NOTIFICATION_CONTENT[status];
  const eventKey = PENDING_NOTIFICATION_EVENT_KEY[status];
  if (!build || !eventKey) return null;
  return { eventKey, messageText: build(controlNumber) };
}
