import { useMemo } from "react";
import type { RepairNoteRecord } from "./use-repair-notes";

// Marcas ya usadas en otras notas -- sugerencia, nunca restringe a una
// marca nueva que el cliente trae por primera vez.
export const useKnownBrands = (notes: RepairNoteRecord[]) =>
  useMemo(() => Array.from(new Set(notes.map((n) => n.brand).filter(Boolean))).sort(), [notes]);
