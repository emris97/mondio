import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getExercisesByGroup } from '@/entities/exercise/config'
import { describeExercisePenalties } from '@/entities/exercise/engine'
import type { ExercisePenaltiesDescription } from '@/entities/exercise/engine'
import type { RankedEntry, RawExerciseInput } from '@/entities/score/types'
import type { Participant } from '@/entities/participant/types'
import type { CompetitionLevel, ExerciseGroup, ExerciseId } from '@/shared/types'
import type { ExerciseDefinition } from '@/entities/exercise/types'

const groupLabels: Record<ExerciseGroup, string> = {
  obedience: 'Послушание',
  jumps: 'Прыжки',
  bite: 'Хватка',
}

const groups: ExerciseGroup[] = ['obedience', 'jumps', 'bite']

type RankedWithParticipant = RankedEntry & { participant: Participant }

type ExercisePenaltyBlock = {
  definition: ExerciseDefinition
  described: ExercisePenaltiesDescription
}

type Props = {
  entries: RankedWithParticipant[]
  /** Эффективные inputs после applyDerivedInputs, в порядке записи */
  getEffectiveInputs: (participantId: string) => RawExerciseInput[] | undefined
  exerciseOrder?: ExerciseId[] | null
}

function formatPenaltyLineCaption(line: {
  count: number
  perUnit: boolean
  unitLabel?: string
}): string {
  if (line.perUnit && line.unitLabel) {
    return `${line.count} ${line.unitLabel}`
  }
  if (line.count !== 1) {
    return `×${line.count}`
  }
  return ''
}

function collectPenaltyBlocks(
  effectiveInputs: RawExerciseInput[],
  level: CompetitionLevel,
  exerciseOrder?: ExerciseId[] | null,
): { group: ExerciseGroup; blocks: ExercisePenaltyBlock[] }[] {
  const result: { group: ExerciseGroup; blocks: ExercisePenaltyBlock[] }[] = []

  for (const group of groups) {
    const exercises = getExercisesByGroup(level, group, exerciseOrder)
    const blocks: ExercisePenaltyBlock[] = []

    for (const def of exercises) {
      const input = effectiveInputs.find((i) => i.exerciseId === def.id)
      if (!input) continue
      if (def.getMaxScore(level, input.jumpParams) === 0) continue

      const described = describeExercisePenalties(input, def, level)
      if (described.lines.length === 0 && described.ovDeduction === 0) continue

      blocks.push({ definition: def, described })
    }

    if (blocks.length > 0) {
      result.push({ group, blocks })
    }
  }

  return result
}

function ParticipantBlock({
  entry,
  effectiveInputs,
  exerciseOrder,
}: {
  entry: RankedWithParticipant
  effectiveInputs: RawExerciseInput[]
  exerciseOrder?: ExerciseId[] | null
}) {
  const level = entry.participant.level
  const grouped = collectPenaltyBlocks(effectiveInputs, level, exerciseOrder)
  const isEmpty = grouped.length === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-lg">
            <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'} className="mr-2 align-middle">
              {entry.rank}
            </Badge>
            <span className="font-medium">{entry.participant.handler.name}</span>
            <span className="text-muted-foreground font-normal"> — {entry.participant.dog.name}</span>
          </CardTitle>
          <p className="text-muted-foreground text-sm tabular-nums">
            Итого:{' '}
            <span className="font-semibold text-foreground">{entry.total.grandTotal}</span> /{' '}
            {entry.total.maxTotal}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        {isEmpty ? (
          <p className="text-muted-foreground text-center text-sm">Штрафы не зафиксированы</p>
        ) : (
          grouped.map(({ group, blocks }) => (
            <section
              key={group}
              className="bg-muted/30 rounded-xl border border-border p-4 shadow-xs"
            >
              <h3 className="text-foreground mb-3 border-b border-border/60 pb-2 text-sm font-semibold tracking-wide uppercase">
                {groupLabels[group]}
              </h3>
              <div className="divide-border/70 divide-y">
                {blocks.map(({ definition: def, described }) => (
                  <div key={def.id} className="pt-4 first:pt-0">
                    <p className="text-foreground mb-2 text-sm font-semibold">{def.name}</p>
                    <ul className="space-y-1.5 pl-0">
                      {described.lines.map((line) => {
                        const cap = formatPenaltyLineCaption(line)
                        return (
                          <li
                            key={line.penaltyId}
                            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
                          >
                            <span className="text-muted-foreground min-w-0 flex-1">
                              {line.description}
                              {cap ? (
                                <span className="text-muted-foreground/90"> ({cap})</span>
                              ) : null}
                            </span>
                            <span className="text-destructive shrink-0 font-semibold tabular-nums">
                              −{line.deduction}
                            </span>
                          </li>
                        )
                      })}
                      {described.ovDeduction > 0 ? (
                        <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                          <span className="text-muted-foreground min-w-0 flex-1">
                            Общий выговор (ОВ)
                            {described.ovPenaltyInput > described.ovDeduction ? (
                              <span className="text-muted-foreground/80">
                                {' '}
                                (введено {described.ovPenaltyInput}, учтено не более 10% от упражнения)
                              </span>
                            ) : null}
                          </span>
                          <span className="text-destructive shrink-0 font-semibold tabular-nums">
                            −{described.ovDeduction}
                          </span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function ParticipantPenaltiesPanel({ entries, getEffectiveInputs, exerciseOrder }: Props) {
  return (
    <div className="space-y-6">
      {entries.map((entry) => {
        const inputs = getEffectiveInputs(entry.participantId) ?? []
        return (
          <ParticipantBlock
            key={entry.participantId}
            entry={entry}
            effectiveInputs={inputs}
            exerciseOrder={exerciseOrder}
          />
        )
      })}
    </div>
  )
}
