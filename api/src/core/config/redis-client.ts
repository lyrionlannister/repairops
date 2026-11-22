import { Redis } from "ioredis";
import { env, optionalEnv, optionalEnvNumber } from "./env.js";

const redisHost = optionalEnv("REDIS_HOST", "redis");
const redisPort = optionalEnvNumber("REDIS_PORT", 6379);
const redisUser = env("REDIS_USER");
const redisPassword = env("REDIS_PASSWORD");

export const redisConnectionOptions = {
  host: redisHost,
  port: redisPort,
  username: redisUser,
  password: redisPassword,
};

export const redisClient = new Redis({ ...redisConnectionOptions, lazyConnect: true });

redisClient.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

redisClient.on("connect", () => {
  console.log(`Redis conectado en ${redisHost}:${redisPort}`);
});
