import type { CompetitionLevel, ExerciseGroup } from '@/shared/types'
import { getPenaltyPoints, type ExerciseDefinition, type JumpParams } from '../types'
import type {
  RawExerciseInput,
  ExerciseScore,
  GroupSubtotal,
  CompetitionTotal,
  ParticipantResult,
  RankedEntry,
} from '@/entities/score/types'
import { getExerciseDefinition, getExercisesForLevel } from '../config'

export function calculateExerciseScore(
  input: RawExerciseInput,
  definition: ExerciseDefinition,
  level: CompetitionLevel,
): ExerciseScore {
  const maxScore = definition.getMaxScore(level, input.jumpParams)
  const breakdown = definition.scoringBreakdown(level)

  const componentTotal = breakdown.reduce((sum, comp) => {
    const value = comp.fixed ? comp.maxScore : (input.componentScores[comp.id] ?? comp.maxScore)
    return sum + value
  }, 0)
  const rawScore = Math.min(componentTotal, maxScore)

  const penaltyTotal = input.penalties.reduce((sum, entry) => {
    const rule = definition.penaltyTable.find((p) => p.id === entry.penaltyId)
    if (!rule) return sum
    return sum + getPenaltyPoints(rule, level) * entry.count
  }, 0)

  const scoreAfterPenalties = Math.max(rawScore - penaltyTotal, 0)

  const ovDeduction = Math.min(
    input.ovPenalty,
    Math.floor(scoreAfterPenalties * 0.1),
  )

  const finalScore = Math.max(scoreAfterPenalties - ovDeduction, 0)

  return {
    exerciseId: input.exerciseId,
    group: definition.group,
    maxScore,
    rawScore,
    penaltyTotal,
    ovDeduction,
    finalScore,
  }
}

export function calculateGroupSubtotal(
  scores: ExerciseScore[],
  group: ExerciseGroup,
): GroupSubtotal {
  const groupScores = scores.filter((s) => s.group === group)
  return {
    group,
    maxTotal: groupScores.reduce((sum, s) => sum + s.maxScore, 0),
    total: groupScores.reduce((sum, s) => sum + s.finalScore, 0),
    exercises: groupScores,
  }
}

export function calculateCompetitionTotal(
  scores: ExerciseScore[],
  level: CompetitionLevel,
): CompetitionTotal {
  const obedience = calculateGroupSubtotal(scores, 'obedience')
  const jumps = calculateGroupSubtotal(scores, 'jumps')
  const bite = calculateGroupSubtotal(scores, 'bite')

  const levelMaxTotals: Record<CompetitionLevel, number> = { 1: 200, 2: 300, 3: 400 }

  return {
    level,
    maxTotal: levelMaxTotals[level],
    obedience,
    jumps,
    bite,
    grandTotal: obedience.total + jumps.total + bite.total,
  }
}

/**
 * Прерванная атака (только III):
 * Баллы за атаку = (frontalStickBite + frontalObjectsBite) / 3
 * Итого = biteComponent + startScore - penalties
 * Не может быть < 0
 */
export function calculateInterruptedPursuit(
  frontalStickBite: number,
  frontalObjectsBite: number,
  startScore: number,
  penalties: number[],
): number {
  const biteComponent = (frontalStickBite + frontalObjectsBite) / 3
  const totalPenalties = penalties.reduce((sum, p) => sum + p, 0)
  return Math.max(biteComponent + startScore - totalPenalties, 0)
}

/**
 * Тай-брейк по правилам (VII):
 * 1. Лучшие оценки за хватку
 * 2. Лучшие оценки за послушание
 * 3. Лучшие оценки за прыжки
 */
export function rankParticipants(entries: ParticipantResult[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => {
    const diffTotal = b.total.grandTotal - a.total.grandTotal
    if (diffTotal !== 0) return diffTotal

    const diffBite = b.total.bite.total - a.total.bite.total
    if (diffBite !== 0) return diffBite

    const diffObedience = b.total.obedience.total - a.total.obedience.total
    if (diffObedience !== 0) return diffObedience

    return b.total.jumps.total - a.total.jumps.total
  })

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}

/** Получить пустой набор inputs для уровня */
export function createEmptyInputsForLevel(
  level: CompetitionLevel,
  jumpParams?: JumpParams,
): RawExerciseInput[] {
  return getExercisesForLevel(level).map((def) => ({
    exerciseId: def.id,
    componentScores: Object.fromEntries(
      def.scoringBreakdown(level).map((c) => [c.id, c.maxScore]),
    ),
    penalties: [],
    ovPenalty: 0,
    ...(def.group === 'jumps' && jumpParams ? { jumpParams } : {}),
  }))
}

/** Обновить jumpParams на всех прыжковых inputs */
export function mergeJumpParams(
  inputs: RawExerciseInput[],
  jumpParams: JumpParams,
): RawExerciseInput[] {
  return inputs.map((input) => {
    const def = getExerciseDefinition(input.exerciseId)
    if (!def || def.group !== 'jumps') return input
    return { ...input, jumpParams }
  })
}
