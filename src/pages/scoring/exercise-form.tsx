import { useEffect, useState } from 'react'
import { ChevronDown, MinusIcon, PlusIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getPenaltyAmount,
  getPenaltyDescription,
  getPenaltyPoints,
  type ExerciseDefinition,
  type PenaltyRule,
} from '@/entities/exercise/types'
import type { RawExerciseInput } from '@/entities/score/types'
import type { CompetitionLevel } from '@/shared/types'
import { calculateExerciseScore } from '@/entities/exercise/engine'
import { cn } from '@/lib/utils'
import { useRepeatAdvance } from './use-repeat-advance'

const MAX_PENALTY_COUNT = 999

/** Базовый балл «Посыл вперёд» по зоне (правила: 12 / 8 / 4) */
const SEND_AWAY_BASE_SCORES = [12, 8, 4] as const

function isSendAwayBaseScore(n: number): n is (typeof SEND_AWAY_BASE_SCORES)[number] {
  return (SEND_AWAY_BASE_SCORES as readonly number[]).includes(n)
}

function clampRoundOv(value: number, max: number) {
  const rounded = Math.round(value * 10) / 10
  return Math.min(Math.max(rounded, 0), max)
}

type CountStepperProps = {
  value: number
  min: number
  max: number
  disabled?: boolean
  onChange: (n: number) => void
  'aria-label'?: string
}

function CountStepper({ value, min, max, disabled, onChange, 'aria-label': ariaLabel }: CountStepperProps) {
  const dec = useRepeatAdvance(() => onChange(Math.max(value - 1, min)), {
    disabled: disabled || value <= min,
  })
  const inc = useRepeatAdvance(() => onChange(Math.min(value + 1, max)), {
    disabled: disabled || value >= max,
  })

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={ariaLabel}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="min-h-10 min-w-10 shrink-0 touch-manipulation"
        disabled={disabled || value <= min}
        aria-label="Уменьшить"
        {...dec}
      >
        <MinusIcon className="size-4" />
      </Button>
      <span className="min-w-[2.5rem] text-center text-base font-semibold tabular-nums">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="min-h-10 min-w-10 shrink-0 touch-manipulation"
        disabled={disabled || value >= max}
        aria-label="Увеличить"
        {...inc}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  )
}

type OvPenaltyFieldProps = {
  value: number
  max: number
  disabled: boolean
  onCommit: (v: number) => void
}

function OvPenaltyField({ value, max, disabled, onCommit }: OvPenaltyFieldProps) {
  const [exactOpen, setExactOpen] = useState(false)
  const dec = useRepeatAdvance(
    () => {
      onCommit(clampRoundOv(value - 0.1, max))
    },
    { disabled: disabled || value <= 0 },
  )
  const inc = useRepeatAdvance(
    () => {
      onCommit(clampRoundOv(value + 0.1, max))
    },
    { disabled: disabled || value >= max },
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5" role="group" aria-label="ОВ-штраф">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-10 min-w-10 shrink-0 touch-manipulation"
            disabled={disabled || value <= 0}
            aria-label="Уменьшить ОВ на 0,1"
            {...dec}
          >
            <MinusIcon className="size-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-base font-semibold tabular-nums">{value.toFixed(1)}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-10 min-w-10 shrink-0 touch-manipulation"
            disabled={disabled || value >= max}
            aria-label="Увеличить ОВ на 0,1"
            {...inc}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 touch-manipulation px-2 text-xs"
          disabled={disabled}
          onClick={() => setExactOpen((o) => !o)}
        >
          {exactOpen ? 'Скрыть ввод' : 'Точное значение'}
        </Button>
      </div>
      {exactOpen && (
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          value={Number.isFinite(value) ? String(value) : ''}
          onChange={(e) => {
            const raw = e.target.value.replace(',', '.')
            if (raw === '' || raw === '-' || raw === '.') {
              onCommit(0)
              return
            }
            const n = Number(raw)
            if (Number.isNaN(n)) return
            onCommit(clampRoundOv(n, max))
          }}
          className="max-w-xs font-medium tabular-nums"
          aria-label="Точное значение ОВ-штрафа"
        />
      )}
    </div>
  )
}

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

  const renderRuleDescription = (rule: PenaltyRule) => {
    const pts = getPenaltyAmount(rule, level, maxScore)
    return (
      <span className="whitespace-pre-line text-xs text-muted-foreground leading-snug">
        {getPenaltyDescription(rule, level)}
        <span className="font-medium text-foreground">
          {' '}
          (−{pts}
          {rule.perUnit ? `/${rule.unitLabel}` : ''})
        </span>
      </span>
    )
  }

  const quantityCaption = (rule: PenaltyRule, pts: number) => {
    if (rule.perUnit && rule.unitLabel) {
      return `Штраф −${pts} за каждую ${rule.unitLabel}`
    }
    return `Штраф −${pts} за каждое нарушение`
  }

  const ruleZeroesExercise = (rule: PenaltyRule) =>
    Boolean(rule.binary && (rule.voidExercise || getPenaltyPoints(rule, level) >= maxScore))

  const isDisabled = (rule: PenaltyRule) => {
    return zeroedBy && !ruleZeroesExercise(rule)
  }

  return (
    <div className="space-y-2">
      {binaryRules.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {binaryRules.map((rule) => {
            const id = `penalty-${rule.id}`
            return (
              <label
                key={rule.id}
                htmlFor={id}
                className={cn(
                  'flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors',
                  isDisabled(rule) ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted/50 active:bg-muted/70',
                )}
              >
                <Checkbox
                  id={id}
                  checked={getPenaltyCount(rule.id) > 0}
                  disabled={isDisabled(rule)}
                  onCheckedChange={(checked) => onUpdate(rule.id, checked ? 1 : 0)}
                  className="shrink-0"
                />
                <span className="min-w-0 flex-1">{renderRuleDescription(rule)}</span>
              </label>
            )
          })}
        </div>
      )}

      {countRules.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {countRules.map((rule) => {
            const count = getPenaltyCount(rule.id)
            const pts = getPenaltyAmount(rule, level, maxScore)
            const lineTotal = pts * count
            const disabled = isDisabled(rule)
            return (
              <div
                key={rule.id}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm',
                  disabled && 'pointer-events-none opacity-40',
                )}
              >
                <h4 className="whitespace-pre-line text-sm font-semibold leading-tight text-foreground">
                  {getPenaltyDescription(rule, level)}
                </h4>
                <p className="text-[11px] leading-snug text-muted-foreground">{quantityCaption(rule, pts)}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <CountStepper
                    value={count}
                    min={0}
                    max={MAX_PENALTY_COUNT}
                    disabled={disabled}
                    onChange={(n) => onUpdate(rule.id, n)}
                    aria-label={`Количество: ${getPenaltyDescription(rule, level)}`}
                  />
                  {count > 0 && (
                    <p className="text-sm font-semibold tabular-nums text-destructive">−{lineTotal}</p>
                  )}
                </div>
              </div>
            )
          })}
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
  /** Состояние «развёрнуто» снаружи — чтобы не сбрасывалось при размонтировании (вкладки) */
  collapsibleOpen?: boolean
  onCollapsibleOpenChange?: (open: boolean) => void
}

export function ExerciseForm({
  definition,
  level,
  input,
  onChange,
  collapsibleOpen,
  onCollapsibleOpenChange,
}: Props) {
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    if (definition.id !== 'sendAway') return
    const v = input.componentScores.total ?? 12
    if (!isSendAwayBaseScore(v)) {
      onChange({
        ...input,
        componentScores: { ...input.componentScores, total: 12 },
      })
    }
  }, [definition.id, input, onChange])

  const breakdown = definition.scoringBreakdown(level)
  const maxScore = definition.getMaxScore(level, input.jumpParams)
  /** Совпадает с движком: `Math.min(ovPenalty, maxScore * 0.1)` */
  const maxOvDeduction = maxScore * 0.1
  /** Для подписи — один знак, без ошибки `Math.round(0.6) === 1` */
  const maxOvLabel = Math.round(maxOvDeduction * 10) / 10
  const score = calculateExerciseScore(input, definition, level)

  const editableComponents = breakdown.filter((c) => !c.fixed && !c.readonly)

  const getPenaltyRule = (penaltyId: string) => {
    return definition.penaltyTable.find((r) => r.id === penaltyId)
  }

  const getPenaltyCount = (penaltyId: string): number => {
    return input.penalties.find((p) => p.penaltyId === penaltyId)?.count ?? 0
  }

  const getPhasePenaltyTotal = (componentId: string): number => {
    return input.penalties.reduce((sum, p) => {
      const rule = getPenaltyRule(p.penaltyId)
      if (!rule || rule.appliesTo !== componentId) return sum
      return sum + getPenaltyAmount(rule, level, maxScore) * p.count
    }, 0)
  }

  const isZeroingPenalty = (ruleId: string) => {
    const rule = definition.penaltyTable.find((r) => r.id === ruleId)
    if (!rule) return false
    return Boolean(rule.binary && (rule.voidExercise || getPenaltyPoints(rule, level) >= maxScore))
  }

  const zeroedBy = definition.penaltyTable.find(
    (rule) =>
      getPenaltyCount(rule.id) > 0 &&
      Boolean(rule.binary && (rule.voidExercise || getPenaltyPoints(rule, level) >= maxScore)),
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

  const hasPenaltiesOrOv = input.penalties.length > 0 || input.ovPenalty > 0

  const resetPenaltiesAndOv = () => {
    onChange({ ...input, penalties: [], ovPenalty: 0 })
    setResetOpen(false)
  }

  const hasPhasedPenalties = definition.penaltyTable.some((r) => r.appliesTo)
  const globalPenalties = definition.penaltyTable.filter((r) => !r.appliesTo)

  const renderComponentWithPenalties = (
    comp: (typeof breakdown)[number],
    options?: { showHeader?: boolean },
  ) => {
    const showHeader = options?.showHeader ?? true
    const phasePenalties = definition.penaltyTable.filter((r) => r.appliesTo === comp.id)
    const isEditable = !comp.fixed && !comp.readonly
    const base = comp.fixed ? comp.maxScore : (input.componentScores[comp.id] ?? comp.maxScore)
    const phasePenaltyTotal = getPhasePenaltyTotal(comp.id)
    const phaseRemaining = Math.max(base - phasePenaltyTotal, 0)

    return (
      <div key={comp.id} className="space-y-1.5">
        {showHeader && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">{comp.label}</Label>
            <Badge variant={phaseRemaining === comp.maxScore ? 'secondary' : 'default'}>
              {phaseRemaining} / {comp.maxScore}
            </Badge>
          </div>
        )}
        {isEditable ? (
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Балл фазы</Label>
            <CountStepper
              value={input.componentScores[comp.id] ?? comp.maxScore}
              min={0}
              max={comp.maxScore}
              disabled={!!zeroedBy}
              onChange={(n) => updateComponent(comp.id, n)}
              aria-label={`Балл фазы: ${comp.label}`}
            />
          </div>
        ) : comp.readonly ? (
          <p className="text-xs text-muted-foreground">
            Балл фазы:{' '}
            <span className="font-medium text-foreground">{Math.round(input.componentScores[comp.id] ?? comp.maxScore)}</span>
          </p>
        ) : null}
        {phasePenalties.length > 0 && phasePenaltyTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            Штрафы фазы: <span className="text-destructive">−{phasePenaltyTotal}</span>
            {phasePenaltyTotal > base ? <span className="ml-1">(ограничено до 0)</span> : null}
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

  const collapsibleProps =
    onCollapsibleOpenChange != null
      ? { open: collapsibleOpen ?? false, onOpenChange: onCollapsibleOpenChange }
      : { defaultOpen: false as const }

  return (
    <Collapsible {...collapsibleProps}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <CollapsibleTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'group shrink-0 text-muted-foreground hover:text-foreground',
              )}
              aria-label="Свернуть или развернуть упражнение"
            >
              <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-aria-expanded:rotate-180" />
            </CollapsibleTrigger>
            <CardTitle className="min-w-0 text-base leading-tight">{definition.name}</CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={score.finalScore === maxScore ? 'default' : 'secondary'}>
              {score.finalScore} / {maxScore}
            </Badge>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">
        {hasPhasedPenalties ? (
          <>
            <Tabs defaultValue={getDefaultPhaseTab()} className="gap-2">
              <TabsList className="w-full" variant="line">
                {breakdown.map((comp) => {
                  const base = comp.fixed ? comp.maxScore : (input.componentScores[comp.id] ?? comp.maxScore)
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
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium leading-none">Общие штрафы</p>
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
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {editableComponents.map((comp) => {
                  const isSendAwayBase =
                    definition.id === 'sendAway' && comp.id === 'total'
                  const baseValue = input.componentScores[comp.id] ?? comp.maxScore
                  return (
                    <div key={comp.id} className="grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">{comp.label}</Label>
                      {isSendAwayBase ? (
                        <Tabs
                          value={String(isSendAwayBaseScore(baseValue) ? baseValue : 12)}
                          onValueChange={(v) => updateComponent(comp.id, Number(v))}
                          className="gap-2"
                        >
                          <TabsList className="grid w-full grid-cols-3">
                            {SEND_AWAY_BASE_SCORES.map((n) => (
                              <TabsTrigger
                                key={n}
                                value={String(n)}
                                disabled={!!zeroedBy}
                                className="touch-manipulation"
                              >
                                {n}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      ) : (
                        <CountStepper
                          value={baseValue}
                          min={0}
                          max={comp.maxScore}
                          disabled={!!zeroedBy}
                          onChange={(n) => updateComponent(comp.id, n)}
                          aria-label={`Балл: ${comp.label}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {definition.penaltyTable.length > 0 && (
              <>
                {editableComponents.length > 0 && <Separator />}
                <div>
                  <p className="mb-1.5 text-sm font-medium leading-none">Штрафы</p>
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

        {hasPenaltiesOrOv && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => setResetOpen(true)}>
              Сбросить штрафы и ОВ
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Label className="text-xs text-muted-foreground">
              ОВ-штраф <span className="font-medium text-foreground">(макс. {maxOvLabel})</span>
            </Label>
            <OvPenaltyField
              value={input.ovPenalty}
              max={maxOvDeduction}
              disabled={!!zeroedBy}
              onCommit={(v) => onChange({ ...input, ovPenalty: v })}
            />
          </div>
          <div className="flex flex-col gap-0.5 sm:pt-4">
            {!zeroedBy && score.penaltyTotal > 0 && (
              <span className="text-xs text-destructive">Штрафы: −{score.penaltyTotal}</span>
            )}
            {!zeroedBy && score.ovDeduction > 0 && (
              <span className="text-xs text-destructive">ОВ: −{score.ovDeduction}</span>
            )}
          </div>
        </div>
          </CardContent>
        </CollapsibleContent>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сбросить штрафы и ОВ?</DialogTitle>
            <DialogDescription>
              Будут очищены все отмеченные штрафы по этому упражнению и значение ОВ-штрафа. Баллы фаз не изменятся.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Отмена
            </Button>
            <Button type="button" variant="destructive" onClick={resetPenaltiesAndOv}>
              Сбросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </Card>
    </Collapsible>
  )
}
