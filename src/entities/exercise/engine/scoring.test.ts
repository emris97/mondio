import { describe, it, expect } from 'vitest'
import {
  calculateExerciseScore,
  calculateGroupSubtotal,
  calculateCompetitionTotal,
  calculateInterruptedPursuit,
  applyDerivedInputs,
  rankParticipants,
  createEmptyInputsForLevel,
  mergeJumpParams,
} from './scoring'
import { getExerciseDefinition } from '../config'
import type { ExerciseScore, ParticipantResult, GroupSubtotal } from '@/entities/score/types'

function makeGroupSubtotal(group: 'obedience' | 'jumps' | 'bite', total: number): GroupSubtotal {
  return { group, maxTotal: total, total, exercises: [] }
}

describe('calculateExerciseScore', () => {
  it('рассчитывает баллы за хождение рядом без штрафов', () => {
    const def = getExerciseDefinition('heeling')!
    const result = calculateExerciseScore(
      { exerciseId: 'heeling', componentScores: { total: 6 }, penalties: [], ovPenalty: 0 },
      def,
      1,
    )
    expect(result.finalScore).toBe(6)
    expect(result.maxScore).toBe(6)
    expect(result.penaltyTotal).toBe(0)
  })

  it('применяет штрафы за отклонение при хождении рядом', () => {
    const def = getExerciseDefinition('heeling')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'heeling',
        componentScores: { total: 6 },
        penalties: [{ penaltyId: 'deviation', count: 4 }],
        ovPenalty: 0,
      },
      def,
      1,
    )
    expect(result.penaltyTotal).toBe(2) // 4 * 0.5
    expect(result.finalScore).toBe(4)
  })

  it('не даёт итогу уйти в минус', () => {
    const def = getExerciseDefinition('heeling')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'heeling',
        componentScores: { total: 6 },
        penalties: [{ penaltyId: 'leave', count: 1 }],
        ovPenalty: 0,
      },
      def,
      1,
    )
    expect(result.finalScore).toBe(0)
  })

  it('применяет ОВ-штраф (до 10% от баллов)', () => {
    const def = getExerciseDefinition('absence')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'absence',
        componentScores: { total: 10 },
        penalties: [],
        ovPenalty: 1,
      },
      def,
      1,
    )
    expect(result.ovDeduction).toBe(1)
    expect(result.finalScore).toBe(9)
  })

  it('ограничивает ОВ-штраф 10% от фиксированного максимума', () => {
    const def = getExerciseDefinition('absence')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'absence',
        componentScores: { total: 10 },
        penalties: [{ penaltyId: 'crawl', count: 5 }],
        ovPenalty: 10,
      },
      def,
      1,
    )
    // maxScore=10, 10% of 10 = 1, ovPenalty=10 → clamped to 1
    expect(result.ovDeduction).toBe(1)
    expect(result.finalScore).toBe(4)
  })

  it('рассчитывает комплекс для уровня I (макс 10)', () => {
    const def = getExerciseDefinition('positions')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'positions',
        componentScores: { positions: 9, recall: 1 },
        penalties: [],
        ovPenalty: 0,
      },
      def,
      1,
    )
    expect(result.maxScore).toBe(10)
    expect(result.finalScore).toBe(10)
  })

  it('рассчитывает комплекс для уровня III (макс 20)', () => {
    const def = getExerciseDefinition('positions')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'positions',
        componentScores: { positions: 18, recall: 2 },
        penalties: [{ penaltyId: 'crawlToHandler', count: 1 }],
        ovPenalty: 0,
      },
      def,
      3,
    )
    expect(result.maxScore).toBe(20)
    expect(result.finalScore).toBe(19)
  })

  it('рассчитывает лобовую атаку с палкой уровень II (макс 40)', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 20, stop: 10 },
        penalties: [],
        ovPenalty: 0,
      },
      def,
      2,
    )
    expect(result.maxScore).toBe(40)
    expect(result.finalScore).toBe(40)
  })

  it('рассчитывает барьер с параметрами высоты', () => {
    const def = getExerciseDefinition('jumpWall')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'jumpWall',
        componentScores: { jump: 15 },
        penalties: [],
        ovPenalty: 0,
        jumpParams: { wallHeight: 2.3 },
      },
      def,
      3,
    )
    expect(result.maxScore).toBe(15)
    expect(result.finalScore).toBe(15)
  })

  it('fixed-компонент использует maxScore независимо от входных данных', () => {
    const def = getExerciseDefinition('heeling')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'heeling',
        componentScores: { total: 0 },
        penalties: [],
        ovPenalty: 0,
      },
      def,
      1,
    )
    expect(result.rawScore).toBe(6)
    expect(result.finalScore).toBe(6)
  })

  it('fixed-компонент корректно работает со штрафами', () => {
    const def = getExerciseDefinition('heeling')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'heeling',
        componentScores: {},
        penalties: [{ penaltyId: 'deviation', count: 4 }],
        ovPenalty: 0,
      },
      def,
      1,
    )
    expect(result.rawScore).toBe(6)
    expect(result.penaltyTotal).toBe(2)
    expect(result.finalScore).toBe(4)
  })

  it('посыл вперёд — не fixed, базовый балл берётся из ввода', () => {
    const def = getExerciseDefinition('sendAway')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'sendAway',
        componentScores: { total: 8 },
        penalties: [],
        ovPenalty: 0,
      },
      def,
      1,
    )
    expect(result.rawScore).toBe(8)
    expect(result.finalScore).toBe(8)
  })

  it('appliesTo: штраф вычитается из своего компонента, а не из общей суммы', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 30, stop: 10 },
        penalties: [{ penaltyId: 'earlyStartBefore', count: 1 }],
        ovPenalty: 0,
      },
      def,
      3,
    )
    // earlyStartBefore (10) appliesTo: 'start' → start: max(10−10, 0) = 0
    // bite: 30, stop: 10 → rawScore = 0+30+10 = 40
    expect(result.rawScore).toBe(40)
    expect(result.penaltyTotal).toBe(10)
    expect(result.finalScore).toBe(40)
  })

  it('appliesTo: штраф фазы не уводит компонент ниже 0 (cap)', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 30, stop: 10 },
        penalties: [{ penaltyId: 'obstacleBypass', count: 1 }],
        ovPenalty: 0,
      },
      def,
      3,
    )
    // obstacleBypass (15) appliesTo: 'start' → start: max(10−15, 0) = 0
    // rawScore = 0+30+10 = 40, excess 5 pts lost (capped per-component)
    expect(result.rawScore).toBe(40)
    expect(result.finalScore).toBe(40)
  })

  it('appliesTo: несколько штрафов одной фазы суммируются', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 30, stop: 10 },
        penalties: [
          { penaltyId: 'holdAfterStop', count: 3 },
          { penaltyId: 'extraRecall', count: 1 },
        ],
        ovPenalty: 0,
      },
      def,
      3,
    )
    // holdAfterStop (2/сек × 3 = 6) + extraRecall (5) = 11 → stop: max(10−11, 0) = 0
    // rawScore = 10+30+0 = 40
    expect(result.rawScore).toBe(40)
    expect(result.finalScore).toBe(40)
  })

  it('appliesTo: штрафы разных фаз работают независимо', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 30, stop: 10 },
        penalties: [
          { penaltyId: 'earlyStartAfter', count: 1 },
          { penaltyId: 'noBitePerSecond', count: 2 },
          { penaltyId: 'extraRecall', count: 1 },
        ],
        ovPenalty: 0,
      },
      def,
      3,
    )
    // start: 10−5 = 5, bite: 30−6 = 24, stop: 10−5 = 5
    // rawScore = 5+24+5 = 34
    expect(result.rawScore).toBe(34)
    expect(result.penaltyTotal).toBe(16)
    expect(result.finalScore).toBe(34)
  })

  it('без appliesTo: штраф вычитается из общей суммы (обратная совместимость)', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 30, stop: 10 },
        penalties: [{ penaltyId: 'earlyStartRepeat', count: 1 }],
        ovPenalty: 0,
      },
      def,
      3,
    )
    // earlyStartRepeat (50, binary, no appliesTo) → rawScore = 50, finalScore = max(50−50, 0) = 0
    expect(result.rawScore).toBe(50)
    expect(result.finalScore).toBe(0)
  })

  it('смешанные штрафы: scoped + unscoped', () => {
    const def = getExerciseDefinition('frontalAttackStick')!
    const result = calculateExerciseScore(
      {
        exerciseId: 'frontalAttackStick',
        componentScores: { start: 10, bite: 30, stop: 10 },
        penalties: [
          { penaltyId: 'earlyStartBefore', count: 1 },
          { penaltyId: 'unauthorizedActions', count: 1 },
        ],
        ovPenalty: 0,
      },
      def,
      3,
    )
    // earlyStartBefore (10, appliesTo: start) → start: 0
    // rawScore = 0+30+10 = 40
    // unauthorizedActions (50, no appliesTo) → max(40−50, 0) = 0
    expect(result.rawScore).toBe(40)
    expect(result.finalScore).toBe(0)
  })
})

describe('createEmptyInputsForLevel', () => {
  it('все компоненты инициализируются с maxScore', () => {
    const inputs = createEmptyInputsForLevel(1)
    const heeling = inputs.find((i) => i.exerciseId === 'heeling')!
    expect(heeling.componentScores['total']).toBe(6)

    const sendAway = inputs.find((i) => i.exerciseId === 'sendAway')!
    expect(sendAway.componentScores['total']).toBe(12)

    const positions = inputs.find((i) => i.exerciseId === 'positions')!
    expect(positions.componentScores['positions']).toBe(9)
    expect(positions.componentScores['recall']).toBe(1)
  })

  it('jumpParams передаются на прыжковые упражнения', () => {
    const jp = { wallHeight: 2.1 as const, longJumpLength: 3.5 as const, palisadeHeight: 1.1 as const }
    const inputs = createEmptyInputsForLevel(2, jp)

    const wall = inputs.find((i) => i.exerciseId === 'jumpWall')!
    expect(wall.jumpParams).toEqual(jp)

    const long = inputs.find((i) => i.exerciseId === 'jumpLong')!
    expect(long.jumpParams).toEqual(jp)

    const palisade = inputs.find((i) => i.exerciseId === 'jumpPalisade')!
    expect(palisade.jumpParams).toEqual(jp)
  })

  it('без jumpParams прыжковые inputs не имеют jumpParams', () => {
    const inputs = createEmptyInputsForLevel(1)
    const wall = inputs.find((i) => i.exerciseId === 'jumpWall')!
    expect(wall.jumpParams).toBeUndefined()
  })
})

describe('mergeJumpParams', () => {
  it('обновляет jumpParams только на прыжковых inputs', () => {
    const inputs = createEmptyInputsForLevel(1)
    const jp = { wallHeight: 1.8 as const, longJumpLength: 3.0 as const, palisadeHeight: 1.0 as const }
    const merged = mergeJumpParams(inputs, jp)

    const wall = merged.find((i) => i.exerciseId === 'jumpWall')!
    expect(wall.jumpParams).toEqual(jp)

    const heeling = merged.find((i) => i.exerciseId === 'heeling')!
    expect(heeling.jumpParams).toBeUndefined()
  })
})

describe('calculateGroupSubtotal', () => {
  it('суммирует баллы по группе', () => {
    const scores: ExerciseScore[] = [
      { exerciseId: 'heeling', group: 'obedience', maxScore: 6, rawScore: 6, penaltyTotal: 0, ovDeduction: 0, finalScore: 5 },
      { exerciseId: 'absence', group: 'obedience', maxScore: 10, rawScore: 10, penaltyTotal: 0, ovDeduction: 0, finalScore: 8 },
      { exerciseId: 'jumpWall', group: 'jumps', maxScore: 15, rawScore: 15, penaltyTotal: 0, ovDeduction: 0, finalScore: 15 },
    ]
    const result = calculateGroupSubtotal(scores, 'obedience')
    expect(result.total).toBe(13)
    expect(result.maxTotal).toBe(16)
    expect(result.exercises).toHaveLength(2)
  })

  it('фильтрует только упражнения нужной группы', () => {
    const scores: ExerciseScore[] = [
      { exerciseId: 'heeling', group: 'obedience', maxScore: 6, rawScore: 6, penaltyTotal: 0, ovDeduction: 0, finalScore: 6 },
      { exerciseId: 'jumpWall', group: 'jumps', maxScore: 15, rawScore: 15, penaltyTotal: 0, ovDeduction: 0, finalScore: 15 },
    ]
    const jumps = calculateGroupSubtotal(scores, 'jumps')
    expect(jumps.exercises).toHaveLength(1)
    expect(jumps.total).toBe(15)
  })
})

describe('calculateCompetitionTotal', () => {
  it('рассчитывает grand total для уровня I', () => {
    const scores: ExerciseScore[] = [
      { exerciseId: 'heeling', group: 'obedience', maxScore: 6, rawScore: 6, penaltyTotal: 0, ovDeduction: 0, finalScore: 6 },
      { exerciseId: 'absence', group: 'obedience', maxScore: 10, rawScore: 10, penaltyTotal: 0, ovDeduction: 0, finalScore: 10 },
      { exerciseId: 'jumpWall', group: 'jumps', maxScore: 15, rawScore: 15, penaltyTotal: 0, ovDeduction: 0, finalScore: 15 },
      { exerciseId: 'frontalAttackStick', group: 'bite', maxScore: 50, rawScore: 50, penaltyTotal: 0, ovDeduction: 0, finalScore: 50 },
    ]
    const result = calculateCompetitionTotal(scores, 1)
    expect(result.maxTotal).toBe(200)
    expect(result.grandTotal).toBe(81)
  })
})

describe('calculateInterruptedPursuit', () => {
  it('пример 1 из правил: (28+26)/3=18, старт 10, штраф -4 = 24', () => {
    const result = calculateInterruptedPursuit(28, 26, 10, [4])
    expect(result).toBe(24)
  })

  it('пример 2: (30+30)/3=20, старт 5 (10-5), штраф 0 = 25', () => {
    const result = calculateInterruptedPursuit(30, 30, 5, [0])
    expect(result).toBe(25)
  })

  it('пример 3: (30+30)/3=20, старт 10, штрафы -2 -20 = 8', () => {
    const result = calculateInterruptedPursuit(30, 30, 10, [2, 20])
    expect(result).toBe(8)
  })

  it('не уходит в минус', () => {
    const result = calculateInterruptedPursuit(0, 0, 0, [50])
    expect(result).toBe(0)
  })
})

describe('applyDerivedInputs', () => {
  it('подставляет pursuit=(biteStick+biteObjects)/3 для прерванной атаки (III)', () => {
    const inputs = createEmptyInputsForLevel(3)
      .map((i) => {
        if (i.exerciseId === 'frontalAttackStick') {
          // bite=30, quickRegrips (1×2) → 28
          return { ...i, penalties: [{ penaltyId: 'quickRegrips', count: 2 }], ovPenalty: 0 }
        }
        if (i.exerciseId === 'frontalAttackObjects') {
          // bite=30, quickRegrips (1×4) → 26
          return { ...i, penalties: [{ penaltyId: 'quickRegrips', count: 4 }], ovPenalty: 0 }
        }
        return i
      })

    const derived = applyDerivedInputs(inputs, 3)
    const interrupted = derived.find((i) => i.exerciseId === 'pursuitInterrupted')!
    expect(interrupted.componentScores['pursuit']).toBe(Math.round((28 + 26) / 3))
  })
})

describe('rankParticipants', () => {
  it('ранжирует по grandTotal', () => {
    const entries: ParticipantResult[] = [
      { participantId: 'a', total: { level: 1, maxTotal: 200, grandTotal: 150, obedience: makeGroupSubtotal('obedience', 50), jumps: makeGroupSubtotal('jumps', 10), bite: makeGroupSubtotal('bite', 90) } },
      { participantId: 'b', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 50), jumps: makeGroupSubtotal('jumps', 15), bite: makeGroupSubtotal('bite', 115) } },
    ]
    const ranked = rankParticipants(entries)
    expect(ranked[0].participantId).toBe('b')
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].participantId).toBe('a')
    expect(ranked[1].rank).toBe(2)
  })

  it('тай-брейк: при одинаковом total побеждает по хватке', () => {
    const entries: ParticipantResult[] = [
      { participantId: 'a', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 55), jumps: makeGroupSubtotal('jumps', 15), bite: makeGroupSubtotal('bite', 110) } },
      { participantId: 'b', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 50), jumps: makeGroupSubtotal('jumps', 10), bite: makeGroupSubtotal('bite', 120) } },
    ]
    const ranked = rankParticipants(entries)
    expect(ranked[0].participantId).toBe('b')
  })

  it('тай-брейк: при одинаковых total и bite — побеждает по послушанию', () => {
    const entries: ParticipantResult[] = [
      { participantId: 'a', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 50), jumps: makeGroupSubtotal('jumps', 10), bite: makeGroupSubtotal('bite', 120) } },
      { participantId: 'b', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 55), jumps: makeGroupSubtotal('jumps', 5), bite: makeGroupSubtotal('bite', 120) } },
    ]
    const ranked = rankParticipants(entries)
    expect(ranked[0].participantId).toBe('b')
  })

  it('тай-брейк: при одинаковых total, bite, obedience — побеждает по прыжкам', () => {
    const entries: ParticipantResult[] = [
      { participantId: 'a', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 50), jumps: makeGroupSubtotal('jumps', 10), bite: makeGroupSubtotal('bite', 120) } },
      { participantId: 'b', total: { level: 1, maxTotal: 200, grandTotal: 180, obedience: makeGroupSubtotal('obedience', 50), jumps: makeGroupSubtotal('jumps', 15), bite: makeGroupSubtotal('bite', 120) } },
    ]
    const ranked = rankParticipants(entries)
    expect(ranked[0].participantId).toBe('b')
  })
})
