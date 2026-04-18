import type { CompetitionLevel, ExerciseId } from '@/shared/types'

export type Competition = {
  id: string
  name: string
  date: string
  location: string
  participantIds: string[]
  /**
   * Порядок упражнений по уровням (плоский список: послушание, затем прыжки, затем хватка).
   * Разделы всегда в этом порядке; меняется только порядок внутри раздела.
   */
  exerciseOrderByLevel?: Partial<Record<CompetitionLevel, ExerciseId[]>>
  createdAt: string
  updatedAt: string
}
