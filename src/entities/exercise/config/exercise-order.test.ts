import { describe, expect, it } from 'vitest'
import { orderExerciseIds } from './exercise-order'
import type { ExerciseId } from '@/shared/types'

describe('orderExerciseIds', () => {
  const registry: ExerciseId[] = ['heeling', 'absence', 'sendAway', 'positions']

  it('возвращает порядок реестра без customOrder', () => {
    expect(orderExerciseIds(registry, null)).toEqual(registry)
    expect(orderExerciseIds(registry, undefined)).toEqual(registry)
    expect(orderExerciseIds(registry, [])).toEqual(registry)
  })

  it('ставит customOrder вперёд, остальное дополняет из реестра', () => {
    const custom: ExerciseId[] = ['positions', 'heeling']
    expect(orderExerciseIds(registry, custom)).toEqual([
      'positions',
      'heeling',
      'absence',
      'sendAway',
    ])
  })

  it('игнорирует лишние и дубликаты в customOrder', () => {
    const custom: ExerciseId[] = ['positions', 'positions', 'heeling']
    expect(orderExerciseIds(registry, custom)).toEqual(['positions', 'heeling', 'absence', 'sendAway'])
  })
})
