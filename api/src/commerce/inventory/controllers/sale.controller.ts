import { singleton } from "tsyringe";
import { Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SaleService } from "../services/sale.service.js";
import { CreateSaleDto } from "../dtos/create-sale.dto.js";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { readPageQuery } from "../../../core/common/utils/page-query.js";
import type { SaleFilters } from "../types/sale-page.types.js";

@singleton()
export class SaleController {
  constructor(
    private service: SaleService,
    private branchAccess: BranchAccessService,
  ) {}

  getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const filters = await this.filtersOf(req);
      const page = await readPageQuery(req.query);
      if (page) {
        res.status(200).json(await this.service.getPage({ ...filters, search: page.search }, page));
        return;
      }
      res.status(200).json(await this.service.getAll(filters.branchId, filters.customerId));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const currentMonthOnly = queryString(req.query["period"]) === "month";
      res.status(200).json(await this.service.getStats(await this.filtersOf(req), currentMonthOnly));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  private async filtersOf(req: AuthenticatedRequest): Promise<SaleFilters> {
    return {
      branchId: await this.branchAccess.resolveReadBranch(queryString(req.query["branchId"])),
      customerId: queryString(req.query["customerId"]) || undefined,
      createdByEmployeeId: queryString(req.query["employeeId"]) || undefined,
    };
  }

  getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sale = await this.service.getById(req.params["id"] as string);
      if (!sale) {
        res.status(404).json({ error: "Venta no encontrada" });
        return;
      }
      const [items, payments] = await Promise.all([
        this.service.getItems(sale.id),
        this.service.getPayments(sale.id),
      ]);
      res.status(200).json({ ...sale, items, payments });
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateSaleDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      dto.localId = await this.branchAccess.resolveWriteBranch(dto.localId);
      const sale = await this.service.create(dto, req.user!.roles ?? []);
      res.status(201).json(sale);
    } catch (error) {
      sendError(res, error, 400);
    }
  };
}
