import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { useServiceTypes } from "@common/hooks/use-service-types";
import { usePdfPreview } from "@common/hooks/use-pdf-preview";
import { useLocal, type TicketSize } from "../../../app_platform/local/hooks/use-local";
import { useRepairNotes } from "./use-repair-notes";

export const useRepairNotePrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const { note, loading: loadingNote, fetchNote, fetchNoteServiceTypeIds } = useRepairNotes();
  const { local, loading: loadingLocal, fetchLocal } = useLocal();
  const { serviceTypes, fetchAll: fetchServiceTypes } = useServiceTypes();
  const [ticketSize, setTicketSize] = useState<TicketSize | null>(null);
  const [serviceTypeNames, setServiceTypeNames] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchNote(id);
    fetchLocal();
    fetchServiceTypes();
  }, [id, fetchNote, fetchLocal, fetchServiceTypes]);

  useEffect(() => {
    if (local && ticketSize === null) setTicketSize(local.defaultTicketSize);
  }, [local, ticketSize]);

  useEffect(() => {
    if (!note) return;
    fetchNoteServiceTypeIds(note.id).then((ids) => {
      const nameById = new Map(serviceTypes.map((t) => [t.id, t.name]));
      setServiceTypeNames(
        ids.map((typeId) => nameById.get(typeId)).filter((n): n is string => Boolean(n)),
      );
    });
  }, [note, serviceTypes, fetchNoteServiceTypeIds]);

  const isThermal = ticketSize === "58mm" || ticketSize === "80mm";
  const pdf = usePdfPreview(ticketSize === "letter" && id ? `/repair-notes/${id}/pdf` : null);

  return {
    note,
    local,
    loading: loadingNote || loadingLocal,
    ticketSize: ticketSize ?? "80mm",
    setTicketSize,
    isThermal,
    pageWidthMm: ticketSize === "58mm" ? (58 as const) : (80 as const),
    serviceTypeNames,
    pdf,
  };
};
