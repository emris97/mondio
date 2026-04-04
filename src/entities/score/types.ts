import type { CompetitionLevel, ExerciseGroup, ExerciseId } from '@/shared/types'
import type { JumpParams } from '@/entities/exercise/types'

export type PenaltyEntry = {
  penaltyId: string
  count: number
}

export type RawExerciseInput = {
  exerciseId: ExerciseId
  componentScores: Record<string, number>
  penalties: PenaltyEntry[]
  ovPenalty: number
  jumpParams?: JumpParams
}

export type ExerciseScore = {
  exerciseId: ExerciseId
  group: ExerciseGroup
  maxScore: number
  rawScore: number
  penaltyTotal: number
  ovDeduction: number
  finalScore: number
}

export type GroupSubtotal = {
  group: ExerciseGroup
  maxTotal: number
  total: number
  exercises: ExerciseScore[]
}

export type CompetitionTotal = {
  level: CompetitionLevel
  maxTotal: number
  obedience: GroupSubtotal
  jumps: GroupSubtotal
  bite: GroupSubtotal
  grandTotal: number
}

export type ParticipantResult = {
  participantId: string
  total: CompetitionTotal
}

export type RankedEntry = ParticipantResult & {
  rank: number
}
