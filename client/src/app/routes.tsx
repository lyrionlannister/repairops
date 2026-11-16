import { ChatsPage } from "../messaging/chats/pages/chats-page";
import { AuthPage } from "../identity/auth/pages/auth-page";
import { RegisterPage } from "../identity/auth/pages/register-page";
import { NotFound } from "../core/common/pages/not-found";
import { DashboardPage } from "../messaging/chats/pages/dashboard-page";
import { UsersPage } from "../identity/users/pages/users-page";
import { UserFormPage } from "../identity/users/pages/user-form-page";
import { LocalPage } from "../app_platform/local/pages/local-page";
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
    path: "/admin/sign-in",
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
    path: "/admin/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/admin/chats",
    element: <ChatsPage />,
  },
  {
    path: "/admin/users",
    element: <UsersPage />,
  },
  {
    path: "/admin/users/new",
    element: <UserFormPage />,
  },
  {
    path: "/admin/users/:id/edit",
    element: <UserFormPage />,
  },
  {
    path: "/admin/local",
    element: <LocalPage />,
  },
  {
    path: "/admin/repair-notes",
    element: <RepairNotesPage />,
  },
  {
    path: "/admin/repair-notes/new",
    element: <RepairNoteFormPage />,
  },
  {
    path: "/admin/repair-notes/:id/edit",
    element: <RepairNoteFormPage />,
  },
  {
    path: "/admin/repair-notes/:id/print",
    element: <RepairNotePrintPage />,
  },
  {
    path: "/admin/templates",
    element: <MessageTemplatesPage />,
  },
  {
    path: "/admin/templates/new",
    element: <MessageTemplateFormPage />,
  },
  {
    path: "/admin/templates/:id/edit",
    element: <MessageTemplateFormPage />,
  },
  {
    path: "/admin/whatsapp",
    element: <WhatsappOfficialPage />,
  },
  {
    path: "/admin/suppliers",
    element: <SuppliersPage />,
  },
  {
    path: "/admin/suppliers/new",
    element: <SupplierFormPage />,
  },
  {
    path: "/admin/suppliers/:id/edit",
    element: <SupplierFormPage />,
  },
  {
    path: "/admin/branches",
    element: <BranchesPage />,
  },
  {
    path: "/admin/branches/new",
    element: <BranchFormPage />,
  },
  {
    path: "/admin/branches/:id/edit",
    element: <BranchFormPage />,
  },
  {
    path: "/admin/customers",
    element: <CustomersPage />,
  },
  {
    path: "/admin/customers/new",
    element: <CustomerFormPage />,
  },
  {
    path: "/admin/customers/:id/edit",
    element: <CustomerFormPage />,
  },
  {
    path: "/admin/price-list",
    element: <PriceListPage />,
  },
  {
    path: "/admin/price-list/new",
    element: <PriceListItemFormPage />,
  },
  {
    path: "/admin/price-list/:id/edit",
    element: <PriceListItemFormPage />,
  },
  {
    path: "/admin/price-list/import",
    element: <ImportPriceListPage />,
  },
  {
    path: "/admin/inventory",
    element: <InventoryPage />,
  },
  {
    path: "/admin/inventory/new",
    element: <InventoryItemFormPage />,
  },
  {
    path: "/admin/inventory/:id/edit",
    element: <InventoryItemFormPage />,
  },
  {
    path: "/admin/sales/new",
    element: <QuickSalePage />,
  },
  {
    path: "/admin/returns",
    element: <ReturnPage />,
  },
  {
    path: "/admin/inventory/transfers",
    element: <InventoryTransfersPage />,
  },
  {
    path: "/admin/inventory/counts",
    element: <InventoryCountPage />,
  },
  {
    path: "/admin/layaways",
    element: <LayawaysPage />,
  },
  {
    path: "/admin/layaways/new",
    element: <LayawayFormPage />,
  },
  {
    path: "/admin/quotes",
    element: <QuotesPage />,
  },
  {
    path: "/admin/quotes/new",
    element: <QuoteFormPage />,
  },
  {
    path: "/admin/quotes/:id/edit",
    element: <QuoteFormPage />,
  },
  {
    path: "/admin/quotes/:id/print",
    element: <QuotePrintPage />,
  },
  {
    path: "/admin/cash",
    element: <CashPage />,
  },
];
