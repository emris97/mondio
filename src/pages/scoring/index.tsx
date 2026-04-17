import { useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompetition } from '@/entities/competition/model/queries'
import { useParticipant } from '@/entities/participant/model/queries'
import { useParticipantScore, useSaveScore } from '@/entities/score/model/queries'
import { getExercisesByGroup, getExerciseDefinition, getDefaultJumpParams } from '@/entities/exercise/config'
import { applyDerivedInputs, calculateExerciseScore, calculateCompetitionTotal } from '@/entities/exercise/engine'
import { ExerciseForm } from './exercise-form'
import { ScoreBreakdown } from './score-breakdown'
import type { ExerciseGroup } from '@/shared/types'
import { useAutoSave } from './use-auto-save'

const groupLabels: Record<ExerciseGroup, string> = {
  obedience: 'Послушание',
  jumps: 'Прыжки',
  bite: 'Хватка',
}

export function ScoringPage() {
  const { id, pid } = useParams({ from: '/competition/$id/participant/$pid' })
  const { data: competition } = useCompetition(id)
  const { data: participant } = useParticipant(pid)
  const { data: scoreRecord } = useParticipantScore(pid)
  const saveScore = useSaveScore()

  const level = participant?.level ?? 1
  const jumpParams = participant?.jumpParams ?? getDefaultJumpParams(level)

  const { inputs, updateInput } = useAutoSave({
    level,
    jumpParams,
    scoreRecord,
    participantId: pid,
    competitionId: id,
    saveScore,
  })

  const derivedInputs = useMemo(() => applyDerivedInputs(inputs, level), [inputs, level])

  const scores = useMemo(() => {
    return derivedInputs.map((input) => {
      const def = getExerciseDefinition(input.exerciseId)
      if (!def) return null
      return calculateExerciseScore(input, def, level)
    }).filter(Boolean)
  }, [derivedInputs, level])

  const competitionTotal = useMemo(() => {
    return calculateCompetitionTotal(scores.filter((s) => s !== null), level)
  }, [scores, level])

  if (!competition || !participant) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-2">
        <Link to="/competition/$id" params={{ id }}>
          <Button variant="link" className="px-0 text-muted-foreground">← {competition.name}</Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {participant.handler.name} — {participant.dog.name}
          </h1>
          <p className="text-muted-foreground">
            №{participant.startOrder} · {participant.dog.breed}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{competitionTotal.grandTotal}</div>
          <div className="text-sm text-muted-foreground">из {competitionTotal.maxTotal}</div>
        </div>
      </div>

      <ScoreBreakdown total={competitionTotal} />

      <Tabs defaultValue="obedience" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          {(['obedience', 'jumps', 'bite'] as const).map((group) => (
            <TabsTrigger key={group} value={group}>
              {groupLabels[group]}
              <Badge variant="secondary" className="ml-2">
                {competitionTotal[group].total}/{competitionTotal[group].maxTotal}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {(['obedience', 'jumps', 'bite'] as const).map((group) => (
          <TabsContent key={group} value={group} className="mt-4 space-y-4">
            {getExercisesByGroup(level, group).map((def) => {
              const input = inputs.find((i) => i.exerciseId === def.id)
              if (!input) return null
              const derived = derivedInputs.find((i) => i.exerciseId === def.id)
              const effectiveInput = derived ?? input
              const maxScore = def.getMaxScore(level, input.jumpParams)
              if (maxScore === 0) return null
              return (
                <ExerciseForm
                  key={def.id}
                  definition={def}
                  level={level}
                  input={effectiveInput}
                  onChange={(updated) => updateInput(def.id, updated)}
                />
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
