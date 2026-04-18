import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Competition } from '@/entities/competition/types'
import { useUpdateCompetition } from '@/entities/competition/model/queries'
import {
  EXERCISE_GROUP_SEQUENCE,
  getExerciseDefinition,
  normalizeLevelExerciseOrder,
} from '@/entities/exercise/config'
import type { CompetitionLevel, ExerciseGroup, ExerciseId } from '@/shared/types'

const levelTabLabels: Record<CompetitionLevel, string> = { 1: 'Уровень I', 2: 'Уровень II', 3: 'Уровень III' }

const groupSectionTitles: Record<ExerciseGroup, string> = {
  obedience: 'Послушание',
  jumps: 'Прыжки',
  bite: 'Хватка',
}

type GroupOrders = Record<ExerciseGroup, ExerciseId[]>

function splitByGroups(level: CompetitionLevel, flat?: ExerciseId[] | null): GroupOrders {
  const normalized = normalizeLevelExerciseOrder(level, flat)
  return {
    obedience: normalized.filter((id) => getExerciseDefinition(id)?.group === 'obedience'),
    jumps: normalized.filter((id) => getExerciseDefinition(id)?.group === 'jumps'),
    bite: normalized.filter((id) => getExerciseDefinition(id)?.group === 'bite'),
  }
}

function buildOrdersFromCompetition(c: Competition): Record<CompetitionLevel, GroupOrders> {
  return {
    1: splitByGroups(1, c.exerciseOrderByLevel?.[1]),
    2: splitByGroups(2, c.exerciseOrderByLevel?.[2]),
    3: splitByGroups(3, c.exerciseOrderByLevel?.[3]),
  }
}

function flattenGroupOrders(o: GroupOrders): ExerciseId[] {
  return [...o.obedience, ...o.jumps, ...o.bite]
}

type SortableRowProps = { id: ExerciseId }

function SortableExerciseRow({ id }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const def = getExerciseDefinition(id)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm shadow-xs ${
        isDragging ? 'opacity-80' : ''
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Переместить"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="min-w-0 flex-1 truncate text-left" title={def?.name ?? id}>
        {def?.name ?? id}
      </span>
    </div>
  )
}

type PanelProps = {
  competition: Competition
  onOpenChange: (open: boolean) => void
}

function ExerciseOrderPanel({ competition, onOpenChange }: PanelProps) {
  const updateCompetition = useUpdateCompetition()
  const [orders, setOrders] = useState<Record<CompetitionLevel, GroupOrders>>(() =>
    buildOrdersFromCompetition(competition),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd =
    (level: CompetitionLevel, group: ExerciseGroup) => (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      setOrders((prev) => {
        const list = prev[level][group]
        const oldIndex = list.indexOf(active.id as ExerciseId)
        const newIndex = list.indexOf(over.id as ExerciseId)
        if (oldIndex < 0 || newIndex < 0) return prev
        return {
          ...prev,
          [level]: {
            ...prev[level],
            [group]: arrayMove(list, oldIndex, newIndex),
          },
        }
      })
    }

  const handleSave = () => {
    updateCompetition.mutate({
      ...competition,
      exerciseOrderByLevel: {
        1: flattenGroupOrders(orders[1]),
        2: flattenGroupOrders(orders[2]),
        3: flattenGroupOrders(orders[3]),
      },
    })
    onOpenChange(false)
  }

  const handleResetLevel = (level: CompetitionLevel) => {
    setOrders((prev) => ({
      ...prev,
      [level]: splitByGroups(level, null),
    }))
  }

  return (
    <>
      <DialogHeader className="space-y-1.5">
        <DialogTitle>Порядок упражнений</DialogTitle>
      </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Разделы всегда идут в порядке: послушание → прыжки → хватка. Менять порядок можно только внутри каждого
          раздела.
        </p>

        <Tabs defaultValue="1" className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <TabsList className="grid w-full shrink-0 grid-cols-3">
            {([1, 2, 3] as const).map((lvl) => (
              <TabsTrigger key={lvl} value={String(lvl)}>
                {levelTabLabels[lvl]}
              </TabsTrigger>
            ))}
          </TabsList>
          {([1, 2, 3] as const).map((lvl) => (
            <TabsContent
              key={lvl}
              value={String(lvl)}
              className="mt-0 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
            >
              <div className="flex shrink-0 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => handleResetLevel(lvl)}>
                  Сбросить к порядку реестра
                </Button>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                {EXERCISE_GROUP_SEQUENCE.map((group) => (
                  <section
                    key={group}
                    className="flex min-h-0 min-w-0 flex-col gap-2 rounded-lg border bg-muted/25 p-3 shadow-xs"
                  >
                    <h3 className="shrink-0 border-b border-border/70 pb-2 text-center text-sm font-semibold">
                      {groupSectionTitles[group]}
                    </h3>
                    <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd(lvl, group)}
                      >
                        <SortableContext items={orders[lvl][group]} strategy={verticalListSortingStrategy}>
                          <ul className="flex flex-col gap-2">
                            {orders[lvl][group].map((exerciseId) => (
                              <li key={exerciseId}>
                                <SortableExerciseRow id={exerciseId} />
                              </li>
                            ))}
                          </ul>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

      <DialogFooter className="shrink-0 gap-3 border-t border-border/60 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Отмена
        </Button>
        <Button type="button" onClick={handleSave} disabled={updateCompetition.isPending}>
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  competition: Competition
}

export function ExerciseOrderDialog({ open, onOpenChange, competition }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,900px)] w-[min(100%,72rem)] max-w-6xl flex-col gap-5 overflow-hidden p-6 sm:max-w-[min(100%,72rem)]">
        {open ? (
          <ExerciseOrderPanel
            key={`${competition.id}-${competition.updatedAt}`}
            competition={competition}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
