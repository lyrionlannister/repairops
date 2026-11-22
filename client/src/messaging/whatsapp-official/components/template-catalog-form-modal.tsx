import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { TextArea } from "@ui/textarea/textarea";
import { Modal } from "@ui/modal/modal";
import { CATEGORY_OPTIONS } from "../utils/format";
import type { WhatsappTemplateCategory } from "../types/whatsapp-template-catalog";
import type { TemplateCatalogFormModalProps } from "../props/template-catalog-form-modal-props";

// Meta no deja cambiar key, nombre, categoría ni idioma de una plantilla ya registrada:
// al editar solo se tocan texto y variables.
export const TemplateCatalogFormModal: FC<TemplateCatalogFormModalProps> = ({
  isOpen,
  isEditing,
  form,
  saving,
  onFieldChange,
  onSubmit,
  onClose,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 sm:p-8 mx-4">
    <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-100">
      {isEditing ? "Editar plantilla" : "Nueva plantilla"}
    </h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-500">Key</Label>
          <Input
            value={form.key}
            onChange={(event) => onFieldChange("key", event.target.value)}
            required
            disabled={saving || isEditing}
          />
        </div>
        <div>
          <Label className="text-gray-500">Nombre en Meta</Label>
          <Input
            value={form.metaName}
            onChange={(event) => onFieldChange("metaName", event.target.value)}
            required
            disabled={saving || isEditing}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-500">Categoría</Label>
          <Select
            value={form.category}
            onChange={(value) => onFieldChange("category", value as WhatsappTemplateCategory)}
            disabled={saving || isEditing}
            options={CATEGORY_OPTIONS}
          />
        </div>
        <div>
          <Label className="text-gray-500">Idioma</Label>
          <Input
            value={form.language}
            onChange={(event) => onFieldChange("language", event.target.value)}
            required
            disabled={saving || isEditing}
          />
        </div>
      </div>
      <div>
        <Label className="text-gray-500">Texto</Label>
        <TextArea
          value={form.text}
          onChange={(event) => onFieldChange("text", event.target.value)}
          rows={3}
          disabled={saving}
          required
        />
      </div>
      <div>
        <Label className="text-gray-500">Variables (separadas por coma)</Label>
        <Input
          placeholder="nombre, modelo"
          value={form.variablesText}
          onChange={(event) => onFieldChange("variablesText", event.target.value)}
          disabled={saving}
        />
        <p className="mt-1 text-xs text-gray-400">
          Cada nombre debe aparecer en el texto como {"{{nombre}}"}.
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  </Modal>
);
