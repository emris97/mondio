import type { CompetitionLevel, ExerciseGroup, ExerciseId } from '@/shared/types'
import { getPenaltyAmount, type ExerciseDefinition, type JumpParams } from '../types'
import type {
  RawExerciseInput,
  ExerciseScore,
  GroupSubtotal,
  CompetitionTotal,
  ParticipantResult,
  RankedEntry,
} from '@/entities/score/types'
import { getExerciseDefinition, getExercisesForLevel } from '../config'

/** Округление до одного знака после запятой (половинные штрафы и др.) */
function roundScore(value: number): number {
  return Math.round(value * 10) / 10
}

function calculateComponentRemainders(
  input: RawExerciseInput,
  definition: ExerciseDefinition,
  level: CompetitionLevel,
): Map<string, number> {
  const breakdown = definition.scoringBreakdown(level)
  const maxScore = definition.getMaxScore(level, input.jumpParams)

  const scopedPenaltySums = new Map<string, number>()
  for (const entry of input.penalties) {
    const rule = definition.penaltyTable.find((p) => p.id === entry.penaltyId)
    if (!rule || !rule.appliesTo) continue
    const amount = getPenaltyAmount(rule, level, maxScore) * entry.count
    scopedPenaltySums.set(rule.appliesTo, (scopedPenaltySums.get(rule.appliesTo) ?? 0) + amount)
  }

  const remainders = new Map<string, number>()
  for (const comp of breakdown) {
    const base = comp.fixed ? comp.maxScore : (input.componentScores[comp.id] ?? comp.maxScore)
    const scopedPenalty = scopedPenaltySums.get(comp.id) ?? 0
    remainders.set(comp.id, Math.max(base - scopedPenalty, 0))
  }
  return remainders
}

export function calculateExerciseScore(
  input: RawExerciseInput,
  definition: ExerciseDefinition,
  level: CompetitionLevel,
): ExerciseScore {
  const maxScore = definition.getMaxScore(level, input.jumpParams)
  const breakdown = definition.scoringBreakdown(level)

  const scopedPenaltySums = new Map<string, number>()
  let unscopedPenaltyTotal = 0

  for (const entry of input.penalties) {
    const rule = definition.penaltyTable.find((p) => p.id === entry.penaltyId)
    if (!rule) continue
    const amount = getPenaltyAmount(rule, level, maxScore) * entry.count
    if (rule.appliesTo) {
      scopedPenaltySums.set(rule.appliesTo, (scopedPenaltySums.get(rule.appliesTo) ?? 0) + amount)
    } else {
      unscopedPenaltyTotal += amount
    }
  }

  const componentTotal = breakdown.reduce((sum, comp) => {
    const base = comp.fixed ? comp.maxScore : (input.componentScores[comp.id] ?? comp.maxScore)
    const scopedPenalty = scopedPenaltySums.get(comp.id) ?? 0
    return sum + Math.max(base - scopedPenalty, 0)
  }, 0)
  const rawScore = Math.min(componentTotal, maxScore)

  const penaltyTotal = unscopedPenaltyTotal + [...scopedPenaltySums.values()].reduce((a, b) => a + b, 0)

  const scoreAfterPenalties = Math.max(rawScore - unscopedPenaltyTotal, 0)

  const ovDeduction = Math.min(input.ovPenalty, maxScore * 0.1)

  const finalScore = Math.max(scoreAfterPenalties - ovDeduction, 0)

  return {
    exerciseId: input.exerciseId,
    group: definition.group,
    maxScore,
    rawScore: roundScore(rawScore),
    penaltyTotal: roundScore(penaltyTotal),
    ovDeduction: roundScore(ovDeduction),
    finalScore: roundScore(finalScore),
  }
}

/**
 * Подставляет автоматически рассчитываемые компоненты (derived inputs).
 *
 * Сейчас это нужно для "Атака вдогонку прерванная" (III):
 * компонент "pursuit" = (bite(лобовая с палкой) + bite(лобовая с предметами)) / 3
 *
 * Важно: здесь подставляется только базовый балл компонента. Штрафы/ОВ
 * по самому упражнению продолжают применяться обычным `calculateExerciseScore`.
 */
export function applyDerivedInputs(
  inputs: RawExerciseInput[],
  level: CompetitionLevel,
): RawExerciseInput[] {
  if (level !== 3) return inputs

  const interruptedIdx = inputs.findIndex((i) => i.exerciseId === 'pursuitInterrupted')
  if (interruptedIdx === -1) return inputs

  const defInterrupted = getExerciseDefinition('pursuitInterrupted')
  const defStick = getExerciseDefinition('frontalAttackStick')
  const defObjects = getExerciseDefinition('frontalAttackObjects')
  if (!defInterrupted || !defStick || !defObjects) return inputs

  const stickInput = inputs.find((i) => i.exerciseId === 'frontalAttackStick')
  const objectsInput = inputs.find((i) => i.exerciseId === 'frontalAttackObjects')
  const interruptedInput = inputs[interruptedIdx]

  const stickBite = stickInput
    ? (calculateComponentRemainders(stickInput, defStick, level).get('bite') ?? 0)
    : 0
  const objectsBite = objectsInput
    ? (calculateComponentRemainders(objectsInput, defObjects, level).get('bite') ?? 0)
    : 0

  const pursuitComponent = roundScore((stickBite + objectsBite) / 3)

  const next = [...inputs]
  next[interruptedIdx] = {
    ...interruptedInput,
    componentScores: {
      ...interruptedInput.componentScores,
      pursuit: pursuitComponent,
    },
  }
  return next
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
  return roundScore(Math.max(biteComponent + startScore - totalPenalties, 0))
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
  exerciseOrder?: ExerciseId[] | null,
): RawExerciseInput[] {
  return getExercisesForLevel(level, exerciseOrder).map((def) => ({
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
