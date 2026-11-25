import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CustomerService } from "../services/customer.service.js";
import { CustomerDebtService } from "../services/customer-debt.service.js";
import { CustomerCreditService } from "../services/customer-credit.service.js";
import { CustomerPaymentService } from "../services/customer-payment.service.js";
import { RegisterCustomerPaymentDto } from "../dtos/register-customer-payment.dto.js";
import { BranchAccessService } from "../../../identity/branches/services/branch-access.service.js";
import { flattenValidationErrors as validationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError, queryString } from "../../../core/http/error-response.js";
import { readLookupQuery, readPageQuery } from "../../../core/common/utils/page-query.js";
import type { CustomerCreditFilter } from "../types/customer-page.types.js";

const creditFilterOf = (value: string | undefined): CustomerCreditFilter | undefined =>
  value === "pending" || value === "overdue" ? value : undefined;

@singleton()
export class CustomerController {
  constructor(
    private service: CustomerService,
    private debtService: CustomerDebtService,
    private creditService: CustomerCreditService,
    private paymentService: CustomerPaymentService,
    private branchAccess: BranchAccessService,
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = await readPageQuery(req.query);
      if (page) {
        const credit = creditFilterOf(queryString(req.query["credit"]));
        res.status(200).json(await this.creditService.listPage(page, credit));
        return;
      }
      res.status(200).json(await this.creditService.listWithCredit());
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  lookup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, limit } = await readLookupQuery(req.query);
      res.status(200).json(await this.service.lookup(search, limit));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await this.service.getById(req.params["id"] as string);
      if (!customer) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.status(200).json(customer);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getDeviceHistory(req.params["id"] as string));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getCreditBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const balance = await this.service.getCreditBalance(req.params["id"] as string);
      if (!balance) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.status(200).json(balance);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getDebts = async (req: Request, res: Response): Promise<void> => {
    try {
      const debts = await this.debtService.getDebts(req.params["id"] as string);
      if (!debts) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.status(200).json(debts);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      if (!(await this.service.getById(id))) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.status(200).json(await this.paymentService.getByCustomerId(id));
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  registerPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RegisterCustomerPaymentDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: validationErrors(errors) });
        return;
      }
      const localId = await this.branchAccess.resolveWriteBranch(dto.localId);
      const payment = await this.paymentService.register({
        customerId: req.params["id"] as string,
        localId,
        amount: dto.amount,
        method: dto.method,
      });
      res.status(201).json(payment);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await this.service.create(req.body);
      res.status(201).json(customer);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const customer = await this.service.update(id, req.body);
      if (!customer) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.status(200).json(customer);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const deleted = await this.service.delete(id);
      if (!deleted) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.status(200).json({ message: "Cliente eliminado" });
    } catch (error) {
      sendError(res, error, 500);
    }
  };
}
