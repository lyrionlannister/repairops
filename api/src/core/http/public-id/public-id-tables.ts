// Ningun id interno (bigint) sale por la API ni se acepta como entrada: toda tabla
// con public_id se traduce en la frontera HTTP. Aqui solo vive lo que los metadatos
// de TypeORM no dicen: etiquetas del 404, columnas de referencia sin FK real y
// asociaciones polimorficas.

export const NOT_FOUND_LABELS: ReadonlyMap<string, string> = new Map([
  ["customers", "el cliente"],
  ["usuarios", "el usuario"],
  ["branches", "la sucursal"],
  ["tenants", "el taller"],
  ["sales", "la venta"],
  ["sale_items", "el renglón de la venta"],
  ["repair_notes", "la nota de reparación"],
  ["repair_note_items", "el renglón de la nota"],
  ["quotes", "la cotización"],
  ["returns", "la devolución"],
  ["layaways", "el apartado"],
  ["layaway_items", "el renglón del apartado"],
  ["inventory_items", "el producto"],
  ["inventory_counts", "el conteo"],
  ["inventory_count_items", "el renglón del conteo"],
  ["inventory_transfers", "la transferencia"],
  ["cash_sessions", "la sesión de caja"],
  ["proveedores", "el proveedor"],
  ["price_list_items", "el producto de la lista de precios"],
  ["service_types", "el tipo de servicio"],
  ["message_templates", "la plantilla"],
  ["notifications", "la notificación"],
  ["whatsapp_template_catalog_entries", "la plantilla de WhatsApp"],
  ["whatsapp_accounts", "la cuenta de WhatsApp"],
]);

// Nombre de la propiedad (en entidades, filas crudas y bodies) -> tabla a la que apunta.
// Un valor array (ej. serviceTypeIds) se traduce elemento por elemento.
export const REFERENCES_WITHOUT_FK: ReadonlyMap<string, string> = new Map([
  ["customerId", "customers"],
  ["assignedEmployeeId", "usuarios"],
  ["createdByEmployeeId", "usuarios"],
  ["openedByEmployeeId", "usuarios"],
  ["closedByEmployeeId", "usuarios"],
  ["varianceAuthorizedByEmployeeId", "usuarios"],
  ["authorizedByEmployeeId", "usuarios"],
  ["employeeId", "usuarios"],
  ["userId", "usuarios"],
  ["inventoryItemId", "inventory_items"],
  ["cashSessionId", "cash_sessions"],
  ["saleId", "sales"],
  ["repairNoteId", "repair_notes"],
  ["quoteId", "quotes"],
  ["supplierId", "proveedores"],
  ["serviceTypeId", "service_types"],
  ["serviceTypeIds", "service_types"],
  ["localId", "branches"],
  ["branchId", "branches"],
  ["branchIds", "branches"],
  ["primaryBranchId", "branches"],
  ["missingReasonItemIds", "inventory_count_items"],
]);

export interface PolymorphicReference {
  idKey: string;
  typeKey: string;
  tables: Readonly<Record<string, string>>;
}

// La tabla del id la decide el discriminador de la misma fila (patron relatedEntityType
// + relatedEntityId, y lineType + referenceId en sale_items).
export const POLYMORPHIC_REFERENCES: readonly PolymorphicReference[] = [
  {
    idKey: "relatedEntityId",
    typeKey: "relatedEntityType",
    tables: {
      sale: "sales",
      repair_note: "repair_notes",
      repair_note_item: "repair_note_items",
      quote: "quotes",
      return: "returns",
      layaway: "layaways",
      layaway_item: "layaway_items",
      customer_payment: "customer_payments",
      transfer: "inventory_transfers",
      count: "inventory_counts",
    },
  },
  {
    idKey: "referenceId",
    typeKey: "lineType",
    tables: { inventory_item: "inventory_items", service_type: "service_types" },
  },
];

// Claves `*Id` cuyo valor es un identificador externo (WhatsApp/Meta, telefono, uuid
// propio), no la posicion de una fila: el guard de fugas no las revisa.
export const EXTERNAL_ID_KEYS: ReadonlySet<string> = new Set([
  "sessionId",
  "phoneNumberId",
  "wabaId",
  "businessAccountId",
  "mediaId",
  "messageId",
  "metaMessageId",
  "metaTemplateId",
  "waMessageId",
  "sourceMessageId",
  "jobId",
  "waId",
  "importId",
  "appId",
]);
