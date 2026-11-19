import net from "node:net";
import http from "node:http";
import { optionalEnv, optionalEnvNumber } from "../config/env.js";

// podman-compose no serializa de forma confiable `depends_on: condition:
// service_healthy` al arrancar todo desde cero con `up -d` (el orden de
// arranque sigue el orden de declaracion en el yaml, no el grafo de
// dependencias, asi que api puede arrancar antes de que postgres/automation
// existan siquiera como contenedores corriendo). Esto reintenta la conexion
// real en vez de confiar en esa garantia del compose.
const TOTAL_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 1000;

async function waitForTcp(host: string, port: number, label: string): Promise<void> {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve(true);
      });
      socket.on("error", () => resolve(false));
      socket.setTimeout(3000, () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (ok) {
      console.log(`${label} listo (${host}:${port})`);
      return;
    }
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  throw new Error(`${label} no respondio en ${host}:${port} tras ${TOTAL_TIMEOUT_MS}ms`);
}

async function waitForHttp(url: string, label: string): Promise<void> {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((resolve) => {
      const req = http.get(url, { timeout: 3000 }, (res) => {
        res.resume();
        resolve((res.statusCode ?? 0) < 500);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) {
      console.log(`${label} listo (${url})`);
      return;
    }
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  throw new Error(`${label} no respondio en ${url} tras ${TOTAL_TIMEOUT_MS}ms`);
}

try {
  await waitForTcp(
    optionalEnv("DB_HOST", "localhost"),
    optionalEnvNumber("DB_PORT", 5432),
    "Postgres",
  );
  await waitForTcp(
    optionalEnv("REDIS_HOST", "redis"),
    optionalEnvNumber("REDIS_PORT", 6379),
    "Redis",
  );
  await waitForHttp(
    `http://${optionalEnv("AUTOMATION_HOST", "automation")}:${optionalEnvNumber("AUTOMATION_PORT", 5678)}/healthz`,
    "n8n",
  );
  process.exit(0);
} catch (error) {
  console.error(String(error));
  process.exit(1);
}
