import { describe, expect, it, vi } from "vitest";
import { MessageTemplateService } from "../../../../src/messaging/message-templates/services/message-template.service.js";
import type { MessageTemplateDao } from "../../../../src/messaging/message-templates/daos/message-template.dao.js";

function makeDao() {
  return {
    findAllOrdered: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as MessageTemplateDao;
}

describe("MessageTemplateService.getByKey", () => {
  it("delegates to the dao and returns null for an unknown key", async () => {
    const dao = makeDao();
    vi.mocked(dao.findByKey).mockResolvedValue(null);

    const service = new MessageTemplateService(dao);
    await expect(service.getByKey("does_not_exist")).resolves.toBeNull();
    expect(dao.findByKey).toHaveBeenCalledWith("does_not_exist");
  });
});
