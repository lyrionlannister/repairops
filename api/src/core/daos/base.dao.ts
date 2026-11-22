import { FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";
import { getTransactionManager } from "../database/transaction-context.js";

export abstract class BaseDao<T extends ObjectLiteral> {
  private readonly baseRepository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.baseRepository = repository;
  }

  protected get repository(): Repository<T> {
    const manager = getTransactionManager();
    return manager ? manager.getRepository<T>(this.baseRepository.target) : this.baseRepository;
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as T);
    return this.repository.save(entity);
  }

  async findById(id: string | number): Promise<T | null> {
    return this.repository.findOneBy({ id } as unknown as FindOptionsWhere<T>);
  }

  async findOne(where: Partial<T>): Promise<T | null> {
    return this.repository.findOneBy(where as unknown as FindOptionsWhere<T>);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    await this.repository.update({ id } as unknown as FindOptionsWhere<T>, data);
    return this.findById(id);
  }

  async delete(id: string | number): Promise<boolean> {
    const result = await this.repository.delete({ id } as unknown as FindOptionsWhere<T>);
    return (result.affected ?? 0) > 0;
  }
}
