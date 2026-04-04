import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, competitionRepo, generateId } from '@/shared/api'
import type { Competition } from '../types'
import type { CompetitionLevel } from '@/shared/types'

export function useCompetitions() {
  return useQuery({
    queryKey: queryKeys.competitions.all,
    queryFn: () => competitionRepo.getAll(),
  })
}

export function useCompetition(id: string) {
  return useQuery({
    queryKey: queryKeys.competitions.detail(id),
    queryFn: () => competitionRepo.getById(id),
  })
}

export function useCreateCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; date: string; location: string; level: CompetitionLevel }) => {
      const now = new Date().toISOString()
      const competition: Competition = {
        id: generateId(),
        ...data,
        participantIds: [],
        createdAt: now,
        updatedAt: now,
      }
      competitionRepo.save(competition)
      return Promise.resolve(competition)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.competitions.all })
    },
  })
}

export function useUpdateCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (competition: Competition) => {
      const updated = { ...competition, updatedAt: new Date().toISOString() }
      competitionRepo.save(updated)
      return Promise.resolve(updated)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.competitions.all })
      qc.invalidateQueries({ queryKey: queryKeys.competitions.detail(variables.id) })
    },
  })
}

export function useDeleteCompetition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      competitionRepo.remove(id)
      return Promise.resolve(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.competitions.all })
    },
  })
}
