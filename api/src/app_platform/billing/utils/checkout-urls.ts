import { optionalEnv } from "../../../core/config/env.js";

function clientUrl(): string {
  return optionalEnv("CLIENT_URL", "http://localhost:5173");
}

export function signupCheckoutUrls(): { successUrl: string; cancelUrl: string } {
  const base = clientUrl();
  return {
    successUrl: `${base}/identity/sign-up/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/identity/sign-up/cancelled`,
  };
}

export function whatsappPackageCheckoutUrls(): { successUrl: string; cancelUrl: string } {
  const base = clientUrl();
  return {
    successUrl: `${base}/messaging/whatsapp-official?paquete=comprado`,
    cancelUrl: `${base}/messaging/whatsapp-official?paquete=cancelado`,
  };
}
