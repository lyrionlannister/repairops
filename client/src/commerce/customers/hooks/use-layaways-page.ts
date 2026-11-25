import { useEffect, useState } from "react";
import { useBranch } from "@common/hooks/use-branch";
import { useBranchFilter } from "@common/hooks/use-branch-query";
import { useServerList } from "@common/hooks/use-server-list";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useLayaways } from "./use-layaways";
import type { LayawayMethod, LayawayRecord, LayawayStatusFilter } from "../types/layaways";

export const useLayawaysPage = () => {
  const { saving, complete, cancel } = useLayaways();
  const { workingBranchId } = useBranch();
  const branchId = useBranchFilter();
  const { session: cashSession, fetchOpenSession } = useCash();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LayawayStatusFilter>("all");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeAmount, setCompleteAmount] = useState("");
  const [completeMethod, setCompleteMethod] = useState<LayawayMethod>("efectivo");
  const [noCashError, setNoCashError] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const list = useServerList<LayawayRecord>("/layaways", {
    search,
    filters: { branchId, status: statusFilter === "all" ? undefined : statusFilter },
    errorText: "No pudimos cargar los apartados.",
  });

  useEffect(() => {
    if (workingBranchId) fetchOpenSession(workingBranchId);
  }, [workingBranchId, fetchOpenSession]);

  const openCompleteModal = (layaway: LayawayRecord) => {
    setCompletingId(layaway.id);
    setCompleteAmount((Number(layaway.totalValue) - Number(layaway.depositAmount)).toFixed(2));
    setCompleteMethod("efectivo");
  };

  const handleComplete = async () => {
    if (!completingId) return;
    if (!cashSession) {
      setCompletingId(null);
      setNoCashError(true);
      return;
    }
    setNoCashError(false);
    const ok = await complete(completingId, cashSession.id, [
      { method: completeMethod, amount: Number(completeAmount) || 0 },
    ]);
    setCompletingId(null);
    if (ok) await list.refetch();
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    const ok = await cancel(cancelId);
    setCancelId(null);
    if (ok) await list.refetch();
  };

  return {
    list,
    saving,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    hasFilters: list.hasSearch || statusFilter !== "all",
    completingId,
    setCompletingId,
    completeAmount,
    setCompleteAmount,
    completeMethod,
    setCompleteMethod,
    noCashError,
    cancelId,
    setCancelId,
    openCompleteModal,
    handleComplete,
    handleCancel,
  };
};
