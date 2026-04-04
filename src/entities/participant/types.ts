import type { CompetitionLevel } from '@/shared/types'

export type Dog = {
  name: string
  breed: string
  registrationNumber: string
}

export type Handler = {
  name: string
  country: string
}

export type Participant = {
  id: string
  competitionId: string
  startOrder: number
  level: CompetitionLevel
  handler: Handler
  dog: Dog
}
