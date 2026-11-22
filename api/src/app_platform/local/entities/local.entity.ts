import {
  Check,
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";

@Entity("local_config")
@Check("CHK_local_config_color_marca", `"color_marca" IS NULL OR "color_marca" ~ '^#[0-9a-f]{6}$'`)
export class Local extends BaseEntity {
  @Column({ type: "bigint", nullable: false, unique: true, name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", foreignKeyConstraintName: "FK_local_config_tenant" })
  tenant?: Tenant;

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

  // Folio de devolucion (Fase 5) -- mismo mecanismo atomico que
  // nextSaleNumber/nextControlNumber (ver LocalDao.consumeReturnNumber),
  // consecutivo propio, nunca comparte contador con venta.
  @Column({ type: "int", default: 1, name: "siguiente_numero_devolucion" })
  nextReturnNumber!: number;

  // IVA por defecto 16% (MX, cap. 9/10 del plan). Configurable por tenant,
  // nunca quemado en el motor de calculo (ver commerce/pricing).
  @Column({ type: "decimal", precision: 5, scale: 2, default: 16, name: "tasa_impuesto" })
  taxRatePercent!: number;

  // 0 = sin redondeo. Solo se aplica a movimientos de caja en efectivo
  // (CashService.registerMovement) -- tarjeta/transferencia nunca redondean.
  @Column({ type: "decimal", precision: 4, scale: 2, default: 0, name: "unidad_redondeo_caja" })
  cashRoundingUnit!: number;

  // Diferencia de efectivo que un cierre de caja puede tener sin que un
  // owner/admin la autorice (monto fijo, no porcentaje -- ver
  // SPEC-fase3-pos-dinero.md, Open Question 1). Configurable por tenant.
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 50,
    name: "tope_diferencia_caja_sin_autorizar",
  })
  maxUnauthorizedCashVariance!: number;

  // Valor por defecto del plan (MARKET=MX, CURRENCY=MXN, cap. 9/10). Configurable
  // por tenant, no quemado en código -- lo usan reportes, tickets y ventas.
  @Column({ type: "varchar", length: 3, default: "MXN", name: "moneda" })
  currency!: string;

  @Column({ type: "varchar", length: 10, default: "80mm", name: "formato_ticket" })
  defaultTicketSize!: "58mm" | "80mm" | "letter";

  // Color de marca (#rrggbb en minusculas). NULL = paleta azul de siempre. La
  // paleta derivada se calcula en el API (utils/brand-palette.ts), nunca aqui.
  @Column({ type: "varchar", length: 7, nullable: true, name: "color_marca" })
  brandColor?: string | null;

  // Zona horaria IANA del taller: define que es "hoy", la semana y el mes en el
  // dashboard y los reportes (nunca el reloj del navegador ni UTC).
  @Column({ type: "varchar", length: 64, default: "America/Mexico_City", name: "zona_horaria" })
  timeZone!: string;

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
