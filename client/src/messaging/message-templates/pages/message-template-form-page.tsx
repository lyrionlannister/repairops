import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Alert } from "@ui/alert/alert";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { TextArea } from "@ui/textarea/textarea";
import { PageMeta } from "@common/pages/page-meta";

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

  const { templates, loading, saving, error, fetchAll, create, update } = useMessageTemplates();
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
    if (ok) navigate("/app/templates");
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={isEdit ? "Editar template" : "Nuevo template"}
        description="Plantillas de mensajes"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/app/templates")}
          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 md:p-1.5 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {isEdit ? "Editar template" : "Nuevo template"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? "Modifica el mensaje predefinido." : "Crea un nuevo mensaje predefinido para el agente de WhatsApp."}
          </p>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

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
          <Button type="button" variant="outline" onClick={() => navigate("/app/templates")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Guardar cambios" : "Crear template"}
          </Button>
        </div>
      </form>
    </div>
  );
};

