import { vi } from "vitest";

// Mismo motivo que stripe-client.mock.ts: con pool vmThreads +
// fileParallelism false, el primer archivo que importa AuthService fija a
// qué instancia de resend.client.js queda ligado el servicio. Un objeto
// compartido evita que algún archivo quede ligado al cliente real ("Falta
// RESEND_API_KEY") o a una instancia que nadie más ve.
//
// Cada archivo que importa (directa o transitivamente) AuthService debe
// registrarlo con:
//   vi.mock(".../src/identity/auth/clients/resend.client.js",
//     async () => (await import(".../support/resend-client.mock.js")).resendClientMock);
export const resendClientMock = {
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
};
