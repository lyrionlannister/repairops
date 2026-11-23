import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { ServiceTypeDao } from "../daos/service-type.dao.js";
import { ServiceType } from "../entities/service-type.entity.js";
import { toMoneyOrNull } from "../../../core/common/utils/money.js";

// Defaults sembrados por tenant: los 5 historicos (ya eran booleans en
// repair_notes) + Software/Sistema (fallas de SO, pedido explicito del
// cliente). El tenant puede agregar mas desde la UI.
const SEED_SERVICE_TYPES = [
  "Reparación",
  "Mantenimiento",
  "Diagnóstico",
  "Revisión",
  "Mojado",
  "Software",
  "Sistema",
];

@singleton()
export class ServiceTypeService {
  constructor(private dao: ServiceTypeDao) {}

  async getAll(): Promise<ServiceType[]> {
    return this.dao.findAllOrdered();
  }

  async create(name: string, basePrice?: Decimal.Value | null): Promise<ServiceType> {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new BusinessError("El nombre del tipo de servicio es obligatorio");
    }
    if (basePrice !== undefined && basePrice !== null && new Decimal(basePrice).lessThan(0)) {
      throw new BusinessError("El precio base no puede ser negativo");
    }
    const existing = await this.dao.findByName(trimmed);
    if (existing) return existing;
    return this.dao.create({ name: trimmed, basePrice: toMoneyOrNull(basePrice) });
  }

  async seed(): Promise<void> {
    for (const name of SEED_SERVICE_TYPES) {
      const existing = await this.dao.findByName(name);
      if (!existing) {
        await this.dao.create({ name });
      }
    }
  }
}
