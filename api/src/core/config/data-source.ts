import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";
import { User } from "../../identity/auth/entities/user.entity.js";
import { ExcludedPhone } from "../../messaging/whatsapp-admin/entities/excluded-phone.entity.js";
import { WhatsappSettings } from "../../messaging/whatsapp-admin/entities/whatsapp-settings.entity.js";
import { ContactName } from "../../messaging/chats/entities/contact-name.entity.js";
import { ChatMessage } from "../../messaging/chats/entities/chat-message.entity.js";
import { ChatDailyStat } from "../../messaging/chats/entities/chat-daily-stat.entity.js";
import { ChatDailyContact } from "../../messaging/chats/entities/chat-daily-contact.entity.js";
import { Local } from "../../app_platform/local/entities/local.entity.js";
import { RepairNote } from "../../commerce/repair-notes/entities/repair-note.entity.js";
import { MessageTemplate } from "../../messaging/message-templates/entities/message-template.entity.js";
import { PriceListItem } from "../../commerce/price-list/entities/price-list-item.entity.js";
import { Supplier } from "../../commerce/suppliers/entities/supplier.entity.js";
import { Notification } from "../../messaging/notifications/entities/notification.entity.js";
import { Tenant } from "../tenancy/entities/tenant.entity.js";
import { RepairNoteItem } from "../../commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteDevice } from "../../commerce/repair-notes/entities/repair-note-device.entity.js";
import { RepairNoteServiceType } from "../../commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { ServiceType } from "../../commerce/service-types/entities/service-type.entity.js";
import { InventoryItem } from "../../commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../commerce/inventory/entities/inventory-movement.entity.js";
import { Sale } from "../../commerce/inventory/entities/sale.entity.js";
import { SaleItem } from "../../commerce/inventory/entities/sale-item.entity.js";
import { SalePayment } from "../../commerce/payments/entities/sale-payment.entity.js";
import { Quote } from "../../commerce/quotes/entities/quote.entity.js";
import { QuoteItem } from "../../commerce/quotes/entities/quote-item.entity.js";
import { QuoteServiceType } from "../../commerce/quotes/entities/quote-service-type.entity.js";
import { RepairNotePayment } from "../../commerce/repair-notes/entities/repair-note-payment.entity.js";
import { CashSession } from "../../commerce/cash/entities/cash-session.entity.js";
import { CashMovement } from "../../commerce/cash/entities/cash-movement.entity.js";
import { RevenueAttributionSetting } from "../../commerce/revenue-attribution/entities/revenue-attribution-setting.entity.js";
import { Branch } from "../../identity/branches/entities/branch.entity.js";
import { UserBranch } from "../../identity/branches/entities/user-branch.entity.js";
import { Customer } from "../../commerce/customers/entities/customer.entity.js";
import { WhatsappAccount } from "../../messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { WhatsappTemplateStatus } from "../../messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import { WhatsappOutboundMessage } from "../../messaging/whatsapp-official/entities/whatsapp-outbound-message.entity.js";
import { WhatsappTemplateCatalogEntry } from "../../messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
import { WhatsappPendingNotification } from "../../messaging/whatsapp-official/entities/whatsapp-pending-notification.entity.js";
import { Return } from "../../commerce/returns/entities/return.entity.js";
import { ReturnItem } from "../../commerce/returns/entities/return-item.entity.js";
import { InventoryTransfer } from "../../commerce/inventory/entities/inventory-transfer.entity.js";
import { InventoryCount } from "../../commerce/inventory/entities/inventory-count.entity.js";
import { InventoryCountItem } from "../../commerce/inventory/entities/inventory-count-item.entity.js";
import { InventoryReservation } from "../../commerce/inventory/entities/inventory-reservation.entity.js";
import { Layaway } from "../../commerce/customers/entities/layaway.entity.js";
import { LayawayItem } from "../../commerce/customers/entities/layaway-item.entity.js";
import { CustomerPayment } from "../../commerce/customers/entities/customer-payment.entity.js";
import { Plan } from "../../app_platform/billing/entities/plan.entity.js";
import { Subscription } from "../../app_platform/billing/entities/subscription.entity.js";
import { UserRoleAssignment } from "../../identity/auth/entities/user-role.entity.js";
import { BranchDiscountCap } from "../../identity/branches/entities/branch-discount-cap.entity.js";
import { StripePrice } from "../../app_platform/billing/entities/stripe-price.entity.js";
import { StripeInvoicePayment } from "../../app_platform/billing/entities/stripe-invoice-payment.entity.js";
import { StripeWebhookEvent } from "../../app_platform/billing/entities/stripe-webhook-event.entity.js";
import { WhatsappMessagePackage } from "../../messaging/whatsapp-official/entities/whatsapp-message-package.entity.js";
import { WhatsappMetaPricing } from "../../messaging/whatsapp-official/entities/whatsapp-meta-pricing.entity.js";
import { AuditLog } from "../../core/audit/entities/audit-log.entity.js";
import { RefreshToken } from "../../identity/auth/entities/refresh-token.entity.js";
import { TenantInvitation } from "../../identity/auth/entities/tenant-invitation.entity.js";
import { EmailVerificationToken } from "../../identity/auth/entities/email-verification-token.entity.js";
import { optionalEnv, optionalEnvNumber } from "./env.js";

// Opciones compartidas por el DataSource de la app/tests (sin `migrations`, para que
// TypeORM no intente cargar los archivos de migración en cada `initialize()`) y por el
// DataSource del CLI de migraciones (migration-data-source.ts), que sí las necesita.
export const appDataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: optionalEnv("DB_HOST", "localhost"),
  port: optionalEnvNumber("DB_PORT", 5432),
  username: optionalEnv("DB_USERNAME", "n8n"),
  password: optionalEnv("DB_PASSWORD", "n8n_password_dev"),
  database: optionalEnv("DB_NAME", "app_db"),
  synchronize: false,
  migrationsTableName: "migrations",
  logging: optionalEnv("NODE_ENV", "production") === "development",
  entities: [
    Tenant,
    User,
    ExcludedPhone,
    WhatsappSettings,
    ContactName,
    ChatMessage,
    ChatDailyStat,
    ChatDailyContact,
    Local,
    RepairNote,
    RepairNoteItem,
    RepairNoteDevice,
    RepairNoteServiceType,
    ServiceType,
    MessageTemplate,
    PriceListItem,
    Supplier,
    Notification,
    InventoryItem,
    InventoryMovement,
    Sale,
    SaleItem,
    SalePayment,
    Quote,
    QuoteItem,
    QuoteServiceType,
    RepairNotePayment,
    CashSession,
    CashMovement,
    RevenueAttributionSetting,
    Branch,
    UserBranch,
    Customer,
    WhatsappAccount,
    WhatsappTemplateStatus,
    WhatsappOutboundMessage,
    WhatsappTemplateCatalogEntry,
    WhatsappPendingNotification,
    Return,
    ReturnItem,
    InventoryTransfer,
    InventoryCount,
    InventoryCountItem,
    InventoryReservation,
    Layaway,
    LayawayItem,
    CustomerPayment,
    Plan,
    Subscription,
    UserRoleAssignment,
    BranchDiscountCap,
    StripePrice,
    StripeInvoicePayment,
    StripeWebhookEvent,
    WhatsappMessagePackage,
    WhatsappMetaPricing,
    AuditLog,
    RefreshToken,
    TenantInvitation,
    EmailVerificationToken,
  ],
};

const AppDataSource = new DataSource(appDataSourceOptions);

export default AppDataSource;
