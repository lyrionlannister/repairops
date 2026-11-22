import { Check, Column, Entity } from "typeorm";
import { BaseEntity } from "../../../core/common/entities/base.entity.js";

export type PlanKey = "basico" | "crecimiento" | "cadena" | "platform";

// Catálogo de la plataforma: sin tenant_id a propósito, igual que las plantillas de
// sistema. Las filas las inserta la migración CreatePlans.
@Entity("plans")
@Check("CHK_plans_limits", `("max_users" IS NULL OR "max_users" > 0) AND ("max_branches" IS NULL OR "max_branches" > 0)`)
export class Plan extends BaseEntity {
  @Column({ type: "varchar", length: 30, unique: true, name: "key" })
  key!: PlanKey;

  @Column({ type: "varchar", length: 60, name: "nombre" })
  name!: string;

  // null = sin límite.
  @Column({ type: "integer", nullable: true, name: "max_users" })
  maxUsers!: number | null;

  @Column({ type: "integer", nullable: true, name: "max_branches" })
  maxBranches!: number | null;

  @Column({ type: "boolean", default: true, name: "publico" })
  isPublic!: boolean;
}
