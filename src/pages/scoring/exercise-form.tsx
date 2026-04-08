import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  const getPenaltyRule = (penaltyId: string) => {
    return definition.penaltyTable.find((r) => r.id === penaltyId)
  }

  const getPenaltyCount = (penaltyId: string): number => {
    return input.penalties.find((p) => p.penaltyId === penaltyId)?.count ?? 0
  }

  const getPenaltyAmount = (penaltyId: string): number => {
    const rule = getPenaltyRule(penaltyId)
    if (!rule) return 0
    return getPenaltyPoints(rule, level) * getPenaltyCount(penaltyId)
  }

  const getPhasePenaltyTotal = (componentId: string): number => {
    return input.penalties.reduce((sum, p) => {
      const rule = getPenaltyRule(p.penaltyId)
      if (!rule || rule.appliesTo !== componentId) return sum
      return sum + getPenaltyPoints(rule, level) * p.count
    }, 0)
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

  const hasPhasedPenalties = definition.penaltyTable.some((r) => r.appliesTo)
  const globalPenalties = definition.penaltyTable.filter((r) => !r.appliesTo)

  const renderComponentWithPenalties = (
    comp: (typeof breakdown)[number],
    options?: { showHeader?: boolean },
  ) => {
    const showHeader = options?.showHeader ?? true
    const phasePenalties = definition.penaltyTable.filter((r) => r.appliesTo === comp.id)
    const isEditable = !comp.fixed
    const base = isEditable ? (input.componentScores[comp.id] ?? comp.maxScore) : comp.maxScore
    const phasePenaltyTotal = getPhasePenaltyTotal(comp.id)
    const phaseRemaining = Math.max(base - phasePenaltyTotal, 0)

    return (
      <div key={comp.id} className="space-y-2">
        {showHeader && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">{comp.label}</Label>
            <Badge variant={phaseRemaining === comp.maxScore ? 'secondary' : 'default'}>
              {phaseRemaining} / {comp.maxScore}
            </Badge>
          </div>
        )}
        {isEditable ? (
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Балл фазы</Label>
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
        ) : null}
          {phasePenalties.length > 0 && phasePenaltyTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              Штрафы фазы: <span className="text-destructive">−{phasePenaltyTotal}</span>
              {phasePenaltyTotal > base ? (
                <span className="ml-1">(ограничено до 0)</span>
              ) : null}
            </p>
          )}
        {phasePenalties.length > 0 && (
          <PenaltyGroup
            rules={phasePenalties}
            level={level}
            maxScore={maxScore}
            zeroedBy={!!zeroedBy}
            getPenaltyCount={getPenaltyCount}
            onUpdate={updatePenalty}
          />
        )}
      </div>
    )
  }

  const getDefaultPhaseTab = (): string => {
    const withPenalty = breakdown.find((c) => getPhasePenaltyTotal(c.id) > 0)
    return withPenalty?.id ?? breakdown[0]?.id ?? 'phase'
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
        {hasPhasedPenalties ? (
          <>
            {zeroedBy && (
              <p className="text-xs text-destructive">
                Упражнение обнулено: {zeroedBy.description}
              </p>
            )}
            <Tabs defaultValue={getDefaultPhaseTab()} className="gap-3">
              <TabsList className="w-full" variant="line">
                {breakdown.map((comp) => {
                  const isEditable = !comp.fixed
                  const base = isEditable ? (input.componentScores[comp.id] ?? comp.maxScore) : comp.maxScore
                  const phasePenaltyTotal = getPhasePenaltyTotal(comp.id)
                  const phaseRemaining = Math.max(base - phasePenaltyTotal, 0)
                  return (
                    <TabsTrigger key={comp.id} value={comp.id} className="justify-between px-2">
                      <span className="truncate">{comp.label}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {phaseRemaining}/{comp.maxScore}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {breakdown.map((comp) => (
                <TabsContent key={comp.id} value={comp.id} className="mt-1">
                  {renderComponentWithPenalties(comp, { showHeader: false })}
                </TabsContent>
              ))}
            </Tabs>
            {globalPenalties.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">Общие штрафы</p>
                    <p className="text-xs text-muted-foreground">вычитаются из итога упражнения</p>
                  </div>
                  <PenaltyGroup
                    rules={globalPenalties}
                    level={level}
                    maxScore={maxScore}
                    zeroedBy={!!zeroedBy}
                    getPenaltyCount={getPenaltyCount}
                    onUpdate={updatePenalty}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
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
