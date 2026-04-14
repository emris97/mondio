import type { CompetitionLevel, ExerciseGroup, ExerciseId } from '@/shared/types'

export type JumpParams = {
  wallHeight?: 1.8 | 1.9 | 2.0 | 2.1 | 2.2 | 2.3
  longJumpLength?: 3.0 | 3.5 | 4.0
  palisadeHeight?: 1.0 | 1.1 | 1.2
}

export type ScoringComponent = {
  id: string
  label: string
  maxScore: number
  /** Балл всегда равен maxScore, ввод не нужен — снижение только через штрафы/ОВ */
  fixed?: boolean
  /** Балл рассчитывается автоматически (ввод судьи заблокирован) */
  readonly?: boolean
}

export type PenaltyRule = {
  id: string
  description: string
  points: number
  /** Баллы, отличающиеся по уровню (приоритет над `points`) */
  pointsByLevel?: Partial<Record<CompetitionLevel, number>>
  /** per-unit penalty (e.g. per meter, per second) */
  perUnit?: boolean
  unitLabel?: string
  /** Штраф бинарный (обнуляет или фиксированно снимает) — UI рендерит checkbox */
  binary?: boolean
  /** К какому компоненту (фазе) привязан штраф (id из scoringBreakdown). Если не указано — вычитается из общей суммы */
  appliesTo?: string
}

export function getPenaltyPoints(rule: PenaltyRule, level: CompetitionLevel): number {
  return rule.pointsByLevel?.[level] ?? rule.points
}

export type ExerciseDefinition = {
  id: ExerciseId
  name: string
  group: ExerciseGroup
  levels: CompetitionLevel[]
  getMaxScore: (level: CompetitionLevel, params?: JumpParams) => number
  scoringBreakdown: (level: CompetitionLevel) => ScoringComponent[]
  penaltyTable: PenaltyRule[]
}
