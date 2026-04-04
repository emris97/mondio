import type { CompetitionLevel } from '@/shared/types'
import type { JumpParams } from '@/entities/exercise/types'

export type Dog = {
  name: string
  breed: string
  registrationNumber: string
}

export type Handler = {
  name: string
  country: string
}

export type RecallMethod = 'voice' | 'whistle'

export type Participant = {
  id: string
  competitionId: string
  startOrder: number
  level: CompetitionLevel
  recallMethod: RecallMethod
  jumpParams: JumpParams
  handler: Handler
  dog: Dog
}
