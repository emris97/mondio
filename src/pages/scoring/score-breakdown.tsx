import { Card, CardContent } from '@/components/ui/card'
import type { CompetitionTotal } from '@/entities/score/types'

type Props = {
  total: CompetitionTotal
}

const groupLabels = {
  obedience: 'Послушание',
  jumps: 'Прыжки',
  bite: 'Хватка',
} as const

export function ScoreBreakdown({ total }: Props) {
  const groups = [total.obedience, total.jumps, total.bite] as const

  return (
    <div className="grid grid-cols-3 gap-4">
      {groups.map((group) => (
        <Card key={group.group}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-muted-foreground">{groupLabels[group.group]}</p>
            <p className="text-2xl font-bold">{group.total}</p>
            <p className="text-xs text-muted-foreground">из {group.maxTotal}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
