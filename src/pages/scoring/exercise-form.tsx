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

type PenaltyGroupProps = {
  rules: ExerciseDefinition['penaltyTable']
  level: CompetitionLevel
  maxScore: number
  zeroedBy: boolean
  getPenaltyCount: (id: string) => number
  onUpdate: (penaltyId: string, count: number) => void
}

function PenaltyGroup({ rules, level, maxScore, zeroedBy, getPenaltyCount, onUpdate }: PenaltyGroupProps) {
  const binaryRules = rules.filter((r) => r.binary)
  const countRules = rules.filter((r) => !r.binary)

  const renderLabel = (rule: (typeof rules)[number]) => {
    const pts = getPenaltyPoints(rule, level)
    return (
      <span className="text-xs text-muted-foreground leading-tight">
        {rule.description}
        <span className="font-medium text-foreground"> (−{pts}{rule.perUnit ? `/${rule.unitLabel}` : ''})</span>
      </span>
    )
  }

  const isDisabled = (rule: (typeof rules)[number]) => {
    const pts = getPenaltyPoints(rule, level)
    const isZeroing = rule.binary && pts >= maxScore
    return zeroedBy && !isZeroing
  }

  return (
    <div className="space-y-3">
      {binaryRules.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {binaryRules.map((rule) => (
            <div key={rule.id} className={`flex items-center gap-2 ${isDisabled(rule) ? 'opacity-40' : ''}`}>
              <Checkbox
                checked={getPenaltyCount(rule.id) > 0}
                disabled={isDisabled(rule)}
                onCheckedChange={(checked) => onUpdate(rule.id, checked ? 1 : 0)}
              />
              {renderLabel(rule)}
            </div>
          ))}
        </div>
      )}

      {countRules.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {countRules.map((rule) => (
            <div key={rule.id} className={`flex items-center gap-2 ${isDisabled(rule) ? 'opacity-40' : ''}`}>
              <Input
                type="number"
                min={0}
                disabled={isDisabled(rule)}
                value={getPenaltyCount(rule.id)}
                onChange={(e) => onUpdate(rule.id, Math.max(Number(e.target.value) || 0, 0))}
                className="h-8 w-16 text-center"
              />
              {renderLabel(rule)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
                  value={input.componentScores[comp.id] ?? comp.maxScore}
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
              <PenaltyGroup
                rules={definition.penaltyTable}
                level={level}
                maxScore={maxScore}
                zeroedBy={!!zeroedBy}
                getPenaltyCount={getPenaltyCount}
                onUpdate={updatePenalty}
              />
            </div>
          </>
        )}

        <Separator />
        <div className="flex items-center gap-4">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">
              ОВ-штраф{' '}
              <span className="font-medium text-foreground">(макс. {Math.round(maxScore * 0.1 * 10) / 10})</span>
            </Label>
            <Input
              type="number"
              min={0}
              max={maxScore * 0.1}
              step={0.5}
              disabled={!!zeroedBy}
              value={input.ovPenalty}
              onChange={(e) => {
                const value = Math.round((Number(e.target.value) || 0) * 10) / 10
                onChange({ ...input, ovPenalty: Math.min(Math.max(value, 0), maxScore * 0.1) })
              }}
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
