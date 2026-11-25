import { useEffect, useState } from "react";
import { useServerList } from "@common/hooks/use-server-list";
import { useBranches } from "@identity/branches/hooks/use-branches";
import { useInventoryTransfers } from "./use-inventory-transfers";
import { useInventoryTransferLabels } from "./use-inventory-transfer-labels";
import type { InventoryItem } from "../types/inventory";
import type { InventoryTransfer } from "../types/inventory-transfers";

export const useInventoryTransfersPage = () => {
  const { branches, fetchAll: fetchBranches } = useBranches();
  const { creating, create } = useInventoryTransfers();
  const labels = useInventoryTransferLabels(branches);
  const history = useServerList<InventoryTransfer>("/inventory/transfers", {
    errorText: "No pudimos cargar el historial de transferencias.",
  });

  const [fromItem, setFromItem] = useState<InventoryItem | null>(null);
  const [toItem, setToItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const sameItem = Boolean(fromItem && toItem && fromItem.id === toItem.id);
  const sameBranch = Boolean(fromItem && toItem && !sameItem && fromItem.localId === toItem.localId);
  const exceedsStock = Boolean(fromItem && Number(quantity) > fromItem.quantityOnHand);
  const canSubmit =
    Boolean(fromItem && toItem) && Number(quantity) > 0 && !sameItem && !sameBranch && !exceedsStock && !creating;

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !fromItem || !toItem) return;
    const ok = await create({
      fromInventoryItemId: fromItem.id,
      toInventoryItemId: toItem.id,
      quantity: Number(quantity),
      reason: reason.trim() || undefined,
    });
    if (!ok) return;
    setFromItem(null);
    setToItem(null);
    setQuantity("1");
    setReason("");
    setFormKey((key) => key + 1);
    await history.refetch();
  };

  return {
    labels,
    history,
    formKey,
    fromItem,
    setFromItem,
    toItem,
    setToItem,
    quantity,
    setQuantity,
    reason,
    setReason,
    sameItem,
    sameBranch,
    exceedsStock,
    creating,
    canSubmit,
    handleSubmit,
  };
};
