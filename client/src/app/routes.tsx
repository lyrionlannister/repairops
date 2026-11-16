import { ChatsPage } from "../messaging/chats/pages/chats-page";
import { AuthPage } from "../identity/auth/pages/auth-page";
import { RegisterPage } from "../identity/auth/pages/register-page";
import { NotFound } from "../core/common/pages/not-found";
import { DashboardPage } from "../reporting/dashboard/pages/dashboard-page";
import { UsersPage } from "../identity/users/pages/users-page";
import { UserFormPage } from "../identity/users/pages/user-form-page";
import { LocalPage } from "../app_platform/local/pages/local-page";
import { ProfilePage } from "../identity/auth/pages/profile-page";
import { RepairNotesPage } from "../commerce/repair-notes/pages/repair-notes-page";
import { RepairNoteFormPage } from "../commerce/repair-notes/pages/repair-note-form-page";
import { RepairNotePrintPage } from "../commerce/repair-notes/pages/repair-note-print-page";
import { MessageTemplatesPage } from "../messaging/message-templates/pages/message-templates-page";
import { MessageTemplateFormPage } from "../messaging/message-templates/pages/message-template-form-page";
import { WhatsappOfficialPage } from "../messaging/whatsapp-official/pages/whatsapp-official-page";
import { PriceListPage } from "../commerce/price-list/pages/price-list-page";
import { PriceListItemFormPage } from "../commerce/price-list/pages/price-list-item-form-page";
import { ImportPriceListPage } from "../commerce/price-list/pages/import-price-list-page";
import { InventoryPage } from "../commerce/inventory/pages/inventory-page";
import { InventoryItemFormPage } from "../commerce/inventory/pages/inventory-item-form-page";
import { QuickSalePage } from "../commerce/inventory/pages/quick-sale-page";
import { ReturnPage } from "../commerce/returns/pages/return-page";
import { InventoryTransfersPage } from "../commerce/inventory/pages/inventory-transfers-page";
import { InventoryCountPage } from "../commerce/inventory/pages/inventory-count-page";
import { LayawaysPage } from "../commerce/customers/pages/layaways-page";
import { LayawayFormPage } from "../commerce/customers/pages/layaway-form-page";
import { QuotesPage } from "../commerce/quotes/pages/quotes-page";
import { QuoteFormPage } from "../commerce/quotes/pages/quote-form-page";
import { QuotePrintPage } from "../commerce/quotes/pages/quote-print-page";
import { CashPage } from "../commerce/cash/pages/cash-page";
import { SuppliersPage } from "../commerce/suppliers/pages/suppliers-page";
import { SupplierFormPage } from "../commerce/suppliers/pages/supplier-form-page";
import { BranchesPage } from "../identity/branches/pages/branches-page";
import { BranchFormPage } from "../identity/branches/pages/branch-form-page";
import { CustomersPage } from "../commerce/customers/pages/customers-page";
import { CustomerFormPage } from "../commerce/customers/pages/customer-form-page";

export const publicRoutes = [
  {
    path: "/app/sign-in",
    element: <AuthPage />,
  },
  {
    path: "/owner/sign-up",
    element: <RegisterPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const protectedRoutes = [
  {
    path: "/app/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/app/chats",
    element: <ChatsPage />,
  },
  {
    path: "/app/users",
    element: <UsersPage />,
  },
  {
    path: "/app/users/new",
    element: <UserFormPage />,
  },
  {
    path: "/app/users/:id/edit",
    element: <UserFormPage />,
  },
  {
    path: "/app/local",
    element: <LocalPage />,
  },
  {
    path: "/app/profile",
    element: <ProfilePage />,
  },
  {
    path: "/app/repair-notes",
    element: <RepairNotesPage />,
  },
  {
    path: "/app/repair-notes/new",
    element: <RepairNoteFormPage />,
  },
  {
    path: "/app/repair-notes/:id/edit",
    element: <RepairNoteFormPage />,
  },
  {
    path: "/app/repair-notes/:id/print",
    element: <RepairNotePrintPage />,
  },
  {
    path: "/app/templates",
    element: <MessageTemplatesPage />,
  },
  {
    path: "/app/templates/new",
    element: <MessageTemplateFormPage />,
  },
  {
    path: "/app/templates/:id/edit",
    element: <MessageTemplateFormPage />,
  },
  {
    path: "/app/whatsapp",
    element: <WhatsappOfficialPage />,
  },
  {
    path: "/app/suppliers",
    element: <SuppliersPage />,
  },
  {
    path: "/app/suppliers/new",
    element: <SupplierFormPage />,
  },
  {
    path: "/app/suppliers/:id/edit",
    element: <SupplierFormPage />,
  },
  {
    path: "/app/branches",
    element: <BranchesPage />,
  },
  {
    path: "/app/branches/new",
    element: <BranchFormPage />,
  },
  {
    path: "/app/branches/:id/edit",
    element: <BranchFormPage />,
  },
  {
    path: "/app/customers",
    element: <CustomersPage />,
  },
  {
    path: "/app/customers/new",
    element: <CustomerFormPage />,
  },
  {
    path: "/app/customers/:id/edit",
    element: <CustomerFormPage />,
  },
  {
    path: "/app/price-list",
    element: <PriceListPage />,
  },
  {
    path: "/app/price-list/new",
    element: <PriceListItemFormPage />,
  },
  {
    path: "/app/price-list/:id/edit",
    element: <PriceListItemFormPage />,
  },
  {
    path: "/app/price-list/import",
    element: <ImportPriceListPage />,
  },
  {
    path: "/app/inventory",
    element: <InventoryPage />,
  },
  {
    path: "/app/inventory/new",
    element: <InventoryItemFormPage />,
  },
  {
    path: "/app/inventory/:id/edit",
    element: <InventoryItemFormPage />,
  },
  {
    path: "/app/sales/new",
    element: <QuickSalePage />,
  },
  {
    path: "/app/returns",
    element: <ReturnPage />,
  },
  {
    path: "/app/inventory/transfers",
    element: <InventoryTransfersPage />,
  },
  {
    path: "/app/inventory/counts",
    element: <InventoryCountPage />,
  },
  {
    path: "/app/layaways",
    element: <LayawaysPage />,
  },
  {
    path: "/app/layaways/new",
    element: <LayawayFormPage />,
  },
  {
    path: "/app/quotes",
    element: <QuotesPage />,
  },
  {
    path: "/app/quotes/new",
    element: <QuoteFormPage />,
  },
  {
    path: "/app/quotes/:id/edit",
    element: <QuoteFormPage />,
  },
  {
    path: "/app/quotes/:id/print",
    element: <QuotePrintPage />,
  },
  {
    path: "/app/cash",
    element: <CashPage />,
  },
];
