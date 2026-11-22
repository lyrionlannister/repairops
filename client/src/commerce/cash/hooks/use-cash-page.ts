import { useEffect, useState } from "react";
import type { CashMovementMethod, CashMovementType, CashSessionRecord, CashSummary } from "../types/cash";
import type { CashMovementForm } from "../types/cash-page";

export const emptyCashMovementForm: CashMovementForm = {
  type: "income",
  method: "efectivo",
  amount: "",
  note: "",
  createdByEmployeeId: "",
};

export const useCashPage = ({
  local,
  branchId,
  session,
  movements,
  summary,
  loading,
  saving,
  error,
  fetchLocal,
  fetchOpenSession,
  openSession,
  closeSession,
  clearClosedSession,
  fetchMovements,
  fetchSummary,
  registerMovement,
  clearError,
}: {
  local: { id: string } | null;
  branchId: string;
  session: CashSessionRecord | null;
  movements: Array<{
    id: string;
    type: CashMovementType;
    method: CashMovementMethod;
    amount: number;
    note: string | null;
    createdAt: string;
  }>;
  summary: CashSummary | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchLocal: () => Promise<void>;
  fetchOpenSession: (localId: string) => Promise<CashSessionRecord | null>;
  openSession: (
    localId: string,
    openingBalance: number,
    openedByEmployeeId?: string,
  ) => Promise<boolean>;
  closeSession: (
    id: string,
    closingBalance: number,
    reason?: string,
    authorizedByEmployeeId?: string,
  ) => Promise<CashSessionRecord | null>;
  clearClosedSession: () => void;
  fetchMovements: (sessionId: string) => Promise<void>;
  fetchSummary: (sessionId: string) => Promise<void>;
  registerMovement: (
    sessionId: string,
    data: {
      type: CashMovementType;
      method: CashMovementMethod;
      amount: number;
      note?: string;
      createdByEmployeeId: string;
    },
  ) => Promise<boolean>;
  clearError: () => void;
}) => {
  const [openingBalance, setOpeningBalance] = useState("0");
  const [openedByEmployeeId, setOpenedByEmployeeId] = useState("");
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [movementForm, setMovementForm] = useState<CashMovementForm>(emptyCashMovementForm);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState("0");
  const [closeReason, setCloseReason] = useState("");
  const [closeAuthorizedByEmployeeId, setCloseAuthorizedByEmployeeId] = useState("");
  const [showCloseReasonField, setShowCloseReasonField] = useState(false);
  const [showCloseAuthorizerField, setShowCloseAuthorizerField] = useState(false);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  useEffect(() => {
    if (branchId) fetchOpenSession(branchId);
  }, [branchId, fetchOpenSession]);

  useEffect(() => {
    if (session) {
      fetchMovements(session.id);
      fetchSummary(session.id);
    }
  }, [session, fetchMovements, fetchSummary]);

  const handleOpen = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branchId) return;
    await openSession(branchId, Number(openingBalance) || 0, openedByEmployeeId || undefined);
  };

  const handleRegisterMovement = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    const ok = await registerMovement(session.id, {
      type: movementForm.type,
      method: movementForm.method,
      amount: Number(movementForm.amount) || 0,
      note: movementForm.note || undefined,
      createdByEmployeeId: movementForm.createdByEmployeeId,
    });

    if (ok) {
      setIsMovementOpen(false);
      setMovementForm(emptyCashMovementForm);
    }
  };

  // Arqueo ciego: el motivo y el autorizador solo se piden cuando el servidor
  // los exige (closeSession, dos puertas), nunca antes -- la pantalla no
  // adelanta si hay diferencia o cuanta.
  useEffect(() => {
    if (!error) return;
    if (error.includes("motivo")) setShowCloseReasonField(true);
    if (error.includes("autorización") || error.includes("rol owner"))
      setShowCloseAuthorizerField(true);
  }, [error]);

  const resetCloseForm = () => {
    setIsCloseOpen(false);
    setClosingBalance("0");
    setCloseReason("");
    setCloseAuthorizedByEmployeeId("");
    setShowCloseReasonField(false);
    setShowCloseAuthorizerField(false);
  };

  const handleClose = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    const closed = await closeSession(
      session.id,
      Number(closingBalance) || 0,
      closeReason || undefined,
      closeAuthorizedByEmployeeId || undefined,
    );
    if (closed) {
      resetCloseForm();
      if (branchId) fetchOpenSession(branchId);
    }
  };

  const handleCancelClose = () => {
    resetCloseForm();
    clearError();
  };

  const handleDismissClosedSession = () => {
    clearClosedSession();
  };

  return {
    openingBalance,
    setOpeningBalance,
    openedByEmployeeId,
    setOpenedByEmployeeId,
    isMovementOpen,
    setIsMovementOpen,
    movementForm,
    setMovementForm,
    isCloseOpen,
    setIsCloseOpen,
    closingBalance,
    setClosingBalance,
    closeReason,
    setCloseReason,
    closeAuthorizedByEmployeeId,
    setCloseAuthorizedByEmployeeId,
    showCloseReasonField,
    showCloseAuthorizerField,
    loading,
    saving,
    error,
    clearError,
    session,
    movements,
    summary,
    local,
    handleOpen,
    handleRegisterMovement,
    handleClose,
    handleCancelClose,
    handleDismissClosedSession,
  };
};
