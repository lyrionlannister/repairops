import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { PageShell } from "@common/components/page-shell/page-shell";

import { useMessageTemplates } from "../hooks/use-message-templates";

interface MessageTemplateFormState {
  key: string;
  text: string;
  description: string;
}

const emptyForm: MessageTemplateFormState = { key: "", text: "", description: "" };

export const MessageTemplateFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { templates, loading, saving, fetchAll, create, update } = useMessageTemplates();
  const [form, setForm] = useState<MessageTemplateFormState>(emptyForm);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const template = templates.find((t) => t.id === id);
    if (template) setForm({ key: template.key, text: template.text, description: template.description ?? "" });
  }, [isEdit, id, templates]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = isEdit && id
      ? await update(id, { text: form.text, description: form.description })
      : await create({ key: form.key, text: form.text, description: form.description });
    if (ok) navigate("/messaging/message-templates");
  };

  return (
    <PageShell
      title={isEdit ? "Editar template" : "Nuevo template"}
      description={isEdit ? "Modifica el mensaje predefinido." : "Crea un nuevo mensaje predefinido para el agente de WhatsApp."}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
      >
        <div>
          <Label className="text-gray-500">Clave única</Label>
          <Input
            name="key"
            placeholder="ej. saludo_bienvenida"
            value={form.key}
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label className="text-gray-500">Mensaje</Label>
          <TextArea
            name="text"
            value={form.text}
            onChange={handleChange}
            rows={4}
            required
            disabled={loading}
            placeholder="Escribe el mensaje que enviará el agente..."
            className="resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => navigate("/messaging/message-templates")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Guardar cambios" : "Crear template"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
};
