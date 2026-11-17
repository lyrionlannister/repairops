import "reflect-metadata";
import express from "express";
import cors from "cors";
import AppDataSource from "./core/config/data-source.js";
import { optionalEnvNumber } from "./core/config/env.js";
import { registerRepositories } from "./core/di/register-repositories.js";
import { registerRoutes } from "./core/http/register-routes.js";
import { container } from "tsyringe";
import { ChatRetentionService } from "./messaging/chats/services/chat-retention.service.js";

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
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);

AppDataSource.initialize()
  .then(async () => {
    console.log("Base de datos conectada exitosamente");

    registerRepositories();
    registerRoutes(app);
    container.resolve(ChatRetentionService).start();

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
        `Servidor de atención al cliente escuchando en el puerto ${port}`,
      );
    });
  })
  .catch((error) => {
    console.error("Error al conectar la base de datos:", error);
    process.exit(1);
  });
