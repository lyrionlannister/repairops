import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";
import { User } from "../../identity/auth/entities/user.entity.js";
import { ExcludedPhone } from "../../messaging/whatsapp-admin/entities/excluded-phone.entity.js";
import { WhatsappSettings } from "../../messaging/whatsapp-admin/entities/whatsapp-settings.entity.js";
import { ContactName } from "../../messaging/chats/entities/contact-name.entity.js";
import { Local } from "../../app_platform/local/entities/local.entity.js";
import { RepairNote } from "../../commerce/repair-notes/entities/repair-note.entity.js";
import { MessageTemplate } from "../../messaging/message-templates/entities/message-template.entity.js";
import { PriceListItem } from "../../commerce/price-list/entities/price-list-item.entity.js";
import { Supplier } from "../../commerce/suppliers/entities/supplier.entity.js";
import { Notification } from "../../messaging/notifications/entities/notification.entity.js";
import { Tenant } from "../tenancy/entities/tenant.entity.js";
import { RepairNoteItem } from "../../commerce/repair-notes/entities/repair-note-item.entity.js";
import { RepairNoteServiceType } from "../../commerce/repair-notes/entities/repair-note-service-type.entity.js";
import { ServiceType } from "../../commerce/service-types/entities/service-type.entity.js";
import { InventoryItem } from "../../commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../commerce/inventory/entities/inventory-movement.entity.js";
import { Sale } from "../../commerce/inventory/entities/sale.entity.js";
import { SaleItem } from "../../commerce/inventory/entities/sale-item.entity.js";
import { SalePayment } from "../../commerce/payments/entities/sale-payment.entity.js";
import { Quote } from "../../commerce/quotes/entities/quote.entity.js";
import { QuoteItem } from "../../commerce/quotes/entities/quote-item.entity.js";
import { CashSession } from "../../commerce/cash/entities/cash-session.entity.js";
import { CashMovement } from "../../commerce/cash/entities/cash-movement.entity.js";
import { RevenueAttributionSetting } from "../../commerce/revenue-attribution/entities/revenue-attribution-setting.entity.js";
import { Branch } from "../../identity/branches/entities/branch.entity.js";
import { Customer } from "../../commerce/customers/entities/customer.entity.js";
import { WhatsappAccount } from "../../messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { WhatsappTemplateStatus } from "../../messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import { WhatsappOutboundMessage } from "../../messaging/whatsapp-official/entities/whatsapp-outbound-message.entity.js";
import { WhatsappTemplateCatalogEntry } from "../../messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
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
    Local,
    RepairNote,
    RepairNoteItem,
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
    CashSession,
    CashMovement,
    RevenueAttributionSetting,
    Branch,
    Customer,
    WhatsappAccount,
    WhatsappTemplateStatus,
    WhatsappOutboundMessage,
    WhatsappTemplateCatalogEntry,
  ],
};

const AppDataSource = new DataSource(appDataSourceOptions);

export default AppDataSource;
