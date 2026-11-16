import { useLocal } from "@app-platform/local/hooks/use-local";
import { useBranch } from "@common/hooks/use-branch";
import { useCash } from "../hooks/use-cash";
import { useCashPage } from "../hooks/use-cash-page";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { ClosedSessionBanner } from "../components/closed-session-banner";
import { OpenCashForm } from "../components/open-cash-form";
import { CashSessionPanel } from "../components/cash-session-panel";
import { RegisterMovementModal } from "../components/register-movement-modal";
import { CloseCashModal } from "../components/close-cash-modal";

export const CashPage = () => {
  const { local, fetchLocal } = useLocal();
  const { activeBranchId } = useBranch();
  const {
    session,
    closedSession,
    movements,
    summary,
    loading,
    saving,
    error,
    fetchOpenSession,
    openSession,
    closeSession,
    fetchMovements,
    fetchSummary,
    registerMovement,
    clearError,
    clearClosedSession,
  } = useCash();

  const {
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
    handleOpen,
    handleRegisterMovement,
    handleClose,
    handleCancelClose,
    handleDismissClosedSession,
  } = useCashPage({
    local,
    branchId: activeBranchId,
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
  });

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(movements);

  if (loading && !session) {
    return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando caja...</div>;
  }

  return (
    <PageShell title="Caja" description="Apertura, movimientos y cierre de caja del local.">
      {error && <Alert variant="error" title="Error" message={error} />}

      {closedSession && (
        <ClosedSessionBanner closedSession={closedSession} onDismiss={handleDismissClosedSession} />
      )}

      {!session ? (
        <OpenCashForm
          openingBalance={openingBalance}
          openedByEmployeeId={openedByEmployeeId}
          saving={saving}
          onOpeningBalanceChange={setOpeningBalance}
          onOpenedByEmployeeIdChange={setOpenedByEmployeeId}
          onSubmit={handleOpen}
        />
      ) : (
        <CashSessionPanel
          session={session}
          summary={summary}
          movements={movements}
          pageItems={pageItems}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onOpenMovement={() => setIsMovementOpen(true)}
          onOpenClose={() => setIsCloseOpen(true)}
        />
      )}

      <RegisterMovementModal
        isOpen={isMovementOpen}
        movementForm={movementForm}
        saving={saving}
        cashRoundingUnit={local?.cashRoundingUnit}
        onClose={() => {
          setIsMovementOpen(false);
          clearError();
        }}
        onFormChange={setMovementForm}
        onSubmit={handleRegisterMovement}
      />

      <CloseCashModal
        isOpen={isCloseOpen}
        closingBalance={closingBalance}
        closeReason={closeReason}
        closeAuthorizedByEmployeeId={closeAuthorizedByEmployeeId}
        showCloseReasonField={showCloseReasonField}
        showCloseAuthorizerField={showCloseAuthorizerField}
        saving={saving}
        onClosingBalanceChange={setClosingBalance}
        onCloseReasonChange={setCloseReason}
        onCloseAuthorizedByEmployeeIdChange={setCloseAuthorizedByEmployeeId}
        onCancel={handleCancelClose}
        onSubmit={handleClose}
      />
    </PageShell>
  );
};
