export const OPERATION_LINKS = {
  openRepairNotes: { path: "/commerce/repair-notes?status=open", permissions: ["repair-notes.read", "repair-notes.read.own"] },
  criticalStockItems: { path: "/commerce/inventory?stock=critical", permissions: ["inventory.read", "inventory.lookup"] },
  openCashSessions: { path: "/commerce/cash", permissions: ["cash.read"] },
  pendingCredit: { path: "/commerce/customers?credit=pending", permissions: ["customers.read"] },
  onlineUsers: { path: "/identity/users?filter=online", permissions: ["users.read"] },
} as const;
