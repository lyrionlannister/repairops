import { useState } from "react";
import type { InventoryItem } from "@commerce/inventory/hooks/use-inventory";
import type { RepairNoteItemInput, RepairNoteItemRecord } from "./use-repair-notes";

export type RepairNoteItemLine = { inventoryItemId: string; quantity: string; unitPrice: string };

const emptyItemLine: RepairNoteItemLine = { inventoryItemId: "", quantity: "1", unitPrice: "" };

export const useRepairNoteItemLines = (inventoryItems: InventoryItem[]) => {
  const [itemLines, setItemLines] = useState<RepairNoteItemLine[]>([]);

  const loadFromRecords = (records: RepairNoteItemRecord[]) => {
    setItemLines(
      records.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice),
      })),
    );
  };

  const updateItemLine = (index: number, patch: Partial<RepairNoteItemLine>) =>
    setItemLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const handleItemChange = (index: number, inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    updateItemLine(index, { inventoryItemId, unitPrice: item ? String(item.salePrice) : "" });
  };

  const addItemLine = () => setItemLines((prev) => [...prev, { ...emptyItemLine }]);
  const removeItemLine = (index: number) => setItemLines((prev) => prev.filter((_, i) => i !== index));

  const buildItemsPayload = (): RepairNoteItemInput[] =>
    itemLines
      .filter((l) => l.inventoryItemId && Number(l.quantity) > 0)
      .map((l) => ({
        inventoryItemId: l.inventoryItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice) || 0,
      }));

  return {
    itemLines,
    loadFromRecords,
    updateItemLine,
    handleItemChange,
    addItemLine,
    removeItemLine,
    buildItemsPayload,
  };
};
