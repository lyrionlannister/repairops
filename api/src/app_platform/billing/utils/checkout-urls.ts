import { optionalEnv } from "../../../core/config/env.js";

function clientUrl(): string {
  return optionalEnv("CLIENT_URL", "http://localhost:5173");
}

// El Checkout se dispara desde BillingService.selectPlan (onboarding ya
// logueado), nunca desde el registro -- al volver, la app ya resuelve sola a
// dónde ir según subscriptionStatus (ver use-auth-guard.ts). Un cancel vuelve
// al picker de planes, no a una página muerta de "sign-up".
export function signupCheckoutUrls(): { successUrl: string; cancelUrl: string } {
  const base = clientUrl();
  return {
    successUrl: `${base}/home?trial=started`,
    cancelUrl: `${base}/identity/onboarding/plan`,
  };
}

export function whatsappPackageCheckoutUrls(): { successUrl: string; cancelUrl: string } {
  const base = clientUrl();
  return {
    successUrl: `${base}/messaging/whatsapp-official?paquete=comprado`,
    cancelUrl: `${base}/messaging/whatsapp-official?paquete=cancelado`,
  };
}
