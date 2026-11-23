import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { Customer } from "../entities/customer.entity.js";

export interface CustomerCreditAgingRow {
  customerId: string;
  balance: string;
  overdue: string;
}

// Los abonos no se ligan a una deuda concreta: se aplican FIFO a la deuda que
// vence primero (las previas a la fecha de vencimiento, sin due_date, por su
// fecha de alta). Lo que queda de cada deuda con vencimiento anterior a `today`
// es mora. La suma de lo pendiente coincide con sumCreditBalance.
const AGING_SQL = `
  WITH debts AS (
    SELECT s.customer_id, p.monto AS amount, p.fecha_vencimiento AS due_date, s.fecha_creacion AS created_at, 1 AS kind, p.id
    FROM sale_payments p
    JOIN sales s ON s.id = p.id_venta AND s.tenant_id = p.tenant_id
    WHERE p.tenant_id = $1 AND p.metodo = 'credito' AND s.customer_id IS NOT NULL
    UNION ALL
    SELECT n.customer_id, p.monto, p.fecha_vencimiento, p.fecha_creacion, 2, p.id
    FROM repair_note_payments p
    JOIN repair_notes n ON n.id = p.id_nota_reparacion AND n.tenant_id = p.tenant_id
    WHERE p.tenant_id = $1 AND p.metodo = 'credito' AND n.customer_id IS NOT NULL
  ), paid AS (
    SELECT id_cliente AS customer_id, SUM(monto) AS total
    FROM customer_payments
    WHERE tenant_id = $1
    GROUP BY id_cliente
  ), ranked AS (
    SELECT d.customer_id, d.amount, d.due_date, COALESCE(paid.total, 0) AS paid,
      SUM(d.amount) OVER (
        PARTITION BY d.customer_id
        ORDER BY COALESCE(d.due_date, d.created_at::date), d.created_at, d.kind, d.id
        ROWS UNBOUNDED PRECEDING
      ) AS cumulative
    FROM debts d
    LEFT JOIN paid ON paid.customer_id = d.customer_id
    WHERE ($3::bigint[] IS NULL OR d.customer_id = ANY($3::bigint[]))
  ), pending AS (
    SELECT customer_id, due_date, GREATEST(0, LEAST(amount, cumulative - paid)) AS amount
    FROM ranked
  )
  SELECT
    customer_id::text AS "customerId",
    SUM(amount)::numeric(14,2)::text AS "balance",
    COALESCE(SUM(amount) FILTER (WHERE due_date < $2::date), 0)::numeric(14,2)::text AS "overdue"
  FROM pending
  GROUP BY customer_id
  HAVING SUM(amount) > 0
`;

@singleton()
export class CustomerCreditDao {
  constructor(@inject(repositoryToken(Customer)) private repository: Repository<Customer>) {}

  async findAging(
    today: string,
    customerIds: string[] | null = null,
  ): Promise<CustomerCreditAgingRow[]> {
    if (customerIds && customerIds.length === 0) return [];
    return this.repository.query<CustomerCreditAgingRow[]>(AGING_SQL, [
      getCurrentTenantId(),
      today,
      customerIds,
    ]);
  }
}
