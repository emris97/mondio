import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { RawExerciseInput } from '@/entities/score/types'
import type { ParticipantScoreRecord } from '@/entities/score/storage-types'
import type { CompetitionLevel } from '@/shared/types'
import type { JumpParams } from '@/entities/exercise/types'
import { createEmptyInputsForLevel, mergeJumpParams } from '@/entities/exercise/engine'

type UseAutoSaveParams = {
  level: CompetitionLevel
  jumpParams: JumpParams
  scoreRecord: ParticipantScoreRecord | null | undefined
  participantId: string
  competitionId: string
  saveScore: UseMutationResult<ParticipantScoreRecord, Error, {
    participantId: string
    competitionId: string
    inputs: RawExerciseInput[]
  }>
}

export function useAutoSave({ level, jumpParams, scoreRecord, participantId, competitionId, saveScore }: UseAutoSaveParams) {
  const [localInputs, setLocalInputs] = useState<RawExerciseInput[] | null>(null)
  const [loadedRecordId, setLoadedRecordId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const recordId = scoreRecord?.id ?? null
  const isNewRecord = recordId !== null && recordId !== loadedRecordId

  if (isNewRecord) {
    setLoadedRecordId(recordId)
    if (localInputs === null) {
      setLocalInputs(scoreRecord!.inputs)
    }
  }

  const rawInputs = localInputs ?? scoreRecord?.inputs ?? createEmptyInputsForLevel(level, jumpParams)
  const inputs = useMemo(() => mergeJumpParams(rawInputs, jumpParams), [rawInputs, jumpParams])

  const scheduleAutoSave = useCallback(
    (newInputs: RawExerciseInput[]) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveScore.mutate({ participantId, competitionId, inputs: newInputs })
      }, 1000)
    },
    [participantId, competitionId, saveScore],
  )

  const updateInput = useCallback(
    (exerciseId: string, updated: RawExerciseInput) => {
      setLocalInputs((prev) => {
        const base = prev ?? createEmptyInputsForLevel(level, jumpParams)
        const next = base.map((i) => (i.exerciseId === exerciseId ? updated : i))
        scheduleAutoSave(next)
        return next
      })
    },
    [scheduleAutoSave, level, jumpParams],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { inputs, updateInput }
}
