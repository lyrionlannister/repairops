import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authenticatedOnly, requirePermission } from "../../authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/logout", authController.logout);
  router.get("/users/me", authMiddleware, tenantMiddleware, authenticatedOnly, authController.getMe);
  router.get(
    "/users",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.read"),
    authController.getUsers,
  );
  router.patch(
    "/users/:id/toggle-status",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.manage"),
    authController.toggleUserStatus,
  );
  router.patch(
    "/users/:id",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.manage"),
    authController.updateEmployee,
  );
  router.get("/employees", authMiddleware, tenantMiddleware, requirePermission("staff.list"), authController.listEmployees);
  router.post(
    "/employees",
    authMiddleware,
    tenantMiddleware,
    requirePermission("users.manage"),
    authController.createEmployee,
  );

  return router;
};
