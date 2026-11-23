import type { RepairNoteService } from "../services/repair-note.service.js";

type CreateArgs = Parameters<RepairNoteService["create"]>;
type UpdateArgs = Parameters<RepairNoteService["update"]>;

export type CreateRepairNoteBody = CreateArgs[0] & {
  items?: CreateArgs[1];
  advancePayment?: CreateArgs[2];
};

export type UpdateRepairNoteBody = UpdateArgs[1] & {
  items?: UpdateArgs[2];
};
