import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authenticatedOnly, requirePermission } from "../../authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";
import { publicIdResponses } from "../../../core/http/public-id/public-id-response.js";
import { resolvePublicIdParam } from "../../../core/http/public-id/public-id-request.js";
import {
  loginRateLimit,
  refreshRateLimit,
  registerRateLimit,
  resendVerificationRateLimit,
} from "../../../core/http/rate-limit.js";

export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  // login y registro no pasan por tenantMiddleware, que es quien traduce las respuestas.
  router.use(publicIdResponses);
  router.post("/register", registerRateLimit, authController.register);
  router.post("/login", loginRateLimit, authController.login);
  router.post("/refresh", refreshRateLimit, authController.refresh);
  router.post("/logout", authController.logout);
  // Público: se abre desde el correo, no siempre con la misma sesión que
  // registró (otro navegador/dispositivo) -- el tenant se resuelve del token.
  router.post("/verify-email", authController.verifyEmail);
  router.post(
    "/resend-verification",
    authMiddleware,
    tenantMiddleware,
    authenticatedOnly,
    resendVerificationRateLimit,
    authController.resendVerificationEmail,
  );
  router.get(
    "/users/me",
    authMiddleware,
    tenantMiddleware,
    authenticatedOnly,
    authController.getMe,
  );
  router.get(
    "/users",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.read"),
    authController.getUsers,
  );
  router.get(
    "/roles",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.read"),
    authController.listRoles,
  );
  router.patch(
    "/users/:id/toggle-status",
    authMiddleware,
    tenantMiddleware,
    resolvePublicIdParam("usuarios"),
    requirePermission("users.manage"),
    authController.toggleUserStatus,
  );
  router.patch(
    "/users/:id",
    authMiddleware,
    tenantMiddleware,
    resolvePublicIdParam("usuarios"),
    requirePermission("users.manage"),
    authController.updateEmployee,
  );
  router.get(
    "/employees",
    authMiddleware,
    tenantMiddleware,
    requirePermission("staff.list"),
    authController.listEmployees,
  );
  router.post(
    "/employees",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.manage"),
    authController.createEmployee,
  );

  return router;
};
