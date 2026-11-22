import { singleton } from "tsyringe";
import { runInTransaction } from "../../../core/database/transaction-context.js";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { PlanDao } from "../daos/plan.dao.js";
import { SubscriptionDao } from "../daos/subscription.dao.js";
import type { Plan, PlanKey } from "../entities/plan.entity.js";
import type { Subscription, SubscriptionStatus } from "../entities/subscription.entity.js";
import type { AssignSubscriptionDto } from "../dtos/assign-subscription.dto.js";
import { effectiveLimits, MissingSubscriptionError, PlanLimitService, type PlanLimits, type PlanUsage } from "./plan-limit.service.js";

export interface PlanSummary {
  plan: Pick<Plan, "key" | "name" | "maxUsers" | "maxBranches">;
  status: SubscriptionStatus;
  extraUsers: number;
  extraBranches: number;
  limits: PlanLimits;
  usage: PlanUsage;
}

export interface TenantPlanSummary extends PlanSummary {
  tenantId: string;
  tenantName: string;
}

export class PlanDowngradeError extends Error {}

const toPlan = ({ key, name, maxUsers, maxBranches }: Plan) => ({ key, name, maxUsers, maxBranches });

@singleton()
export class BillingService {
  constructor(
    private planDao: PlanDao,
    private subscriptionDao: SubscriptionDao,
    private planLimitService: PlanLimitService,
  ) {}

  async startSubscription(planKey: PlanKey, status: SubscriptionStatus): Promise<Subscription> {
    const plan = await this.requirePlan(planKey);
    return this.subscriptionDao.create({ planId: plan.id, status });
  }

  async getCurrent(): Promise<PlanSummary> {
    const subscription = await this.subscriptionDao.findCurrent();
    if (!subscription) throw new MissingSubscriptionError();
    return this.summarize(subscription);
  }

  async listPlans(): Promise<Plan[]> {
    return this.planDao.findAll();
  }

  async listTenants(): Promise<TenantPlanSummary[]> {
    const subscriptions = await allowSystemScope(() => this.subscriptionDao.findAllAcrossTenants());
    return Promise.all(
      subscriptions.map((subscription) =>
        runWithTenant(subscription.tenantId, async () => ({
          tenantId: subscription.tenant!.publicId,
          tenantName: subscription.tenant!.name,
          ...(await this.summarize(subscription)),
        })),
      ),
    );
  }

  // Bajar de plan o quitar extras solo procede si el uso actual ya cabe: nunca se
  // desactiva a nadie automáticamente.
  async assign(tenantPublicId: string, data: AssignSubscriptionDto): Promise<PlanSummary | null> {
    const found = await allowSystemScope(() => this.subscriptionDao.findByTenantPublicIdAcrossTenants(tenantPublicId));
    if (!found) return null;
    const plan = await this.requirePlan(data.planKey);

    return runWithTenant(found.tenantId, () =>
      runInTransaction(async () => {
        const current = await this.subscriptionDao.lockCurrent();
        if (!current) throw new MissingSubscriptionError();
        const next = {
          ...current,
          plan,
          extraUsers: data.extraUsers ?? current.extraUsers,
          extraBranches: data.extraBranches ?? current.extraBranches,
        } as Subscription;
        const limits = effectiveLimits(next);
        const usage = await this.planLimitService.usage();
        if (limits.users !== null && usage.users > limits.users) {
          throw new PlanDowngradeError(`El taller tiene ${usage.users} usuarios activos y el plan permite ${limits.users}`);
        }
        if (limits.branches !== null && usage.branches > limits.branches) {
          throw new PlanDowngradeError(`El taller tiene ${usage.branches} sucursales activas y el plan permite ${limits.branches}`);
        }
        const updated = await this.subscriptionDao.update(current.id, {
          planId: plan.id,
          extraUsers: next.extraUsers,
          extraBranches: next.extraBranches,
          status: data.status ?? current.status,
        });
        return this.summarize({ ...updated!, plan });
      }),
    );
  }

  private async requirePlan(key: PlanKey): Promise<Plan> {
    const plan = await this.planDao.findByKey(key);
    if (!plan) throw new Error(`Plan ${key} no existe`);
    return plan;
  }

  private async summarize(subscription: Subscription): Promise<PlanSummary> {
    return {
      plan: toPlan(subscription.plan!),
      status: subscription.status,
      extraUsers: subscription.extraUsers,
      extraBranches: subscription.extraBranches,
      limits: effectiveLimits(subscription),
      usage: await this.planLimitService.usage(),
    };
  }
}
