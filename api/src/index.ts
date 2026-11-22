import "reflect-metadata";
import express from "express";
import cors from "cors";
import AppDataSource from "./core/config/data-source.js";
import { optionalEnvNumber } from "./core/config/env.js";
import { registerRepositories } from "./core/di/register-repositories.js";
import { registerRoutes } from "./core/http/register-routes.js";
import { container } from "tsyringe";
import { ChatRetentionService } from "./messaging/chats/services/chat-retention.service.js";
import { WhatsappInboundQueueService } from "./messaging/whatsapp-official/services/whatsapp-inbound-queue.service.js";
import { WhatsappAutomationQueueService } from "./messaging/whatsapp-official/services/whatsapp-automation-queue.service.js";
import { PlatformAdminBootstrapService } from "./identity/auth/services/platform-admin-bootstrap.service.js";

const app = express();
const port = optionalEnvNumber("PORT", 3000);
const allowedOrigins = ["http://localhost:4300", "https://app.kaltra.local"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
// `verify` guarda el buffer crudo en req.rawBody -- lo necesita el webhook
// de WhatsApp (X-Hub-Signature-256 firma los bytes exactos, no el JSON
// re-serializado) sin montar un parser distinto solo para esa ruta.
app.use(
  express.json({
    verify: (req: express.Request, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

AppDataSource.initialize()
  .then(async () => {
    console.log("Base de datos conectada exitosamente");

    registerRepositories();
    const platformAdmin = await container.resolve(PlatformAdminBootstrapService).ensureFromEnv();
    if (platformAdmin === "created") console.log("Admin de plataforma creado desde PLATFORM_ADMIN_EMAIL");
    if (platformAdmin === "conflict") {
      console.warn("PLATFORM_ADMIN_EMAIL ya pertenece a un usuario que no es admin de plataforma: no se promueve");
    }
    registerRoutes(app);
    container.resolve(ChatRetentionService).start();

    const queues = [container.resolve(WhatsappInboundQueueService), container.resolve(WhatsappAutomationQueueService)];
    queues.forEach((queue) => queue.start());
    // worker.close() espera a que terminen los jobs en curso; sin esto un
    // deploy los corta y quedan "stalled" hasta que otro worker los retome.
    const shutdown = async (signal: string) => {
      console.log(`${signal} recibido, cerrando colas`);
      await Promise.allSettled(queues.map((queue) => queue.stop()));
      process.exit(0);
    };
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    process.once("SIGINT", () => void shutdown("SIGINT"));

    app.get("/", (_req, res) => {
      res.status(200).json({
        service: "repairops-api",
        status: "ok",
      });
    });

    app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "healthy",
      });
    });

    app.listen(port, "0.0.0.0", () => {
      console.log(
        `Servidor escuchando en el puerto ${port}`,
      );
    });
  })
  .catch((error) => {
    console.error("Error al conectar la base de datos:", error);
    process.exit(1);
  });
