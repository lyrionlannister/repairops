import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useLocal } from "@app-platform/local/hooks/use-local";
import { useBranch } from "@common/hooks/use-branch";
import { useCurrentUser } from "@common/hooks/use-current-user";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { useCash } from "./use-cash";
import { useCashPage } from "./use-cash-page";
import { useCashInsights } from "./use-cash-insights";
import { useCashCuts } from "./use-cash-cuts";
import type { CashMovementType } from "../types/cash";

// Sin branchId usa la sucursal de trabajo; con uno, la caja de esa sucursal (vista del owner).
export const useCashScreen = (branchIdOverride?: string) => {
  const { local, fetchLocal } = useLocal();
  const { branches, workingBranchId } = useBranch();
  const branchId = branchIdOverride ?? workingBranchId;
  const currentUser = useCurrentUser();
  const cash = useCash();
  const page = useCashPage({ local, branchId, fetchLocal, ...cash });
  const insights = useCashInsights(cash.session, cash.movements, cash.summary);
  const cuts = useCashCuts(branchId, cash.closedSession?.id ?? null);
  const navigate = useNavigate();
  const pagination = usePaginatedList(insights.rows);

  const suggestedBalance = cuts.lastCut?.closingBalance ?? null;
  const { setOpeningBalance } = page;
  useEffect(() => {
    if (suggestedBalance !== null) setOpeningBalance(suggestedBalance);
  }, [suggestedBalance, setOpeningBalance]);

  const openMovement = (type: CashMovementType) => {
    page.setMovementForm((prev) => ({ ...prev, type }));
    page.setIsMovementOpen(true);
  };

  return {
    ...page,
    session: cash.session,
    summary: cash.summary,
    loading: cash.loading,
    saving: cash.saving,
    justClosed: Boolean(cash.closedSession),
    dismissClosed: cash.clearClosedSession,
    branchName: branches.find((branch) => branch.id === branchId)?.name ?? "—",
    openerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "—",
    suggestedBalance,
    insights,
    cuts,
    openCut: (id: string) => navigate(`/commerce/cash/cuts/${id}/print`),
    pagination,
    openIncome: () => openMovement("income"),
    openExpense: () => openMovement("expense"),
    local,
  };
};
