import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, scoreRepo, generateId } from '@/shared/api'
import type { ParticipantScoreRecord } from '../storage-types'
import type { RawExerciseInput } from '../types'

export function useScoresByCompetition(competitionId: string) {
  return useQuery({
    queryKey: queryKeys.scores.byCompetition(competitionId),
    queryFn: () =>
      scoreRepo.getAll().filter((s) => s.competitionId === competitionId),
  })
}

export function useParticipantScore(participantId: string) {
  return useQuery({
    queryKey: queryKeys.scores.byParticipant(participantId),
    queryFn: () =>
      scoreRepo.getAll().find((s) => s.participantId === participantId) ?? null,
  })
}

export function useSaveScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      participantId: string
      competitionId: string
      inputs: RawExerciseInput[]
    }) => {
      const existing = scoreRepo
        .getAll()
        .find((s) => s.participantId === data.participantId)

      const record: ParticipantScoreRecord = {
        id: existing?.id ?? generateId(),
        participantId: data.participantId,
        competitionId: data.competitionId,
        inputs: data.inputs,
        updatedAt: new Date().toISOString(),
      }

      scoreRepo.save(record)
      return Promise.resolve(record)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.scores.byParticipant(variables.participantId) })
      qc.invalidateQueries({ queryKey: queryKeys.scores.byCompetition(variables.competitionId) })
    },
  })
}
