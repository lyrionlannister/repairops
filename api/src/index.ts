import "reflect-metadata";
import express from "express";
import cors from "cors";
import AppDataSource from "./core/config/data-source.js";
import ChatMemoryDataSource from "./core/config/chat-memory-data-source.js";
import { optionalEnvNumber } from "./core/config/env.js";
import { registerRepositories } from "./core/di/register-repositories.js";
import { registerRoutes } from "./core/http/register-routes.js";

const app = express();
const port = optionalEnvNumber("PORT", 3000);
const allowedOrigins = ["http://localhost:4300", "https://app.kaltra.local"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

Promise.all([AppDataSource.initialize(), ChatMemoryDataSource.initialize()])
  .then(async () => {
    console.log("Bases de datos conectadas exitosamente");

    registerRepositories();
    registerRoutes(app);

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
    console.error("Error al conectar las bases de datos:", error);
    process.exit(1);
  });
