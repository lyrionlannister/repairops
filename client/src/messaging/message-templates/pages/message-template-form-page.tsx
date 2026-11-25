import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useMessageTemplates } from "../hooks/use-message-templates";
import { MessageTemplateForm } from "../components/message-template-form";
import type { MessageTemplateFormData } from "../types/message-templates";

const emptyForm: MessageTemplateFormData = { key: "", text: "", description: "" };

export const MessageTemplateFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { templates, loading, saving, fetchAll, create, update } = useMessageTemplates();
  const [form, setForm] = useState<MessageTemplateFormData>(emptyForm);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const template = templates.find((t) => t.id === id);
    if (template)
      setForm({ key: template.key, text: template.text, description: template.description ?? "" });
  }, [isEdit, id, templates]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok =
      isEdit && id
        ? await update(id, { text: form.text, description: form.description })
        : await create({ key: form.key, text: form.text, description: form.description });
    if (ok) navigate("/messaging/message-templates");
  };

  return (
    <PageShell
      title={isEdit ? "Editar plantilla" : "Nueva plantilla"}
      description={
        isEdit
          ? "Modifica el mensaje predefinido."
          : "Crea un nuevo mensaje predefinido para el agente de WhatsApp."
      }
    >
      <MessageTemplateForm
        form={form}
        loading={loading}
        saving={saving}
        isEdit={isEdit}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/messaging/message-templates")}
      />
    </PageShell>
  );
};
