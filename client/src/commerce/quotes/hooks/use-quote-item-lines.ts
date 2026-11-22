import { useState } from "react";
import type { InventoryItem } from "@commerce/inventory/types/inventory";
import type { QuoteItemInput, QuoteItemRecord } from "../types/quotes";
import type { QuoteItemLine } from "../types/quote-item-lines";

const emptyItemLine: QuoteItemLine = { inventoryItemId: "", description: "", quantity: "1", unitPrice: "" };

export const useQuoteItemLines = (inventoryItems: InventoryItem[]) => {
  const [itemLines, setItemLines] = useState<QuoteItemLine[]>([{ ...emptyItemLine }]);

  const loadFromRecords = (records: QuoteItemRecord[]) => {
    setItemLines(
      records.map((i) => ({
        inventoryItemId: i.inventoryItemId ?? "",
        description: i.description,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice),
      })),
    );
  };

  const updateItemLine = (index: number, patch: Partial<QuoteItemLine>) =>
    setItemLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const handleInventoryItemChange = (index: number, inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    updateItemLine(index, {
      inventoryItemId,
      description: item ? item.name : "",
      unitPrice: item ? String(item.salePrice) : "",
    });
  };

  const addItemLine = () => setItemLines((prev) => [...prev, { ...emptyItemLine }]);
  const removeItemLine = (index: number) => setItemLines((prev) => prev.filter((_, i) => i !== index));

  const buildItemsPayload = (): QuoteItemInput[] =>
    itemLines
      .filter((l) => l.description.trim() && Number(l.quantity) > 0)
      .map((l) => ({
        inventoryItemId: l.inventoryItemId || undefined,
        description: l.description.trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice) || 0,
      }));

  return {
    itemLines,
    loadFromRecords,
    updateItemLine,
    handleInventoryItemChange,
    addItemLine,
    removeItemLine,
    buildItemsPayload,
  };
};
