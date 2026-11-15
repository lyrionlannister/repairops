import "reflect-metadata";
import { DataSource } from "typeorm";
import { ChatHistory } from "../../messaging/chats/entities/chat-history.entity.js";
import { optionalEnv, optionalEnvNumber } from "./env.js";

const ChatMemoryDataSource = new DataSource({
  type: "postgres",
  host: optionalEnv("DB_HOST", "localhost"),
  port: optionalEnvNumber("DB_PORT", 5432),
  username: optionalEnv("DB_USERNAME", "n8n"),
  password: optionalEnv("DB_PASSWORD", "n8n_password_dev"),
  database: optionalEnv("N8N_DB_DATABASE", "n8n"),
  synchronize: false,
  logging: optionalEnv("NODE_ENV", "production") === "development",
  entities: [ChatHistory],
});

export default ChatMemoryDataSource;
