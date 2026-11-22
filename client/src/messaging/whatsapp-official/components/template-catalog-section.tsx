import type { FC } from "react";
import { MessageCircle } from "lucide-react";

import { Button } from "@ui/button/button";
import { ConfirmModal } from "@ui/modal/confirm-modal";

import { useTemplateCatalogSection } from "../hooks/use-template-catalog-section";
import type { TemplateStatusByEntry } from "../hooks/use-template-status-by-entry";
import { TemplateCatalogTable } from "./template-catalog-table";
import { TemplateCatalogFormModal } from "./template-catalog-form-modal";

interface TemplateCatalogSectionProps {
  scope: "tenant" | "system";
  title: string;
  description: string;
  readOnly?: boolean;
  statusByEntryId?: TemplateStatusByEntry;
}

// Una plantilla con disparador automático (ej. order_ready) muestra el aviso
// pero NUNCA bloquea el borrado -- el usuario pidió "totalmente
// administrable" (ver plan Fase 4, Checkpoint 7).
export const TemplateCatalogSection: FC<TemplateCatalogSectionProps> = ({
  scope,
  title,
  description,
  readOnly = false,
  statusByEntryId,
}) => {
  const catalog = useTemplateCatalogSection(scope);

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        {!readOnly && (
          <Button variant="outline" onClick={catalog.openCreateForm}>
            Nueva plantilla
          </Button>
        )}
      </div>

      {catalog.loading && catalog.entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : catalog.entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
          <MessageCircle className="size-10 opacity-40" />
          <p className="text-sm">Sin plantillas todavía.</p>
        </div>
      ) : (
        <TemplateCatalogTable
          entries={catalog.entries}
          statusByEntryId={statusByEntryId}
          readOnly={readOnly}
          onEdit={catalog.openEditForm}
          onDelete={catalog.requestDelete}
        />
      )}

      <TemplateCatalogFormModal
        isOpen={catalog.isFormOpen}
        isEditing={catalog.isEditing}
        form={catalog.form}
        saving={catalog.saving}
        onFieldChange={catalog.setField}
        onSubmit={catalog.submit}
        onClose={catalog.closeForm}
      />

      <ConfirmModal
        isOpen={!!catalog.deletingEntry}
        title="Borrar plantilla"
        message={`¿Borrar "${catalog.deletingEntry?.key}"? Si ya está registrada en Meta, se borra también allá.`}
        confirmLabel="Borrar"
        danger
        loading={catalog.saving}
        onConfirm={catalog.confirmDelete}
        onClose={catalog.cancelDelete}
      />
    </div>
  );
};
