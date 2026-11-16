import { useState } from "react";
import type { InventoryItem } from "@commerce/inventory/hooks/use-inventory";
import type { OpenLayawayItemInput } from "./use-layaways";

export type LayawayItemLine = { inventoryItemId: string; quantity: string; unitPrice: string };

const emptyLine: LayawayItemLine = { inventoryItemId: "", quantity: "1", unitPrice: "" };

export const useLayawayItemLines = (inventoryItems: InventoryItem[]) => {
  const [lines, setLines] = useState<LayawayItemLine[]>([{ ...emptyLine }]);

  const updateLine = (index: number, patch: Partial<LayawayItemLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const handleItemChange = (index: number, inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    updateLine(index, { inventoryItemId, unitPrice: item ? String(item.salePrice) : "" });
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);

  const totalValue = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  const buildItemsPayload = (): OpenLayawayItemInput[] =>
    lines
      .filter((l) => l.inventoryItemId && Number(l.quantity) > 0)
      .map((l) => ({
        inventoryItemId: l.inventoryItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      }));

  return { lines, updateLine, handleItemChange, addLine, totalValue, buildItemsPayload };
};
