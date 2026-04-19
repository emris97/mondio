import type { CompetitionLevel } from '@/shared/types'
import type { RawExerciseInput } from '@/entities/score/types'
import type { ExerciseDefinition } from '../types'
import { getPenaltyDescription, getPenaltyPoints } from '../types'
import { calculateExerciseScore } from './scoring'

export type AppliedPenaltyLine = {
  penaltyId: string
  description: string
  count: number
  /** Суммарное списание баллов по строке (как в движке) */
  deduction: number
  perUnit: boolean
  unitLabel?: string
  pointsPerUnit: number
}

export type ExercisePenaltiesDescription = {
  lines: AppliedPenaltyLine[]
  /** Введённое судьёй значение ОВ (до clamp) */
  ovPenaltyInput: number
  /** Фактическое списание ОВ (из calculateExerciseScore) */
  ovDeduction: number
}

/**
 * Человекочитаемый перечень штрафов по упражнению и фактическое списание ОВ.
 * Согласовано с `calculateExerciseScore`.
 */
export function describeExercisePenalties(
  input: RawExerciseInput,
  definition: ExerciseDefinition,
  level: CompetitionLevel,
): ExercisePenaltiesDescription {
  const scored = calculateExerciseScore(input, definition, level)

  const lines: AppliedPenaltyLine[] = []
  for (const entry of input.penalties) {
    if (entry.count <= 0) continue
    const rule = definition.penaltyTable.find((p) => p.id === entry.penaltyId)
    if (!rule) continue
    const pointsPerUnit = getPenaltyPoints(rule, level)
    const deduction = pointsPerUnit * entry.count
    lines.push({
      penaltyId: entry.penaltyId,
      description: getPenaltyDescription(rule, level),
      count: entry.count,
      deduction: Math.round(deduction * 10) / 10,
      perUnit: Boolean(rule.perUnit),
      unitLabel: rule.unitLabel,
      pointsPerUnit,
    })
  }

  return {
    lines,
    ovPenaltyInput: input.ovPenalty,
    ovDeduction: scored.ovDeduction,
  }
}
