import { useEffect, useMemo } from "react";
import { useTicketFormat } from "@common/hooks/use-ticket-format";
import { useParams } from "react-router";

import { useServiceTypes } from "@common/hooks/use-service-types";
import { usePdfPreview } from "@common/hooks/use-pdf-preview";
import { useLocal } from "../../../app_platform/local/hooks/use-local";
import { useRepairNotes } from "./use-repair-notes";
import { deviceServiceTypeNames, uniqueNames } from "../utils/devices";

export const useRepairNotePrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const { note, loading: loadingNote, fetchNote } = useRepairNotes();
  const { local, loading: loadingLocal, fetchLocal } = useLocal();
  const { serviceTypes, fetchAll: fetchServiceTypes } = useServiceTypes();

  useEffect(() => {
    if (id) fetchNote(id);
    fetchLocal();
    fetchServiceTypes();
  }, [id, fetchNote, fetchLocal, fetchServiceTypes]);

  const format = useTicketFormat(local?.defaultTicketSize);

  const serviceTypeNames = useMemo(
    () => uniqueNames(deviceServiceTypeNames(note?.devices ?? [], serviceTypes)),
    [note?.devices, serviceTypes],
  );

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
