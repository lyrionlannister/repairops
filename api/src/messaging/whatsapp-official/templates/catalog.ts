// Catálogo de plantillas HSM proactivas -- únicamente mensajes que salen
// fuera de la ventana de 24h y por eso necesitan aprobación de Meta (ver
// SPEC-fase4-whatsapp-oficial.md). Las 16 respuestas libres del chat NO
// van aquí: se migran como texto plano dentro de la ventana (Checkpoint 4).

// variables usa placeholders NAMED ({{nombre}}, no {{1}}) -- cada entrada de
// variables es el nombre exacto del placeholder que aparece en text.
export type TemplateCatalogEntry = {
  key: string;
  metaName: string;
  category: "UTILITY" | "MARKETING";
  language: string;
  text: string;
  variables: string[];
  triggerEvent: string;
};

export const templateCatalog: TemplateCatalogEntry[] = [
  {
    key: "order_ready",
    metaName: "orden_lista_recoger",
    category: "UTILITY",
    language: "es_MX",
    text: "Hola {{nombre}}, tu equipo {{modelo}} ya está listo para recoger en nuestra sucursal.",
    variables: ["nombre", "modelo"],
    triggerEvent: "repair_note.status_changed_to_terminada",
  },
];
