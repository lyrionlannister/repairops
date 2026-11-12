import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

@Entity("local_config")
export class Local extends BaseEntity {
  @Column({ type: "bigint", nullable: false, unique: true, name: "tenant_id" })
  tenantId!: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "nombre" })
  name?: string;

  @Column({ type: "varchar", length: 500, nullable: true, name: "direccion" })
  address?: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "telefono" })
  phone?: string;

  @Column({ type: "text", nullable: true, name: "logo" })
  logo?: string;

  @Column({ type: "int", default: 1, name: "siguiente_numero_control" })
  nextControlNumber!: number;

  // Folio de venta del POS -- mismo mecanismo atomico que nextControlNumber
  // (ver LocalDao.consumeSaleNumber), consecutivo por tenant, no por sucursal.
  @Column({ type: "int", default: 1, name: "siguiente_numero_venta" })
  nextSaleNumber!: number;

  // IVA por defecto 16% (MX, cap. 9/10 del plan). Configurable por tenant,
  // nunca quemado en el motor de calculo (ver commerce/pricing).
  @Column({ type: "decimal", precision: 5, scale: 2, default: 16, name: "tasa_impuesto" })
  taxRatePercent!: number;

  // Tope de descuento por rol en el POS, ej. {"cashier": 10} = un cajero no
  // puede aplicar mas de 10% por renglon. Un rol ausente del mapa no tiene
  // tope (lo valida SaleService antes de cobrar, API y pantalla).
  // Default a nivel de columna deliberadamente vacio: el valor real por
  // rol ({"cashier": 10}) se siembra en el INSERT de LocalDao.findOrCreate,
  // no aqui. Sin "::jsonb": PostgresQueryRunner.loadTables le quita el cast
  // al leer column_default de vuelta (PostgresDriver.js:2079), así que un
  // default de función que SÍ incluya el cast nunca compara igual -- queda
  // en falso drift para siempre en schema:check.
  @Column({ type: "jsonb", default: () => `'{}'`, name: "tope_descuento_por_rol" })
  maxDiscountPercentByRole!: Record<string, number>;

  // 0 = sin redondeo. Solo se aplica a movimientos de caja en efectivo
  // (CashService.registerMovement) -- tarjeta/transferencia nunca redondean.
  @Column({ type: "decimal", precision: 4, scale: 2, default: 0, name: "unidad_redondeo_caja" })
  cashRoundingUnit!: number;

  // Diferencia de efectivo que un cierre de caja puede tener sin que un
  // owner/admin la autorice (monto fijo, no porcentaje -- ver
  // SPEC-fase3-pos-dinero.md, Open Question 1). Configurable por tenant.
  @Column({ type: "decimal", precision: 10, scale: 2, default: 50, name: "tope_diferencia_caja_sin_autorizar" })
  maxUnauthorizedCashVariance!: number;

  // Valor por defecto del plan (MARKET=MX, CURRENCY=MXN, cap. 9/10). Configurable
  // por tenant, no quemado en código -- lo usan reportes, tickets y ventas.
  @Column({ type: "varchar", length: 3, default: "MXN", name: "moneda" })
  currency!: string;

  // Tamaño de ticket que imprime este local por defecto: 58mm, 80mm o carta.
  @Column({ type: "varchar", length: 10, default: "80mm", name: "formato_ticket" })
  defaultTicketSize!: "58mm" | "80mm" | "letter";

  @Column({ type: "text", nullable: true, name: "clausula_garantia" })
  warrantyClause?: string | null;

  @CreateDateColumn({
    name: "fecha_creacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt!: Date;
}
