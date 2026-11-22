import { ChatsPage } from "../messaging/chats/pages/chats-page";
import { AuthPage } from "../identity/auth/pages/auth-page";
import { RegisterPage } from "../identity/auth/pages/register-page";
import { NotFound } from "../core/common/pages/not-found";
import { HomePage } from "../home/pages/home-page";
import { UsersPage } from "../identity/users/pages/users-page";
import { UserFormPage } from "../identity/users/pages/user-form-page";
import { LocalPage } from "../app_platform/local/pages/local-page";
import { TenantsPage } from "../app_platform/billing/pages/tenants-page";
import { TenantSubscriptionPage } from "../app_platform/billing/pages/tenant-subscription-page";
import { ProfilePage } from "../identity/auth/pages/profile-page";
import { RepairNotesPage } from "../commerce/repair-notes/pages/repair-notes-page";
import { RepairNoteFormPage } from "../commerce/repair-notes/pages/repair-note-form-page";
import { RepairNotePrintPage } from "../commerce/repair-notes/pages/repair-note-print-page";
import { RepairNoteDetailPage } from "../commerce/repair-notes/pages/repair-note-detail-page";
import { MessageTemplatesPage } from "../messaging/message-templates/pages/message-templates-page";
import { MessageTemplateFormPage } from "../messaging/message-templates/pages/message-template-form-page";
import { WhatsappOfficialPage } from "../messaging/whatsapp-official/pages/whatsapp-official-page";
import { PriceListPage } from "../commerce/price-list/pages/price-list-page";
import { PriceListItemFormPage } from "../commerce/price-list/pages/price-list-item-form-page";
import { ImportPriceListPage } from "../commerce/price-list/pages/import-price-list-page";
import { InventoryPage } from "../commerce/inventory/pages/inventory-page";
import { InventoryItemFormPage } from "../commerce/inventory/pages/inventory-item-form-page";
import { QuickSalePage } from "../commerce/inventory/pages/quick-sale-page";
import { SalesPage } from "../commerce/inventory/pages/sales-page";
import { ReturnPage } from "../commerce/returns/pages/return-page";
import { InventoryTransfersPage } from "../commerce/inventory/pages/inventory-transfers-page";
import { InventoryCountPage } from "../commerce/inventory/pages/inventory-count-page";
import { LayawaysPage } from "../commerce/customers/pages/layaways-page";
import { LayawayFormPage } from "../commerce/customers/pages/layaway-form-page";
import { QuotesPage } from "../commerce/quotes/pages/quotes-page";
import { QuoteFormPage } from "../commerce/quotes/pages/quote-form-page";
import { QuotePrintPage } from "../commerce/quotes/pages/quote-print-page";
import { CashPage } from "../commerce/cash/pages/cash-page";
import { CashCutPrintPage } from "../commerce/cash/pages/cash-cut-print-page";
import { SuppliersPage } from "../commerce/suppliers/pages/suppliers-page";
import { SupplierFormPage } from "../commerce/suppliers/pages/supplier-form-page";
import { BranchesPage } from "../identity/branches/pages/branches-page";
import { BranchFormPage } from "../identity/branches/pages/branch-form-page";
import { CustomersPage } from "../commerce/customers/pages/customers-page";
import { ReportsPage } from "../reporting/reports/pages/reports-page";
import { CustomerFormPage } from "../commerce/customers/pages/customer-form-page";
import { CustomerDetailPage } from "../commerce/customers/pages/customer-detail-page";

export const publicRoutes = [
  {
    path: "/identity/sign-in",
    element: <AuthPage />,
  },
  {
    path: "/identity/sign-up",
    element: <RegisterPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const protectedRoutes = [
  {
    path: "/home",
    element: <HomePage />,
  },
  {
    path: "/messaging/chats",
    element: <ChatsPage />,
  },
  {
    path: "/identity/users",
    element: <UsersPage />,
  },
  {
    path: "/identity/users/new",
    element: <UserFormPage />,
  },
  {
    path: "/identity/users/:id/edit",
    element: <UserFormPage />,
  },
  {
    path: "/platform/local",
    element: <LocalPage />,
  },
  {
    path: "/platform/tenants",
    element: <TenantsPage />,
  },
  {
    path: "/platform/tenants/:tenantId/edit",
    element: <TenantSubscriptionPage />,
  },
  {
    path: "/identity/profile",
    element: <ProfilePage />,
  },
  {
    path: "/commerce/repair-notes",
    element: <RepairNotesPage />,
  },
  {
    path: "/commerce/repair-notes/new",
    element: <RepairNoteFormPage />,
  },
  {
    path: "/commerce/repair-notes/:id",
    element: <RepairNoteDetailPage />,
  },
  {
    path: "/commerce/repair-notes/:id/edit",
    element: <RepairNoteFormPage />,
  },
  {
    path: "/commerce/repair-notes/:id/print",
    element: <RepairNotePrintPage />,
  },
  {
    path: "/messaging/message-templates",
    element: <MessageTemplatesPage />,
  },
  {
    path: "/messaging/message-templates/new",
    element: <MessageTemplateFormPage />,
  },
  {
    path: "/messaging/message-templates/:id/edit",
    element: <MessageTemplateFormPage />,
  },
  {
    path: "/messaging/whatsapp",
    element: <WhatsappOfficialPage />,
  },
  {
    path: "/commerce/suppliers",
    element: <SuppliersPage />,
  },
  {
    path: "/commerce/suppliers/new",
    element: <SupplierFormPage />,
  },
  {
    path: "/commerce/suppliers/:id/edit",
    element: <SupplierFormPage />,
  },
  {
    path: "/identity/branches",
    element: <BranchesPage />,
  },
  {
    path: "/identity/branches/new",
    element: <BranchFormPage />,
  },
  {
    path: "/identity/branches/:id/edit",
    element: <BranchFormPage />,
  },
  {
    path: "/commerce/customers",
    element: <CustomersPage />,
  },
  {
    path: "/commerce/customers/new",
    element: <CustomerFormPage />,
  },
  {
    path: "/commerce/customers/:id",
    element: <CustomerDetailPage />,
  },
  {
    path: "/commerce/customers/:id/edit",
    element: <CustomerFormPage />,
  },
  {
    path: "/commerce/price-list",
    element: <PriceListPage />,
  },
  {
    path: "/commerce/price-list/new",
    element: <PriceListItemFormPage />,
  },
  {
    path: "/commerce/price-list/:id/edit",
    element: <PriceListItemFormPage />,
  },
  {
    path: "/commerce/price-list/import",
    element: <ImportPriceListPage />,
  },
  {
    path: "/commerce/inventory",
    element: <InventoryPage />,
  },
  {
    path: "/commerce/inventory/new",
    element: <InventoryItemFormPage />,
  },
  {
    path: "/commerce/inventory/:id/edit",
    element: <InventoryItemFormPage />,
  },
  {
    path: "/commerce/sales/new",
    element: <QuickSalePage />,
  },
  {
    path: "/commerce/sales",
    element: <SalesPage />,
  },
  {
    path: "/commerce/returns",
    element: <ReturnPage />,
  },
  {
    path: "/commerce/inventory/transfers",
    element: <InventoryTransfersPage />,
  },
  {
    path: "/commerce/inventory/counts",
    element: <InventoryCountPage />,
  },
  {
    path: "/commerce/layaways",
    element: <LayawaysPage />,
  },
  {
    path: "/commerce/layaways/new",
    element: <LayawayFormPage />,
  },
  {
    path: "/commerce/quotes",
    element: <QuotesPage />,
  },
  {
    path: "/commerce/quotes/new",
    element: <QuoteFormPage />,
  },
  {
    path: "/commerce/quotes/:id/edit",
    element: <QuoteFormPage />,
  },
  {
    path: "/commerce/quotes/:id/print",
    element: <QuotePrintPage />,
  },
  {
    path: "/commerce/cash",
    element: <CashPage />,
  },
  {
    path: "/commerce/cash/cuts/:id/print",
    element: <CashCutPrintPage />,
  },
  {
    path: "/reporting/reports",
    element: <ReportsPage />,
  },
];
