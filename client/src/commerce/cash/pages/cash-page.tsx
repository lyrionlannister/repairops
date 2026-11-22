import { PageShell } from "@common/components/page-shell/page-shell";
import { useCashScreen } from "../hooks/use-cash-screen";
import { OpenCashForm } from "../components/open-cash-form";
import { LastCutCard } from "../components/last-cut-card";
import { VarianceStatsRow } from "../components/variance-stats-row";
import { CutHistoryTable } from "../components/cut-history-table";
import { CashShiftCard } from "../components/cash-shift-card";
import { CashKpiRow } from "../components/cash-kpi-row";
import { CashFlowChart } from "../components/cash-flow-chart";
import { CashBreakdownCard } from "../components/cash-breakdown-card";
import { CashMovementsTable } from "../components/cash-movements-table";
import { RegisterMovementModal } from "../components/register-movement-modal";
import { CloseCashModal } from "../components/close-cash-modal";

export const CashPage = () => {
  const screen = useCashScreen();
  const { insights, cuts, pagination } = screen;
  const breakdowns = (
    <>
      <CashBreakdownCard
        title="Por método"
        subtitle="Cómo se cobró y pagó"
        rows={insights.methods}
        emptyText="Sin movimientos todavía."
      />
      <CashBreakdownCard
        title="Por origen"
        subtitle="De dónde vino el dinero"
        rows={insights.origins}
        emptyText="Sin movimientos todavía."
      />
    </>
  );

  if (screen.loading && !screen.session) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando caja...
      </div>
    );
  }

  return (
    <PageShell title="Caja" description="Turno, movimientos y cortes de caja de la sucursal.">
      {screen.session && insights.shift ? (
        <>
          <div className="shrink-0">
            <CashKpiRow openingBalance={screen.session.openingBalance} summary={screen.summary} />
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-6 lg:grid-cols-3">
            <CashShiftCard
              shift={insights.shift}
              branchName={screen.branchName}
              onIncome={screen.openIncome}
              onExpense={screen.openExpense}
              onClose={() => screen.setIsCloseOpen(true)}
            />
            {insights.amountsHidden ? (
              breakdowns
            ) : (
              <div className="min-w-0 lg:col-span-2">
                <CashFlowChart flow={insights.flow} />
              </div>
            )}
          </div>

          {!insights.amountsHidden && (
            <div className="grid shrink-0 grid-cols-1 gap-6 lg:grid-cols-2">{breakdowns}</div>
          )}

          <CashMovementsTable
            rows={insights.rows}
            pageItems={pagination.pageItems}
            totalMovements={insights.shift.movementCount}
            filters={insights.filters}
            hasFilters={insights.hasFilters}
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            onFilterChange={insights.setFilter}
            onClearFilters={insights.clearFilters}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            onRegisterIncome={screen.openIncome}
          />
        </>
      ) : (
        <div
          className={`grid shrink-0 grid-cols-1 items-start gap-6 ${cuts.canAudit ? "lg:grid-cols-3" : "max-w-xl"}`}
        >
          <div className="space-y-6">
            {cuts.lastCut && (
              <LastCutCard
                cut={cuts.lastCut}
                justClosed={screen.justClosed}
                onPrint={screen.openCut}
                onDismiss={screen.dismissClosed}
              />
            )}
            <OpenCashForm
              openingBalance={screen.openingBalance}
              suggestedBalance={screen.suggestedBalance}
              openerName={screen.openerName}
              saving={screen.saving}
              onOpeningBalanceChange={screen.setOpeningBalance}
              onSubmit={screen.handleOpen}
            />
          </div>
          {cuts.canAudit && (
            <div className="min-w-0 space-y-6 lg:col-span-2">
              {cuts.stats && <VarianceStatsRow stats={cuts.stats} />}
              <CutHistoryTable cuts={cuts.cuts} onView={screen.openCut} />
            </div>
          )}
        </div>
      )}

      <RegisterMovementModal
        isOpen={screen.isMovementOpen}
        movementForm={screen.movementForm}
        saving={screen.saving}
        cashRoundingUnit={screen.local?.cashRoundingUnit}
        onClose={() => {
          screen.setIsMovementOpen(false);
          screen.clearError();
        }}
        onFormChange={screen.setMovementForm}
        onSubmit={screen.handleRegisterMovement}
      />

      <CloseCashModal
        isOpen={screen.isCloseOpen}
        closingBalance={screen.closingBalance}
        closeReason={screen.closeReason}
        closeAuthorizedByEmployeeId={screen.closeAuthorizedByEmployeeId}
        showCloseReasonField={screen.showCloseReasonField}
        showCloseAuthorizerField={screen.showCloseAuthorizerField}
        saving={screen.saving}
        onClosingBalanceChange={screen.setClosingBalance}
        onCloseReasonChange={screen.setCloseReason}
        onCloseAuthorizedByEmployeeIdChange={screen.setCloseAuthorizedByEmployeeId}
        onCancel={screen.handleCancelClose}
        onSubmit={screen.handleClose}
      />
    </PageShell>
  );
};
