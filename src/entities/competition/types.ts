import type { CompetitionLevel } from '@/shared/types'

export type Competition = {
  id: string
  name: string
  date: string
  location: string
  level: CompetitionLevel
  participantIds: string[]
  createdAt: string
  updatedAt: string
}
