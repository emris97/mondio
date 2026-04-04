import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getPenaltyPoints, type ExerciseDefinition } from '@/entities/exercise/types'
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

  const editableComponents = breakdown.filter((c) => !c.fixed)

  const getPenaltyCount = (penaltyId: string): number => {
    return input.penalties.find((p) => p.penaltyId === penaltyId)?.count ?? 0
  }

  const isZeroingPenalty = (ruleId: string) => {
    const rule = definition.penaltyTable.find((r) => r.id === ruleId)
    return rule?.binary && getPenaltyPoints(rule, level) >= maxScore
  }

  const zeroedBy = definition.penaltyTable.find(
    (rule) => rule.binary && getPenaltyPoints(rule, level) >= maxScore && getPenaltyCount(rule.id) > 0,
  )

  const updateComponent = (componentId: string, value: number) => {
    onChange({
      ...input,
      componentScores: { ...input.componentScores, [componentId]: value },
    })
  }

  const updatePenalty = (penaltyId: string, count: number) => {
    if (isZeroingPenalty(penaltyId) && count > 0) {
      onChange({
        ...input,
        penalties: [{ penaltyId, count: 1 }],
        ovPenalty: 0,
      })
      return
    }

    const existing = input.penalties.filter((p) => p.penaltyId !== penaltyId)
    if (count > 0) {
      existing.push({ penaltyId, count })
    }
    onChange({ ...input, penalties: existing })
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
        {editableComponents.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {editableComponents.map((comp) => (
              <div key={comp.id} className="grid gap-1">
                <Label className="text-xs text-muted-foreground">
                  {comp.label}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={comp.maxScore}
                  step="any"
                  disabled={!!zeroedBy}
                  value={input.componentScores[comp.id] ?? 0}
                  onChange={(e) => updateComponent(comp.id, Math.min(Number(e.target.value) || 0, comp.maxScore))}
                  className="h-9"
                />
              </div>
            ))}
          </div>
        )}

        {definition.penaltyTable.length > 0 && (
          <>
            {editableComponents.length > 0 && <Separator />}
            <div>
              <p className="text-sm font-medium mb-2">Штрафы</p>
              {zeroedBy && (
                <p className="text-xs text-destructive mb-2">
                  Упражнение обнулено: {zeroedBy.description}
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {definition.penaltyTable.map((rule) => {
                  const pts = getPenaltyPoints(rule, level)
                  const isZeroing = rule.binary && pts >= maxScore
                  const disabled = !!zeroedBy && !isZeroing

                  return (
                    <div key={rule.id} className={`flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`}>
                      {rule.binary ? (
                        <Checkbox
                          checked={getPenaltyCount(rule.id) > 0}
                          disabled={disabled}
                          onCheckedChange={(checked) => updatePenalty(rule.id, checked ? 1 : 0)}
                        />
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          disabled={disabled}
                          value={getPenaltyCount(rule.id)}
                          onChange={(e) => updatePenalty(rule.id, Math.max(Number(e.target.value) || 0, 0))}
                          className="h-8 w-16 text-center"
                        />
                      )}
                      <span className="text-xs text-muted-foreground leading-tight">
                        {rule.description}
                        <span className="font-medium text-foreground"> (−{pts}{rule.perUnit ? `/${rule.unitLabel}` : ''})</span>
                      </span>
                    </div>
                  )
                })}
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
              disabled={!!zeroedBy}
              value={input.ovPenalty}
              onChange={(e) => onChange({ ...input, ovPenalty: Math.max(Number(e.target.value) || 0, 0) })}
              className="h-8 w-20"
            />
          </div>
          {!zeroedBy && score.penaltyTotal > 0 && (
            <span className="text-sm text-destructive">Штрафы: −{score.penaltyTotal}</span>
          )}
          {!zeroedBy && score.ovDeduction > 0 && (
            <span className="text-sm text-destructive">ОВ: −{score.ovDeduction}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
