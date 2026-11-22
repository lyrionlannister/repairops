import { useEffect, useState } from "react";
import { useTicketFormat } from "@common/hooks/use-ticket-format";
import { useParams } from "react-router";

import { useServiceTypes } from "@common/hooks/use-service-types";
import { usePdfPreview } from "@common/hooks/use-pdf-preview";
import { useLocal } from "../../../app_platform/local/hooks/use-local";
import { useRepairNotes } from "./use-repair-notes";

export const useRepairNotePrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const { note, loading: loadingNote, fetchNote, fetchNoteServiceTypeIds } = useRepairNotes();
  const { local, loading: loadingLocal, fetchLocal } = useLocal();
  const { serviceTypes, fetchAll: fetchServiceTypes } = useServiceTypes();
  const [serviceTypeNames, setServiceTypeNames] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchNote(id);
    fetchLocal();
    fetchServiceTypes();
  }, [id, fetchNote, fetchLocal, fetchServiceTypes]);

  const format = useTicketFormat(local?.defaultTicketSize);

  useEffect(() => {
    if (!note) return;
    fetchNoteServiceTypeIds(note.id).then((ids) => {
      const nameById = new Map(serviceTypes.map((t) => [t.id, t.name]));
      setServiceTypeNames(
        ids.map((typeId) => nameById.get(typeId)).filter((n): n is string => Boolean(n)),
      );
    });
  }, [note, serviceTypes, fetchNoteServiceTypeIds]);

  const pdf = usePdfPreview(!format.isThermal && id ? `/repair-notes/${id}/pdf` : null);

  return {
    note,
    local,
    loading: loadingNote || loadingLocal,
    ...format,
    serviceTypeNames,
    pdf,
  };
};
