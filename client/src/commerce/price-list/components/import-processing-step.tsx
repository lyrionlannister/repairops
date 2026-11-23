import type { FC } from "react";
import { Sparkles } from "lucide-react";
import type { ImportProcessingStepProps } from "../props/import-processing-step-props";

export const ImportProcessingStep: FC<ImportProcessingStepProps> = ({ progress }) => {
  const hasProgress = !!progress && progress.chunksTotal > 0;
  const percent = hasProgress
    ? Math.min(100, Math.round((progress.chunksDone / progress.chunksTotal) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-10 dark:border-gray-800 dark:bg-white/3 sm:p-12">
      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40 dark:bg-brand-500/30" />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40">
          <Sparkles className="size-7 text-brand-500" />
        </span>
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-gray-800 dark:text-white/90">
          Analizando tu lista de precios con IA
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {hasProgress
            ? "Identificando marca, modelo y precio por bloques del archivo..."
            : "Leyendo tu archivo..."}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          {hasProgress ? (
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500 dark:bg-brand-500"
              style={{ width: `${percent}%` }}
            />
          ) : (
            <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-400 dark:bg-brand-600" />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs tabular-nums text-gray-500 dark:text-gray-400">
          <span>
            {hasProgress
              ? `Bloque ${progress.chunksDone} de ${progress.chunksTotal}`
              : "Preparando..."}
          </span>
          <span>{hasProgress ? `${progress.itemsFound} producto(s) encontrados` : ""}</span>
        </div>
      </div>
    </div>
  );
};
