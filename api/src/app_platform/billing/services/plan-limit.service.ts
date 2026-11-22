import { singleton } from "tsyringe";
import { runInTransaction } from "../../../core/database/transaction-context.js";
import { UserDao } from "../../../identity/auth/daos/user.dao.js";
import { BranchDao } from "../../../identity/branches/daos/branch.dao.js";
import { SubscriptionDao } from "../daos/subscription.dao.js";
import type { Subscription } from "../entities/subscription.entity.js";
import { PlanLimitReachedError, type PlanResource } from "../errors/plan-limit-reached.error.js";

export class MissingSubscriptionError extends Error {
  constructor() {
    super("El taller no tiene un plan asignado");
  }
}

export interface PlanUsage {
  users: number;
  branches: number;
}

export interface PlanLimits {
  users: number | null;
  branches: number | null;
}

// null = sin límite; los extras solo suman sobre un límite numérico.
export function effectiveLimits(subscription: Subscription): PlanLimits {
  const plan = subscription.plan;
  if (!plan) throw new Error("La suscripción no trae su plan");
  return {
    users: plan.maxUsers === null ? null : plan.maxUsers + subscription.extraUsers,
    branches: plan.maxBranches === null ? null : plan.maxBranches + subscription.extraBranches,
  };
}

@singleton()
export class PlanLimitService {
  constructor(
    private subscriptionDao: SubscriptionDao,
    private userDao: UserDao,
    private branchDao: BranchDao,
  ) {}

  async usage(): Promise<PlanUsage> {
    const [users, branches] = await Promise.all([this.userDao.countActive(), this.branchDao.countActive()]);
    return { users, branches };
  }

  // fn corre en la misma transacción que bloquea la suscripción del taller: dos altas
  // simultáneas esperan una a la otra, y la segunda ya cuenta la fila de la primera.
  async withCapacity<T>(resource: PlanResource, fn: () => Promise<T>): Promise<T> {
    return runInTransaction(async () => {
      const subscription = await this.subscriptionDao.lockCurrent();
      if (!subscription) throw new MissingSubscriptionError();
      const limit = effectiveLimits(subscription)[resource];
      if (limit !== null) {
        const used = resource === "users" ? await this.userDao.countActive() : await this.branchDao.countActive();
        if (used >= limit) throw new PlanLimitReachedError(resource, limit, used);
      }
      return fn();
    });
  }
}
