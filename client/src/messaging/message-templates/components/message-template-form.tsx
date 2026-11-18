import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";

import type { MessageTemplateFormData } from "../hooks/use-message-templates";

interface MessageTemplateFormProps {
  form: MessageTemplateFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const MessageTemplateForm: FC<MessageTemplateFormProps> = ({
  form,
  loading,
  saving,
  isEdit,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div>
      <Label className="text-gray-500">Clave única</Label>
      <Input
        name="key"
        placeholder="ej. saludo_bienvenida"
        value={form.key}
        onChange={onChange}
        disabled={isEdit || loading}
        required
      />
      {!isEdit && <p className="mt-1 text-xs text-gray-400">Identificador en snake_case, no se puede cambiar después.</p>}
    </div>

    <div>
      <Label className="text-gray-500">Descripción</Label>
      <Input
        name="description"
        placeholder="¿Para qué se usa este mensaje?"
        value={form.description}
        onChange={onChange}
        disabled={loading}
      />
    </div>

    <div>
      <Label className="text-gray-500">Mensaje</Label>
      <TextArea
        name="text"
        value={form.text}
        onChange={onChange}
        rows={4}
        required
        disabled={loading}
        placeholder="Escribe el mensaje que enviará el agente..."
        className="resize-none"
      />
    </div>

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {isEdit ? "Guardar cambios" : "Crear template"}
      </Button>
    </div>
  </form>
);
