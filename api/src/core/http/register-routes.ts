import { container } from "tsyringe";
import type { Express } from "express";

import { AuthController } from "../../identity/auth/controllers/auth.controller.js";
import { createAuthRouter } from "../../identity/auth/routes/auth.routes.js";
import { createAutomationAdminRouter } from "../../app_platform/automation/routes/automation-admin.routes.js";
import { AutomationAdminController } from "../../app_platform/automation/controllers/automation-admin.controller.js";
import { createN8nIntegrationRouter } from "../../app_platform/integrations/routes/n8n-integration.routes.js";
import { N8nIntegrationController } from "../../app_platform/integrations/controllers/n8n-integration.controller.js";
import { BillingController } from "../../app_platform/billing/controllers/billing.controller.js";
import {
  createBillingRouter,
  createPlatformBillingRouter,
} from "../../app_platform/billing/routes/billing.routes.js";
import { BillingWebhookController } from "../../app_platform/billing/controllers/billing-webhook.controller.js";
import { createBillingWebhookRouter } from "../../app_platform/billing/routes/billing-webhook.routes.js";
import { ChatsController } from "../../messaging/chats/controllers/chats.controller.js";
import { createChatsRouter } from "../../messaging/chats/routes/chats.routes.js";
import { LocalController } from "../../app_platform/local/controllers/local.controller.js";
import { createLocalRouter } from "../../app_platform/local/routes/local.routes.js";
import { WhatsappAccountController } from "../../messaging/whatsapp-official/controllers/whatsapp-account.controller.js";
import { createWhatsappAccountRouter } from "../../messaging/whatsapp-official/routes/whatsapp-account.routes.js";
import { WhatsappWebhookController } from "../../messaging/whatsapp-official/controllers/whatsapp-webhook.controller.js";
import { createWhatsappWebhookRouter } from "../../messaging/whatsapp-official/routes/whatsapp-webhook.routes.js";
import { WhatsappTemplateCatalogController } from "../../messaging/whatsapp-official/controllers/whatsapp-template-catalog.controller.js";
import { createWhatsappTemplateCatalogRouter } from "../../messaging/whatsapp-official/routes/whatsapp-template-catalog.routes.js";
import { RepairNoteController } from "../../commerce/repair-notes/controllers/repair-note.controller.js";
import { createRepairNoteRouter } from "../../commerce/repair-notes/routes/repair-note.routes.js";
import { MessageTemplateController } from "../../messaging/message-templates/controllers/message-template.controller.js";
import { createMessageTemplateRouter } from "../../messaging/message-templates/routes/message-template.routes.js";
import { PriceListController } from "../../commerce/price-list/controllers/price-list.controller.js";
import { PriceListDao } from "../../commerce/price-list/daos/price-list.dao.js";
import { createPriceListRouter } from "../../commerce/price-list/routes/price-list.routes.js";
import { MessageTemplateDao } from "../../messaging/message-templates/daos/message-template.dao.js";
import { SupplierController } from "../../commerce/suppliers/controllers/supplier.controller.js";
import { createSupplierRouter } from "../../commerce/suppliers/routes/supplier.routes.js";
import { NotificationController } from "../../messaging/notifications/controllers/notification.controller.js";
import { createNotificationRouter } from "../../messaging/notifications/routes/notification.routes.js";
import { ServiceTypeController } from "../../commerce/service-types/controllers/service-type.controller.js";
import { createServiceTypeRouter } from "../../commerce/service-types/routes/service-type.routes.js";
import { InventoryController } from "../../commerce/inventory/controllers/inventory.controller.js";
import { createInventoryRouter } from "../../commerce/inventory/routes/inventory.routes.js";
import { InventoryTransferController } from "../../commerce/inventory/controllers/inventory-transfer.controller.js";
import { createInventoryTransferRouter } from "../../commerce/inventory/routes/inventory-transfer.routes.js";
import { InventoryCountController } from "../../commerce/inventory/controllers/inventory-count.controller.js";
import { createInventoryCountRouter } from "../../commerce/inventory/routes/inventory-count.routes.js";
import { SaleController } from "../../commerce/inventory/controllers/sale.controller.js";
import { createSaleRouter } from "../../commerce/inventory/routes/sale.routes.js";
import { createN8nPublicRouter } from "../../messaging/n8n/n8n-public.routes.js";
import { RepairNoteDao } from "../../commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNoteDeviceDao } from "../../commerce/repair-notes/daos/repair-note-device.dao.js";
import { ImportStagingController } from "../../app_platform/import-staging/controllers/import-staging.controller.js";
import { createImportStagingRouter } from "../../app_platform/import-staging/routes/import-staging.routes.js";
import { QuoteController } from "../../commerce/quotes/controllers/quote.controller.js";
import { createQuoteRouter } from "../../commerce/quotes/routes/quote.routes.js";
import { CashController } from "../../commerce/cash/controllers/cash.controller.js";
import { createCashRouter } from "../../commerce/cash/routes/cash.routes.js";
import { RevenueAttributionController } from "../../commerce/revenue-attribution/controllers/revenue-attribution.controller.js";
import { createRevenueAttributionRouter } from "../../commerce/revenue-attribution/routes/revenue-attribution.routes.js";
import { ReportsController } from "../../reporting/reports/controllers/reports.controller.js";
import { createDashboardRouter } from "../../reporting/dashboard/routes/dashboard.routes.js";
import { DashboardController } from "../../reporting/dashboard/controllers/dashboard.controller.js";
import { createReportsRouter } from "../../reporting/reports/routes/reports.routes.js";
import { BranchController } from "../../identity/branches/controllers/branch.controller.js";
import { createBranchRouter } from "../../identity/branches/routes/branch.routes.js";
import { CustomerController } from "../../commerce/customers/controllers/customer.controller.js";
import { createCustomerRouter } from "../../commerce/customers/routes/customer.routes.js";
import { ReturnController } from "../../commerce/returns/controllers/return.controller.js";
import { createReturnRouter } from "../../commerce/returns/routes/return.routes.js";
import { LayawayController } from "../../commerce/customers/controllers/layaway.controller.js";
import { createLayawayRouter } from "../../commerce/customers/routes/layaway.routes.js";
import { PlatformController } from "../../app_platform/platform/controllers/platform.controller.js";
import { createPlatformRouter } from "../../app_platform/platform/routes/platform.routes.js";

// Monta todas las rutas de /api/v1/* -- requiere que registerRepositories()
// ya haya corrido (cada controller/dao se resuelve del contenedor aqui).
export function registerRoutes(app: Express): void {
  app.use("/api/v1/auth", createAuthRouter(container.resolve(AuthController)));
  app.use(
    "/api/v1/automation",
    createAutomationAdminRouter(container.resolve(AutomationAdminController)),
  );
  app.use(
    "/api/v1/integrations/n8n",
    createN8nIntegrationRouter(container.resolve(N8nIntegrationController)),
  );
  // El router del webhook (publico, sin JWT) va ANTES que el protegido, mismo
  // prefijo -- mismo motivo que el webhook de WhatsApp (ver comentario abajo).
  app.use(
    "/api/v1/billing",
    createBillingWebhookRouter(container.resolve(BillingWebhookController)),
  );
  app.use("/api/v1/billing", createBillingRouter(container.resolve(BillingController)));
  app.use("/api/v1/platform", createPlatformBillingRouter(container.resolve(BillingController)));
  app.use("/api/v1/platform", createPlatformRouter(container.resolve(PlatformController)));
  app.use("/api/v1/chats", createChatsRouter(container.resolve(ChatsController)));
  app.use("/api/v1/local", createLocalRouter(container.resolve(LocalController)));
  // El router del webhook (publico, sin JWT) va ANTES que el de status/
  // templates (protegido): Express prueba los routers montados en el mismo
  // prefijo en orden, y el router protegido corre su authMiddleware para
  // CUALQUIER path que le llegue (incluido /webhook) antes de intentar
  // matchear una ruta -- si fuera primero, el webhook de Meta (sin JWT)
  // siempre recibiria 401 antes de llegar a su propio router.
  app.use(
    "/api/v1/whatsapp-official",
    createWhatsappWebhookRouter(container.resolve(WhatsappWebhookController)),
  );
  app.use(
    "/api/v1/whatsapp-official",
    createWhatsappAccountRouter(container.resolve(WhatsappAccountController)),
  );
  app.use(
    "/api/v1/whatsapp-official/catalog",
    createWhatsappTemplateCatalogRouter(container.resolve(WhatsappTemplateCatalogController)),
  );
  app.use("/api/v1/repair-notes", createRepairNoteRouter(container.resolve(RepairNoteController)));
  app.use(
    "/api/v1/message-templates",
    createMessageTemplateRouter(container.resolve(MessageTemplateController)),
  );
  app.use("/api/v1/suppliers", createSupplierRouter(container.resolve(SupplierController)));
  app.use("/api/v1/price-list", createPriceListRouter(container.resolve(PriceListController)));
  app.use(
    "/api/v1/import-staging",
    createImportStagingRouter(container.resolve(ImportStagingController)),
  );
  app.use(
    "/api/v1/notifications",
    createNotificationRouter(container.resolve(NotificationController)),
  );
  // Montado ANTES de "/api/v1/inventory": ese router tiene "/:id" (GET), que
  // matchearía "transfers" como id si este fuera segundo -- mismo criterio
  // de orden que el webhook de WhatsApp vs su router protegido.
  app.use(
    "/api/v1/inventory/transfers",
    createInventoryTransferRouter(container.resolve(InventoryTransferController)),
  );
  app.use(
    "/api/v1/inventory/counts",
    createInventoryCountRouter(container.resolve(InventoryCountController)),
  );
  app.use("/api/v1/inventory", createInventoryRouter(container.resolve(InventoryController)));
  app.use("/api/v1/sales", createSaleRouter(container.resolve(SaleController)));
  app.use("/api/v1/quotes", createQuoteRouter(container.resolve(QuoteController)));
  app.use("/api/v1/cash", createCashRouter(container.resolve(CashController)));
  app.use(
    "/api/v1/settings",
    createRevenueAttributionRouter(container.resolve(RevenueAttributionController)),
  );
  app.use("/api/v1/dashboard", createDashboardRouter(container.resolve(DashboardController)));
  app.use("/api/v1/reports", createReportsRouter(container.resolve(ReportsController)));
  app.use(
    "/api/v1/service-types",
    createServiceTypeRouter(container.resolve(ServiceTypeController)),
  );
  app.use("/api/v1/branches", createBranchRouter(container.resolve(BranchController)));
  app.use("/api/v1/customers", createCustomerRouter(container.resolve(CustomerController)));
  app.use("/api/v1/returns", createReturnRouter(container.resolve(ReturnController)));
  app.use("/api/v1/layaways", createLayawayRouter(container.resolve(LayawayController)));
  app.use(
    "/api/v1/n8n",
    createN8nPublicRouter(
      container.resolve(MessageTemplateDao),
      container.resolve(PriceListDao),
      container.resolve(RepairNoteDao),
      container.resolve(RepairNoteDeviceDao),
    ),
  );
}
