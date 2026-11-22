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

  // FindOptionsWhere<T> no se resuelve sobre un T generico aunque las claves existan en
  // toda entidad concreta; el unico cast queda aqui en vez de repetirse en cada query.
  protected where(criteria: Partial<T> | { id: string | number } | { tenantId: string }): FindOptionsWhere<T> {
    return criteria as unknown as FindOptionsWhere<T>;
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as T);
    return this.repository.save(entity);
  }

  async findById(id: string | number): Promise<T | null> {
    return this.repository.findOneBy(this.where({ id }));
  }

  async findOne(where: Partial<T>): Promise<T | null> {
    return this.repository.findOneBy(this.where(where));
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    await this.repository.update(this.where({ id }), data);
    return this.findById(id);
  }

  async delete(id: string | number): Promise<boolean> {
    const result = await this.repository.delete(this.where({ id }));
    return (result.affected ?? 0) > 0;
  }
}
