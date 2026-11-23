import { describe, expect, it } from "vitest";
import {
  isSubscriptionBlocked,
  subscriptionBlockedMessage,
} from "../../../src/core/tenancy/tenant.middleware.js";

describe("isSubscriptionBlocked", () => {
  it.each(["past_due", "canceled"])("bloquea %s fuera de las rutas de recuperación", (status) => {
    expect(isSubscriptionBlocked(status, "/api/v1/repair-notes")).toBe(true);
  });

  it.each(["trialing", "active", "incomplete", null])("no bloquea %s", (status) => {
    expect(isSubscriptionBlocked(status, "/api/v1/repair-notes")).toBe(false);
  });

  it.each(["/api/v1/auth", "/api/v1/billing"])(
    "deja pasar un taller bloqueado por %s (arreglar pago o re-elegir plan)",
    (baseUrl) => {
      expect(isSubscriptionBlocked("past_due", baseUrl)).toBe(false);
      expect(isSubscriptionBlocked("canceled", baseUrl)).toBe(false);
    },
  );

  it("no confunde un prefijo parecido con la ruta de recuperación real", () => {
    expect(isSubscriptionBlocked("canceled", "/api/v1/billing-reports")).toBe(true);
  });
});

describe("subscriptionBlockedMessage", () => {
  it("distingue el mensaje de cancelado del de pago rechazado", () => {
    expect(subscriptionBlockedMessage("canceled")).toMatch(/cancelada/);
    expect(subscriptionBlockedMessage("past_due")).toMatch(/pago/);
  });
});
