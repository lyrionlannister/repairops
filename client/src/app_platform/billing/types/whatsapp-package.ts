export type WhatsappPackageSize = 500 | 1000 | 2500;

// Precio real de Stripe (MXN, IVA incluido) que devuelve GET
// /billing/whatsapp-packages. El cliente nunca hardcodea cifras: si el price
// no está configurado, price es null y la compra queda deshabilitada.
export interface WhatsappPackageOption {
  size: WhatsappPackageSize;
  price: string | null;
}

export interface WhatsappPackageCheckoutResponse {
  checkoutUrl: string;
}

export interface BillingPortalResponse {
  url: string;
}
