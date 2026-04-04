import type { Repository } from './repository'
import { loadFromStorage, saveToStorage } from './storage'

export function createLocalStorageRepository<T extends { id: string }>(
  storageKey: string,
): Repository<T> {
  return {
    getAll(): T[] {
      return loadFromStorage<T>(storageKey)
    },

    getById(id: string): T | null {
      const all = loadFromStorage<T>(storageKey)
      return all.find((item) => item.id === id) ?? null
    },

    save(entity: T): void {
      const all = loadFromStorage<T>(storageKey)
      const index = all.findIndex((item) => item.id === entity.id)
      if (index >= 0) {
        all[index] = entity
      } else {
        all.push(entity)
      }
      saveToStorage(storageKey, all)
    },

    remove(id: string): void {
      const all = loadFromStorage<T>(storageKey)
      saveToStorage(
        storageKey,
        all.filter((item) => item.id !== id),
      )
    },
  }
}
