import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/logout", authController.logout);
  router.get("/users/me", authMiddleware, tenantMiddleware, authController.getMe);
  router.get(
    "/users",
    authMiddleware,
    tenantMiddleware,
    requireRole("owner"),
    authController.getUsers,
  );
  router.patch(
    "/users/:id/toggle-status",
    authMiddleware,
    tenantMiddleware,
    requireRole("owner"),
    authController.toggleUserStatus,
  );
  router.patch(
    "/users/:id",
    authMiddleware,
    tenantMiddleware,
    requireRole("owner"),
    authController.updateEmployee,
  );
  router.get("/employees", authMiddleware, tenantMiddleware, authController.listEmployees);
  router.post(
    "/employees",
    authMiddleware,
    tenantMiddleware,
    requireRole("owner"),
    authController.createEmployee,
  );

  return router;
};
