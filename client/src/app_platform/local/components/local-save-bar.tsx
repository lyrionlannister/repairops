import type { FC } from "react";
import { Button } from "@ui/button/button";
import type { LocalSaveBarProps } from "../props/local-save-bar-props";
import { LOCAL_SETTINGS_FORM_ID } from "../utils/local-tabs";

export const LocalSaveBar: FC<LocalSaveBarProps> = ({ isDirty, saving, onDiscard }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
    <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
      {isDirty ? (
        <span className="font-medium text-warning-600 dark:text-warning-400">
          Cambios sin guardar
        </span>
      ) : (
        "Todo está guardado"
      )}
    </p>
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={!isDirty || saving}
        onClick={onDiscard}
      >
        Descartar
      </Button>
      <Button
        type="submit"
        form={LOCAL_SETTINGS_FORM_ID}
        variant="primary"
        className="flex-1 sm:flex-none"
        disabled={!isDirty || saving}
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  </div>
);
