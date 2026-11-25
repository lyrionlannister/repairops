import { Router, type NextFunction, type Request, type Response } from "express";
import { MessageTemplateDao } from "../message-templates/daos/message-template.dao.js";
import { PriceListDao } from "../../commerce/price-list/daos/price-list.dao.js";
import { RepairNoteDao } from "../../commerce/repair-notes/daos/repair-note.dao.js";
import { RepairNoteDeviceDao } from "../../commerce/repair-notes/daos/repair-note-device.dao.js";
import { toDeviceView } from "../../commerce/repair-notes/utils/devices.js";
import { runWithTenant } from "../../core/tenancy/tenant-context.js";
import { env } from "../../core/config/env.js";
import AppDataSource from "../../core/config/data-source.js";
import { UUID } from "../../core/http/public-id/public-id-metadata.js";

/**
 * Endpoints de consumo interno desde n8n, por tenant.
 *
 * No llevan JWT (n8n no tiene sesion de usuario) pero si exigen un secreto
 * compartido (X-Internal-Token) para no quedar abiertos a cualquiera que
 * adivine la ruta -- el comentario anterior ("solo accesibles dentro de la
 * red Docker") no estaba garantizado por nada a nivel de nginx/compose.
 *
 * El tenant NUNCA viaja en la URL: el `tenantId` interno (bigint
 * secuencial, enumerable) que antes iba en el path se reemplazo por el
 * public_id del tenant en el header `X-Tenant-Public-Id`, validado contra
 * la base de datos. Sin tenant valido, 401.
 *
 * CAMBIO PARA LOS WORKFLOWS DE n8n (viven fuera de este repo, en la
 * instancia de n8n): en cada llamada a /api/v1/n8n/*, quitar el
 * `/:tenantId` del path y mandar el header `X-Tenant-Public-Id` con el
 * public_id (uuid) del taller. El secreto `X-Internal-Token` se sigue
 * mandando igual. Rutas nuevas:
 * - GET /api/v1/n8n/message-templates/:key
 * - GET /api/v1/n8n/products/search?model=...
 * - GET /api/v1/n8n/repair-notes/:controlNumber
 */
export const TENANT_PUBLIC_ID_HEADER = "x-tenant-public-id";

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const expected = env("N8N_INTERNAL_TOKEN");
  if (!expected) {
    res.status(500).json({ error: "N8N_INTERNAL_TOKEN no configurado" });
    return;
  }
  if (req.headers["x-internal-token"] !== expected) {
    res.status(401).json({ error: "Token interno invalido" });
    return;
  }
  next();
}

// Resuelve el public_id del header al id interno del tenant, o null si el
// formato no es uuid o el tenant no existe. El secreto compartido es global
// y no identifica tenant, así que esta es la única validación que ata la
// llamada a un taller concreto.
export async function resolveTenantInternalId(publicId: string): Promise<string | null> {
  if (!UUID.test(publicId)) return null;
  const rows: Array<{ id: string }> = await AppDataSource.query(
    `SELECT id::text AS "id" FROM tenants WHERE public_id = $1`,
    [publicId],
  );
  return rows[0]?.id ?? null;
}

// Despues de requireInternalToken: exige el header con el public_id del
// tenant, lo valida contra la base y deja el tenant en contexto para toda
// la cadena (los Dao ya filtran por el). Sin tenant valido, 401.
export async function requireTenantFromHeader(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers[TENANT_PUBLIC_ID_HEADER];
    const publicId = Array.isArray(header) ? header[0] : header;
    const tenantId = publicId ? await resolveTenantInternalId(publicId) : null;
    if (!tenantId) {
      res.status(401).json({ error: "Tenant inválido o no especificado" });
      return;
    }
    // next() se invoca dentro del contexto: los handlers que dispara corren
    // con este tenant aunque sean async (mismo criterio que tenantMiddleware).
    runWithTenant(tenantId, () => {
      next();
    });
  } catch (error) {
    next(error);
  }
}

export const createN8nPublicRouter = (
  messageTemplateDao: MessageTemplateDao,
  priceListDao: PriceListDao,
  repairNoteDao: RepairNoteDao,
  repairNoteDeviceDao: RepairNoteDeviceDao,
): Router => {
  const router = Router();
  router.use(requireInternalToken);
  router.use(requireTenantFromHeader);

  router.get("/message-templates/:key", async (req, res) => {
    try {
      const template = await messageTemplateDao.findByKey(req.params.key);
      if (!template) {
        res.status(404).json({ error: "Template no encontrado", key: req.params.key });
        return;
      }
      res.status(200).json({ key: template.key, text: template.text });
    } catch (error) {
      console.error("Error obteniendo template para n8n:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  router.get("/products/search", async (req, res) => {
    try {
      const model = (req.query.model as string | undefined)?.trim();
      const supplier = (req.query.supplier as string | undefined)?.toLowerCase().trim();

      if (!model) {
        res.status(400).json({ error: "El parámetro 'model' es requerido" });
        return;
      }

      let items = await priceListDao.searchByModel(model);

      if (supplier) {
        items = items.filter((item) => item.supplier.name.toLowerCase().includes(supplier));
      }

      res.status(200).json(
        items.map((i) => ({
          brand: i.brand,
          model: i.model,
          price: Number(i.price),
          supplier: i.supplier.name,
        })),
      );
    } catch (error) {
      console.error("Error buscando productos para n8n:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  router.get("/repair-notes/:controlNumber", async (req, res) => {
    try {
      const controlNumber = parseInt(req.params.controlNumber, 10);
      if (isNaN(controlNumber)) {
        res.status(400).json({ error: "Número de nota inválido", exists: false });
        return;
      }

      const note = await repairNoteDao.findByControlNumber(controlNumber);
      const devices = note
        ? (await repairNoteDeviceDao.findByRepairNoteIds([note.id])).map((device) =>
            toDeviceView(device),
          )
        : [];

      if (!note) {
        res.status(200).json({ exists: false });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let isInWarrantyRange = false;
      if (note.hasWarranty && note.deliveryDate) {
        const delivery = new Date(note.deliveryDate);
        if (note.hasExtendedWarranty && note.extendedWarrantyDays) {
          const expiresAt = new Date(delivery);
          expiresAt.setDate(expiresAt.getDate() + note.extendedWarrantyDays);
          isInWarrantyRange = today <= expiresAt;
        } else {
          const thirtyDaysAfter = new Date(delivery);
          thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);
          isInWarrantyRange = today <= thirtyDaysAfter;
        }
      }

      res.status(200).json({
        exists: true,
        hasWarranty: note.hasWarranty,
        hasExtendedWarranty: note.hasExtendedWarranty,
        extendedWarrantyDays: note.extendedWarrantyDays ?? null,
        deliveryDate: note.deliveryDate ?? null,
        isInWarrantyRange,
        customerName: note.customerName,
        brand: devices[0]?.brand ?? null,
        model: devices.map((d) => d.model).join(", "),
        devices: devices.map(({ brand, model }) => ({ brand, model })),
      });
    } catch (error) {
      console.error("Error consultando nota para n8n:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  return router;
};
