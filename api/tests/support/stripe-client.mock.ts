import { vi } from "vitest";

// Mock ÚNICO y compartido del cliente de Stripe para todos los tests.
//
// Por qué no basta un vi.mock por archivo: con pool vmThreads +
// fileParallelism false, los módulos se comparten entre archivos del
// mismo worker y el primer archivo que importa BillingService/AuthService
// fija a qué instancia de stripe.client.js queda ligado el servicio. Si
// ese archivo no mockea, el servicio queda ligado al cliente real y los
// demás archivos fallan con "Falta STRIPE_PRIVATE_KEY" solo en la suite
// completa; si mockea con su propia factoría, el servicio queda ligado a
// ESA instancia y los demás archivos afirman sobre la suya (0 llamadas).
// Con este objeto compartido, el servicio y todos los tests usan las
// mismas funciones mock: da igual qué archivo cargue primero el servicio.
//
// Cada archivo que importa (directa o transitivamente) BillingService o
// AuthService debe registrarlo con:
//   vi.mock(".../src/app_platform/billing/clients/stripe.client.js",
//     async () => (await import(".../support/stripe-client.mock.js")).stripeClientMock);
//
// Ningún test llama a Stripe de verdad: las funciones de red devuelven
// valores fijos. Los helpers puros del cliente (constructWebhookEvent,
// toLocalSubscriptionStatus...) no se mockean aquí: ningún test los usa
// a través de este mock.
export const stripeClientMock = {
  createCustomer: vi.fn().mockResolvedValue({ id: "cus_test123" }),
  createSubscriptionCheckoutSession: vi
    .fn()
    .mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
  createOneTimeCheckoutSession: vi
    .fn()
    .mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
  createBillingPortalSession: vi
    .fn()
    .mockResolvedValue({ url: "https://billing.stripe.com/portal/test" }),
  retrieveSubscription: vi.fn().mockResolvedValue(null),
  retrieveCheckoutSession: vi.fn().mockResolvedValue(null),
  syncExtrasSubscription: vi.fn().mockResolvedValue(undefined),
};
