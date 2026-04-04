export type Repository<T extends { id: string }> = {
  getAll(): T[]
  getById(id: string): T | null
  save(entity: T): void
  remove(id: string): void
}
