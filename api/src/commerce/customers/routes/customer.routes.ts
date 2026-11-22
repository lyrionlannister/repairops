import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";
import { authMiddleware } from "../../../identity/auth/middlewares/auth.middleware.js";
import { requirePermission } from "../../../identity/authz/require-permission.middleware.js";
import { tenantMiddleware } from "../../../core/tenancy/tenant.middleware.js";

export const createCustomerRouter = (controller: CustomerController): Router => {
  const router = Router();
  router.use(authMiddleware, tenantMiddleware);
  router.get("/", requirePermission("customers.read", "customers.read.own"), controller.getAll);
  router.get("/:id", requirePermission("customers.read", "customers.read.own"), controller.getById);
  router.get("/:id/devices", requirePermission("customers.read", "customers.read.own"), controller.getDevices);
  router.get("/:id/credit-balance", requirePermission("customers.read", "customers.read.own"), controller.getCreditBalance);
  router.get("/:id/debts", requirePermission("customers.read", "customers.read.own"), controller.getDebts);
  router.get("/:id/payments", requirePermission("customers.read", "customers.read.own"), controller.getPayments);
  router.post("/:id/payments", requirePermission("customer-payments.register"), controller.registerPayment);
  router.post("/", requirePermission("customers.write"), controller.create);
  router.patch("/:id", requirePermission("customers.write"), controller.update);
  router.delete("/:id", requirePermission("customers.delete"), controller.delete);
  return router;
};
