import { Redis } from "ioredis";

const redisHost = process.env.REDIS_HOST ?? "redis";
const redisPort = parseInt(process.env.REDIS_PORT ?? "6379", 10);
const redisUser = process.env.REDIS_USER ?? undefined;
const redisPassword = process.env.REDIS_PASSWORD ?? undefined;

export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  username: redisUser,
  password: redisPassword,
  lazyConnect: true,
});

redisClient.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

redisClient.on("connect", () => {
  console.log(`Redis conectado en ${redisHost}:${redisPort}`);
});
