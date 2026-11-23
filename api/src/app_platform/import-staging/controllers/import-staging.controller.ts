import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ImportStagingService } from "../services/import-staging.service.js";
import { triggerImportStagingWorkflow } from "../trigger-workflow.js";
import { UpdateStagingRowsDto } from "../dtos/update-staging-rows.dto.js";
import { ImportStagingCallbackDto } from "../dtos/import-staging-callback.dto.js";
import { ImportStagingProgressDto } from "../dtos/import-staging-progress.dto.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";
import { sendError } from "../../../core/http/error-response.js";
import type { StagingRecord } from "../types.js";

const SUPPORTED_EXTENSIONS = /\.(pdf|xlsx|xls)$/i;
const SSE_POLL_MS = 700;
const SSE_HEARTBEAT_MS = 15_000;
const SSE_TIMEOUT_MS = 10 * 60 * 1000;

@singleton()
export class ImportStagingController {
  constructor(private service: ImportStagingService) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: "No se recibió ningún archivo" });
        return;
      }
      const { supplierId } = req.query;
      if (!supplierId || typeof supplierId !== "string") {
        res.status(400).json({ error: "Se requiere el proveedor" });
        return;
      }

      const fileName = typeof req.query.fileName === "string" ? req.query.fileName : "";
      if (!SUPPORTED_EXTENSIONS.test(fileName)) {
        res
          .status(400)
          .json({ error: "Formato no soportado: sube un PDF o un Excel (.xlsx, .xls)" });
        return;
      }

      const started = await this.service.startUpload(supplierId);
      if (!started) {
        res.status(404).json({ error: "Proveedor no encontrado" });
        return;
      }
      const { importId, tenantId } = started;

      try {
        await triggerImportStagingWorkflow({ tenantId, importId, fileName, fileBuffer: req.body });
      } catch (error) {
        console.error("[import-staging] Error disparando workflow n8n:", error);
        await this.service.discard(importId);
        res
          .status(502)
          .json({ error: "El servicio de importación no está disponible, intenta de nuevo" });
        return;
      }

      res.status(202).json({ importId, status: "processing" });
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await this.service.getById(req.params["importId"] as string);
      if (!record) {
        res.status(404).json({ error: "Staging no encontrado o expirado" });
        return;
      }
      res.status(200).json(record);
    } catch (error) {
      sendError(res, error, 500);
    }
  };

  // Un solo flujo de eventos: manda el estado cada vez que cambia y cierra la
  // conexion en cuanto deja de estar "processing" (o por timeout/corte del
  // cliente). Reemplaza el polling que hacia el cliente antes.
  events = async (req: Request, res: Response): Promise<void> => {
    const importId = req.params["importId"] as string;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    let lastSent = "";
    let lastWriteAt = Date.now();
    const send = (record: StagingRecord | { status: "processing" | "error"; error?: string }) => {
      const payload = JSON.stringify(record);
      if (payload === lastSent) return;
      lastSent = payload;
      lastWriteAt = Date.now();
      res.write(`data: ${payload}\n\n`);
    };

    const startedAt = Date.now();
    const interval = setInterval(async () => {
      try {
        const record = await this.service.getById(importId);
        if (!record) {
          send({ status: "error", error: "Staging no encontrado o expirado" });
          clearInterval(interval);
          res.end();
          return;
        }
        send(record);
        if (record.status !== "processing") {
          clearInterval(interval);
          res.end();
          return;
        }
        if (Date.now() - startedAt > SSE_TIMEOUT_MS) {
          send({ status: "error", error: "Tiempo de espera agotado" });
          clearInterval(interval);
          res.end();
          return;
        }
        // Mientras no hay nada nuevo que avisar, un comentario SSE cada
        // SSE_HEARTBEAT_MS mantiene viva la conexion a traves de nginx (que
        // corta un proxy inactivo a los 60s por default) sin disparar
        // onmessage en el cliente.
        if (Date.now() - lastWriteAt > SSE_HEARTBEAT_MS) {
          lastWriteAt = Date.now();
          res.write(`: keep-alive\n\n`);
        }
      } catch (error) {
        console.error("[import-staging] Error en stream de progreso:", error);
        clearInterval(interval);
        res.end();
      }
    }, SSE_POLL_MS);

    req.on("close", () => clearInterval(interval));
  };

  updateRows = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(UpdateStagingRowsDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      const record = await this.service.updateRows(req.params["importId"] as string, dto.rows);
      if (!record) {
        res.status(404).json({ error: "Staging no encontrado o expirado" });
        return;
      }
      res.status(200).json(record);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  commit = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.commit(req.params["importId"] as string);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  discard = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.discard(req.params["importId"] as string);
      res.status(200).json({ message: "Staging descartado" });
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  progress = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(ImportStagingProgressDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      await this.service.applyProgress(
        dto.tenantId,
        dto.importId,
        dto.chunksTotal,
        dto.itemsInChunk,
      );
      res.status(200).json({ ok: true });
    } catch (error) {
      sendError(res, error, 400);
    }
  };

  callback = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(ImportStagingCallbackDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: flattenValidationErrors(errors) });
        return;
      }
      if (!dto.rows && !dto.error) {
        res.status(400).json({ error: "Se requiere rows o error" });
        return;
      }
      await this.service.applyCallback(
        dto.tenantId,
        dto.importId,
        dto.error ? { error: dto.error } : { rows: dto.rows! },
      );
      res.status(200).json({ ok: true });
    } catch (error) {
      sendError(res, error, 400);
    }
  };
}
