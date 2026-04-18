import type { ExerciseId } from '@/shared/types'

/** Упорядочить id упражнений: сначала по customOrder (только валидные для набора), затем остальные в порядке реестра. */
export function orderExerciseIds(
  registryOrderedIds: ExerciseId[],
  customOrder?: ExerciseId[] | null,
): ExerciseId[] {
  if (!customOrder?.length) return registryOrderedIds
  const allowed = new Set(registryOrderedIds)
  const seen = new Set<ExerciseId>()
  const result: ExerciseId[] = []
  for (const id of customOrder) {
    if (allowed.has(id) && !seen.has(id)) {
      result.push(id)
      seen.add(id)
    }
  }
  for (const id of registryOrderedIds) {
    if (!seen.has(id)) result.push(id)
  }
  return result
}
