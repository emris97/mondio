import type { RawExerciseInput } from './types'

export type ParticipantScoreRecord = {
  id: string
  participantId: string
  competitionId: string
  inputs: RawExerciseInput[]
  updatedAt: string
}
