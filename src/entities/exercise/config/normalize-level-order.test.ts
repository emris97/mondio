import { describe, expect, it } from 'vitest'
import { normalizeLevelExerciseOrder } from './registry'
import type { ExerciseId } from '@/shared/types'

describe('normalizeLevelExerciseOrder', () => {
  it('ставит послушание перед прыжками и хваткой даже если во flat сначала другие группы', () => {
    const scrambled: ExerciseId[] = [
      'pursuitBite',
      'heeling',
      'jumpWall',
      'absence',
    ]
    const out = normalizeLevelExerciseOrder(3, scrambled)
    const firstBite = out.findIndex((id) => id === 'pursuitBite')
    const lastObedience = out.findIndex((id) => id === 'absence')
    expect(lastObedience).toBeLessThan(firstBite)
    const firstJump = out.findIndex((id) => id === 'jumpWall')
    expect(lastObedience).toBeLessThan(firstJump)
  })

  it('без custom порядок совпадает с реестром по группам', () => {
    const a = normalizeLevelExerciseOrder(1, null)
    const b = normalizeLevelExerciseOrder(1, undefined)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
  })
})
