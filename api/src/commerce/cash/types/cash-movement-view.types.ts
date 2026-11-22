import type { CashMovement } from "../entities/cash-movement.entity.js";

export type CashMovementView = Omit<CashMovement, "amount"> & { amount: string | null };
