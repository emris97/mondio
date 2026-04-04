import type { Competition } from '@/entities/competition/types'
import type { Participant } from '@/entities/participant/types'
import type { ParticipantScoreRecord } from '@/entities/score/storage-types'
import { createLocalStorageRepository } from './local-storage-repository'

export const competitionRepo = createLocalStorageRepository<Competition>('mondio:competitions')
export const participantRepo = createLocalStorageRepository<Participant>('mondio:participants')
export const scoreRepo = createLocalStorageRepository<ParticipantScoreRecord>('mondio:scores')
