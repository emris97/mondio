import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ExerciseDefinition } from '@/entities/exercise/types'
import type { RawExerciseInput } from '@/entities/score/types'
import type { CompetitionLevel } from '@/shared/types'
import { calculateExerciseScore } from '@/entities/exercise/engine'

type Props = {
  definition: ExerciseDefinition
  level: CompetitionLevel
  input: RawExerciseInput
  onChange: (updated: RawExerciseInput) => void
}

export function ExerciseForm({ definition, level, input, onChange }: Props) {
  const breakdown = definition.scoringBreakdown(level)
  const maxScore = definition.getMaxScore(level, input.jumpParams)
  const score = calculateExerciseScore(input, definition, level)

  const updateComponent = (componentId: string, value: number) => {
    onChange({
      ...input,
      componentScores: { ...input.componentScores, [componentId]: value },
    })
  }

  const updatePenalty = (penaltyId: string, count: number) => {
    const existing = input.penalties.filter((p) => p.penaltyId !== penaltyId)
    if (count > 0) {
      existing.push({ penaltyId, count })
    }
    onChange({ ...input, penalties: existing })
  }

  const getPenaltyCount = (penaltyId: string): number => {
    return input.penalties.find((p) => p.penaltyId === penaltyId)?.count ?? 0
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{definition.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={score.finalScore === maxScore ? 'default' : 'secondary'}>
            {score.finalScore} / {maxScore}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {breakdown.map((comp) => (
            <div key={comp.id} className="grid gap-1">
              <Label className="text-xs text-muted-foreground">
                {comp.label} (макс {comp.maxScore})
              </Label>
              <Input
                type="number"
                min={0}
                max={comp.maxScore}
                step="any"
                value={input.componentScores[comp.id] ?? 0}
                onChange={(e) => updateComponent(comp.id, Math.min(Number(e.target.value) || 0, comp.maxScore))}
                className="h-9"
              />
            </div>
          ))}
        </div>

        {definition.penaltyTable.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Штрафы</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {definition.penaltyTable.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={getPenaltyCount(rule.id)}
                      onChange={(e) => updatePenalty(rule.id, Math.max(Number(e.target.value) || 0, 0))}
                      className="h-8 w-16 text-center"
                    />
                    <span className="text-xs text-muted-foreground leading-tight">
                      {rule.description}
                      <span className="font-medium text-foreground"> (−{rule.points}{rule.perUnit ? `/${rule.unitLabel}` : ''})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="flex items-center gap-4">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">ОВ-штраф (до 10%)</Label>
            <Input
              type="number"
              min={0}
              value={input.ovPenalty}
              onChange={(e) => onChange({ ...input, ovPenalty: Math.max(Number(e.target.value) || 0, 0) })}
              className="h-8 w-20"
            />
          </div>
          {score.penaltyTotal > 0 && (
            <span className="text-sm text-destructive">Штрафы: −{score.penaltyTotal}</span>
          )}
          {score.ovDeduction > 0 && (
            <span className="text-sm text-destructive">ОВ: −{score.ovDeduction}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
