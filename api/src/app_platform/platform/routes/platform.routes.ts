import { Router } from "express";
import { PlatformController } from "../controllers/platform.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePlatformPermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

// Gestión de tenants por el platform-admin: es el alta de talleres cuando
// REGISTRATION_MODE es `closed`, y las invitaciones cuando es `invite`.
export const createPlatformRouter = (controller: PlatformController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.post(
    "/tenants",
    requirePlatformPermission("platform.tenants.manage"),
    controller.createTenant,
  );
  router.post(
    "/invitations",
    requirePlatformPermission("platform.tenants.manage"),
    controller.createInvitation,
  );
  router.get(
    "/invitations",
    requirePlatformPermission("platform.tenants.read"),
    controller.listInvitations,
  );
  return router;
};
