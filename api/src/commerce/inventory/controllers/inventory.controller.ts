import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { InventoryService } from "../services/inventory.service.js";
import { LayawayService } from "../../customers/services/layaway.service.js";
import { CreateInventoryItemDto } from "../dtos/create-inventory-item.dto.js";
import { RegisterMovementDto } from "../dtos/register-movement.dto.js";
import { parseInventoryImportFile } from "../utils/inventory-import-parser.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { readLookupQuery, readPageQuery } from "../../../core/common/utils/page-query.js";
import type { InventoryFilters } from "../types/inventory-page.types.js";

@singleton()
export class InventoryController {
  constructor(
    private service: InventoryService,
    private branchAccess: BranchAccessService,
    private layawayService: LayawayService,
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.filtersOf(req);
      const page = await readPageQuery(req.query);
      // Un apartado vencido deja de reservar: se expira antes de calcular el disponible.
      await this.layawayService.expireAllDue();
      if (page) {
        res.status(200).json(await this.service.getPage({ ...filters, search: page.search }, page));
        return;
      }
      res.status(200).json(await this.service.getAllWithAvailability(filters.branchId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  lookup = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.filtersOf(req);
      const { search, limit } = await readLookupQuery(req.query);
      await this.layawayService.expireAllDue();
      res.status(200).json(await this.service.lookup({ ...filters, search }, limit));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getStats(await this.filtersOf(req)));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  private async filtersOf(req: Request): Promise<InventoryFilters> {
    return {
      branchId: await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"])),
      supplierId: queryString(req.query["supplierId"]) || undefined,
      criticalOnly: queryString(req.query["stock"]) === "critical",
    };
  }

  getBySku = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.getBySku(req.params["sku"] as string);
      if (!item) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getLowStock = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getLowStock());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.getById(req.params["id"] as string);
      if (!item) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateInventoryItemDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      dto.localId = await this.branchAccess.resolveWriteBranch(dto.localId);
      res.status(201).json(await this.service.create(dto));
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.update(req.params["id"] as string, req.body);
      if (!item) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.service.delete(req.params["id"] as string);
      if (!deleted) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.status(200).json({ message: "Producto eliminado" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getMovements = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const page = await readPageQuery(req.query);
      res.status(200).json(page ? await this.service.getMovementsPage(id, page) : await this.service.getMovements(id));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  bulkImport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: "No se recibió ningún archivo" });
        return;
      }
      const { localId } = req.query;
      if (!localId || typeof localId !== "string") {
        res.status(400).json({ error: "Se requiere la sucursal" });
        return;
      }

      const { rows, errors } = parseInventoryImportFile(req.body);
      if (errors.length > 0) {
        res.status(400).json({ error: "El archivo tiene errores", details: errors });
        return;
      }
      if (rows.length === 0) {
        res.status(400).json({ error: "El archivo no tiene filas para importar" });
        return;
      }

      res.status(200).json(await this.service.bulkImport(localId, rows));
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  registerMovement = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RegisterMovementDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const movement = await this.service.registerMovement({
        inventoryItemId: req.params["id"] as string,
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason,
      });
      res.status(201).json(movement);
    } catch (error) {
      sendError(res, error, 400);
    }
  };
}
