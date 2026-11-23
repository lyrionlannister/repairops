export interface StagingRow {
  brand: string;
  model: string;
  price: number;
}

export interface StagingProgress {
  chunksTotal: number;
  chunksDone: number;
  itemsFound: number;
}

export interface StagingRecord {
  importId: string;
  tenantId: string;
  supplierId: string;
  status: StagingStatus;
  rows: StagingRow[];
  error?: string;
  createdAt: string;
  progress?: StagingProgress;
}

export type StagingStatus = "processing" | "ready" | "error";
