import "reflect-metadata";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { container } from "tsyringe";
import { registerRoutes } from "../../../src/core/http/register-routes.js";
import { authMiddleware } from "../../../src/identity/auth/middlewares/auth.middleware.js";
// Mock compartido de Stripe (tests/support/stripe-client.mock.ts): con
// pool vmThreads el servicio queda ligado a la instancia del primer
// archivo que lo importa; si cada archivo usa su propia factoría, los
// demás afirman sobre otra instancia (0 llamadas) o sobre el cliente
// real ("Falta STRIPE_PRIVATE_KEY") solo en la suite completa.
vi.mock(
  "../../../../src/app_platform/billing/clients/stripe.client.js",
  async () => (await import("../../../support/stripe-client.mock.js")).stripeClientMock,
);

type Handler = ((...args: unknown[]) => unknown) & { permissions?: readonly string[] };
interface Layer {
  handle: Handler & { stack?: Layer[] };
  route?: { path: string; methods: Record<string, boolean>; stack: Layer[] };
}

interface RouteInfo {
  route: string;
  authenticated: boolean;
  guarded: boolean;
}

// Recorre los routers ya montados: toda ruta detrás de authMiddleware debe declarar un
// permiso (requirePermission, requirePlatformPermission o authenticatedOnly), en el
// router o en la ruta. Así un endpoint nuevo sin permiso no llega a main.
function collectRoutes(app: express.Express): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const rootStack = (app as unknown as { router: { stack: Layer[] } }).router.stack;
  rootStack.forEach((mounted, index) => {
    const stack = mounted.handle.stack;
    if (!stack) return;
    let authenticated = false;
    let guarded = false;
    for (const layer of stack) {
      if (!layer.route) {
        if (layer.handle === authMiddleware) authenticated = true;
        if (Array.isArray(layer.handle.permissions)) guarded = true;
        continue;
      }
      const handles = layer.route.stack.map((entry) => entry.handle);
      routes.push({
        route: `#${index} ${Object.keys(layer.route.methods).join(",").toUpperCase()} ${layer.route.path}`,
        authenticated: authenticated || handles.includes(authMiddleware as Handler),
        guarded: guarded || handles.some((handle) => Array.isArray(handle.permissions)),
      });
    }
  });
  return routes;
}

describe("cobertura de permisos en rutas", () => {
  let routes: RouteInfo[] = [];

  // Solo importa la forma de los routers, no los controllers: cada resolve devuelve un
  // objeto cuyos métodos son funciones vacías, sin base de datos ni Redis.
  beforeAll(() => {
    const stub = new Proxy({}, { get: () => () => undefined });
    vi.spyOn(container, "resolve").mockImplementation(() => stub);
    const app = express();
    registerRoutes(app);
    routes = collectRoutes(app);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("ninguna ruta autenticada queda sin permiso declarado", () => {
    const unguarded = routes
      .filter((route) => route.authenticated && !route.guarded)
      .map((route) => route.route);
    expect(unguarded).toEqual([]);
  });

  it("el recorrido encuentra las rutas montadas", () => {
    expect(routes.filter((route) => route.authenticated).length).toBeGreaterThan(130);
  });
});
