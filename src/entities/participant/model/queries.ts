import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, participantRepo, competitionRepo, generateId } from '@/shared/api'
import type { Participant, Handler, Dog } from '../types'
import type { CompetitionLevel } from '@/shared/types'

export function useParticipantsByCompetition(competitionId: string) {
  return useQuery({
    queryKey: queryKeys.participants.byCompetition(competitionId),
    queryFn: () =>
      participantRepo.getAll().filter((p) => p.competitionId === competitionId),
  })
}

export function useParticipant(id: string) {
  return useQuery({
    queryKey: queryKeys.participants.detail(id),
    queryFn: () => participantRepo.getById(id),
  })
}

export function useAddParticipant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      competitionId: string
      startOrder: number
      level: CompetitionLevel
      handler: Handler
      dog: Dog
    }) => {
      const participant: Participant = { id: generateId(), ...data }
      participantRepo.save(participant)

      const competition = competitionRepo.getById(data.competitionId)
      if (competition) {
        competitionRepo.save({
          ...competition,
          participantIds: [...competition.participantIds, participant.id],
          updatedAt: new Date().toISOString(),
        })
      }

      return Promise.resolve(participant)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.participants.byCompetition(variables.competitionId) })
      qc.invalidateQueries({ queryKey: queryKeys.competitions.detail(variables.competitionId) })
    },
  })
}

export function useUpdateParticipant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (participant: Participant) => {
      participantRepo.save(participant)
      return Promise.resolve(participant)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.participants.byCompetition(variables.competitionId) })
      qc.invalidateQueries({ queryKey: queryKeys.participants.detail(variables.id) })
    },
  })
}

export function useDeleteParticipant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (participant: Participant) => {
      participantRepo.remove(participant.id)

      const competition = competitionRepo.getById(participant.competitionId)
      if (competition) {
        competitionRepo.save({
          ...competition,
          participantIds: competition.participantIds.filter((pid) => pid !== participant.id),
          updatedAt: new Date().toISOString(),
        })
      }

      return Promise.resolve(participant.id)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.participants.byCompetition(variables.competitionId) })
      qc.invalidateQueries({ queryKey: queryKeys.competitions.detail(variables.competitionId) })
    },
  })
}
