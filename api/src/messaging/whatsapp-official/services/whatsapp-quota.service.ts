import { singleton } from "tsyringe";
import { WhatsappAccountDao } from "../daos/whatsapp-account.dao.js";
import { WhatsappOutboundMessageDao } from "../daos/whatsapp-outbound-message.dao.js";
import { WhatsappMessagePackageDao } from "../daos/whatsapp-message-package.dao.js";
import { SubscriptionDao } from "../../../app_platform/billing/daos/subscription.dao.js";
import { MissingSubscriptionError } from "../../../app_platform/billing/services/plan-limit.service.js";
import { PlanLimitReachedError } from "../../../app_platform/billing/errors/plan-limit-reached.error.js";

// Mientras dura el trial (14 días, ver auth.service.ts), 50 mensajes es el
// tope sin importar el plan elegido -- se ignora whatsapp_monthly_quota del
// plan y no admite paquete extra.
const TRIAL_WHATSAPP_QUOTA = 50;

@singleton()
export class WhatsappQuotaService {
  constructor(
    private whatsappAccountDao: WhatsappAccountDao,
    private subscriptionDao: SubscriptionDao,
    private whatsappOutboundMessageDao: WhatsappOutboundMessageDao,
    private whatsappMessagePackageDao: WhatsappMessagePackageDao,
  ) {}

  // Llamar antes de cualquier envío real a Meta (sendTemplate/sendFreeText) --
  // lanza PlanLimitReachedError('whatsapp_messages', ...) si ya se agotó.
  async assertCanSend(): Promise<void> {
    const account = await this.whatsappAccountDao.findByTenant();
    // Cuenta propia (o sin cuenta todavía, lo bloquea otro gate más arriba): sin límite.
    if (!account?.ownedByPlatform) return;

    const subscription = await this.subscriptionDao.findCurrent();
    if (!subscription) throw new MissingSubscriptionError();

    if (subscription.status === "trialing") {
      const used = await this.whatsappOutboundMessageDao.countSentSince(subscription.createdAt);
      if (used >= TRIAL_WHATSAPP_QUOTA) {
        throw new PlanLimitReachedError("whatsapp_messages", TRIAL_WHATSAPP_QUOTA, used);
      }
      return;
    }

    const quota = subscription.plan!.whatsappMonthlyQuota;
    if (quota === null) return;

    const periodStart = subscription.currentPeriodStart ?? subscription.createdAt;
    const [used, extra] = await Promise.all([
      this.whatsappOutboundMessageDao.countSentSince(periodStart),
      this.whatsappMessagePackageDao.sumGrantedSince(periodStart),
    ]);
    const limit = quota + extra;
    if (used >= limit) {
      throw new PlanLimitReachedError("whatsapp_messages", limit, used);
    }
  }
}
