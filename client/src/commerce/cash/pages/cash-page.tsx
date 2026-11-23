import { PageShell } from "@common/components/page-shell/page-shell";
import { CashBoard } from "../components/cash-board";

export const CashPage = () => (
  <PageShell title="Caja" description="Turno, movimientos y cortes de caja de la sucursal.">
    <CashBoard />
  </PageShell>
);
