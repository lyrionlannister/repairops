import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BillingService } from "../services/billing.service.js";
import {
  BillingDashboardService,
  DASHBOARD_PERIOD_DAYS,
  type DashboardPeriodDays,
} from "../services/billing-dashboard.service.js";
import { AssignSubscriptionDto } from "../dtos/assign-subscription.dto.js";
import { SelectPlanDto } from "../dtos/select-plan.dto.js";
import { WHATSAPP_PACKAGE_SIZES, type WhatsappPackageSize } from "../constants.js";
import { sendError } from "../../../core/http/error-response.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";

@singleton()
export class BillingController {
  constructor(
    private service: BillingService,
    private dashboardService: BillingDashboardService,
  ) {}

  getPlan = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getCurrent());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  listPlans = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.listPlans());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  listPublicPlans = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.listPublicPlans());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  listTenants = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.listTenants());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  assignSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(AssignSubscriptionDto, req.body ?? {});
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const summary = await this.service.assign(req.params["tenantId"] as string, dto);
      if (!summary) {
        res.status(404).json({ error: "Taller no encontrado" });
        return;
      }
      res.status(200).json(summary);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  selectPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(SelectPlanDto, req.body ?? {});
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const checkoutUrl = await this.service.selectPlan(dto.planKey, dto.billingInterval);
      res.status(200).json({ checkoutUrl });
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  buyWhatsappPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const size = Number(req.params["size"]);
      if (!WHATSAPP_PACKAGE_SIZES.includes(size as WhatsappPackageSize)) {
        res.status(400).json({ error: "Paquete de mensajes inválido" });
        return;
      }
      const checkoutUrl = await this.service.createWhatsappPackageCheckout(
        size as WhatsappPackageSize,
      );
      res.status(200).json({ checkoutUrl });
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  listWhatsappPackages = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.listWhatsappPackages());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  createPortalSession = async (_req: Request, res: Response): Promise<void> => {
    try {
      const url = await this.service.createCustomerPortalSession();
      res.status(200).json({ url });
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  getOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const requested = Number(req.query["days"]);
      const days = (
        DASHBOARD_PERIOD_DAYS.includes(requested as DashboardPeriodDays) ? requested : 30
      ) as DashboardPeriodDays;
      res.status(200).json(await this.dashboardService.getOverview(days));
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
