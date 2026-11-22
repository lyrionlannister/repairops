import { singleton } from "tsyringe";
import { MessageTemplateDao } from "../daos/message-template.dao.js";
import { MessageTemplate } from "../entities/message-template.entity.js";

type CreatePayload = Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">;
type UpdatePayload = Partial<Omit<MessageTemplate, "id" | "key" | "createdAt" | "updatedAt">>;

@singleton()
export class MessageTemplateService {
  constructor(private dao: MessageTemplateDao) {}

  async getAll(): Promise<MessageTemplate[]> {
    return this.dao.findAllOrdered();
  }

  async getByKey(key: string): Promise<MessageTemplate | null> {
    return this.dao.findByKey(key);
  }

  async create(data: CreatePayload): Promise<MessageTemplate> {
    return this.dao.create(data);
  }

  async update(id: string, data: UpdatePayload): Promise<MessageTemplate | null> {
    return this.dao.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.dao.delete(id);
  }
}
