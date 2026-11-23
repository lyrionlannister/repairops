import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { QueryFailedError } from "typeorm";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { BaseDao } from "../../../core/daos/base.dao.js";
import { StripeWebhookEvent } from "../entities/stripe-webhook-event.entity.js";

@singleton()
export class StripeWebhookEventDao extends BaseDao<StripeWebhookEvent> {
  constructor(
    @inject(repositoryToken(StripeWebhookEvent)) repository: Repository<StripeWebhookEvent>,
  ) {
    super(repository);
  }

  // Insert-first: si el evento ya se procesó, el UNIQUE sobre stripe_event_id
  // choca y acá se traduce a "ya se procesó" en vez de dejar escapar el error
  // de Postgres -- nunca reprocesar un reintento de Stripe.
  async claim(stripeEventId: string, type: string): Promise<boolean> {
    try {
      await this.repository.insert({ stripeEventId, type });
      return true;
    } catch (error) {
      if (error instanceof QueryFailedError && (error as { code?: string }).code === "23505") {
        return false;
      }
      throw error;
    }
  }
}
