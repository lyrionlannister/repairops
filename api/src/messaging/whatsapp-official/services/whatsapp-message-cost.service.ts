import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { WhatsappOutboundMessageDao } from "../daos/whatsapp-outbound-message.dao.js";
import { WhatsappMetaPricingDao } from "../daos/whatsapp-meta-pricing.dao.js";
import type { WhatsappStatusUpdate } from "../helpers/whatsapp-webhook.helpers.js";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";

// Convierte un status de Meta (ver extractStatusUpdates) en el costo real
// que le cobra a la plataforma, para el dashboard de gasto por tenant
// (BillingDashboardService). No bloquea ni reintenta el webhook: un status
// que no matchea ningun mensaje propio (plantilla vieja, cuenta de otro
// ambiente) o sin categoria de costo simplemente no actualiza nada.
@singleton()
export class WhatsappMessageCostService {
  constructor(
    private outboundMessageDao: WhatsappOutboundMessageDao,
    private pricingDao: WhatsappMetaPricingDao,
  ) {}

  async recordStatusUpdate(update: WhatsappStatusUpdate): Promise<void> {
    if (!update.category) return;

    const message = await allowSystemScope(() =>
      this.outboundMessageDao.findByMetaMessageIdAcrossTenants(update.messageId),
    );
    if (!message) return;

    const pricing = await this.pricingDao.findByCategory(update.category);
    // Costo nulo si la categoria no esta en el catalogo todavia: se guarda la
    // categoria igual (para saber que paso), el monto se completa cuando se
    // actualice whatsapp_meta_pricing.
    const costUsd = pricing ? new Decimal(pricing.costUsd).toFixed(4) : null;

    await runWithTenant(message.tenantId, () =>
      this.outboundMessageDao.update(message.id, {
        conversationCategory: update.category,
        billable: update.billable,
        metaCostUsd: costUsd,
      }),
    );
  }
}
