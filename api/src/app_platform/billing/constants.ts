// 14 días con tarjeta ya capturada (Checkout) antes del primer cobro real --
// aplica sea que el plan se elija en el registro (no, ya no) o justo después
// (onboarding, ver BillingService.selectPlan).
export const TRIAL_PERIOD_DAYS = 14;

// Tamaños de paquete extra de mensajes de WhatsApp (one-time, no acumulable).
// Un solo lugar que los conoce: el controller valida el :size y el servicio
// lista los precios contra esta misma lista.
export const WHATSAPP_PACKAGE_SIZES = [500, 1000, 2500] as const;

export type WhatsappPackageSize = (typeof WHATSAPP_PACKAGE_SIZES)[number];
