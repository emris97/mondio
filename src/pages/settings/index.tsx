import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getExercisesForLevel } from '@/entities/exercise/config'
import type { CompetitionLevel, ExerciseGroup } from '@/shared/types'

const levelLabels: Record<CompetitionLevel, string> = { 1: 'Уровень I', 2: 'Уровень II', 3: 'Уровень III' }
const groupLabels: Record<ExerciseGroup, string> = { obedience: 'Послушание', jumps: 'Прыжки', bite: 'Хватка' }
const levelTotals: Record<CompetitionLevel, number> = { 1: 200, 2: 300, 3: 400 }

export function SettingsPage() {
  const [selectedLevel, setSelectedLevel] = useState<CompetitionLevel>(1)
  const exercises = getExercisesForLevel(selectedLevel)

  const groupTotals = exercises.reduce(
    (acc, ex) => {
      acc[ex.group] = (acc[ex.group] ?? 0) + ex.getMaxScore(selectedLevel)
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-2">
        <Link to="/">
          <Button variant="link" className="px-0 text-muted-foreground">← Соревнования</Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-6">Справочник упражнений</h1>

      <Tabs
        value={String(selectedLevel)}
        onValueChange={(v) => setSelectedLevel(Number(v) as CompetitionLevel)}
      >
        <TabsList>
          {([1, 2, 3] as const).map((lvl) => (
            <TabsTrigger key={lvl} value={String(lvl)}>
              {levelLabels[lvl]} ({levelTotals[lvl]} б.)
            </TabsTrigger>
          ))}
        </TabsList>

        {([1, 2, 3] as const).map((lvl) => (
          <TabsContent key={lvl} value={String(lvl)} className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {(['obedience', 'jumps', 'bite'] as const).map((group) => (
                <Card key={group}>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-sm text-muted-foreground">{groupLabels[group]}</p>
                    <p className="text-2xl font-bold">{groupTotals[group] ?? 0}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Упражнения</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Упражнение</TableHead>
                      <TableHead>Группа</TableHead>
                      <TableHead className="text-center">Макс. баллы</TableHead>
                      <TableHead className="text-center">Компоненты</TableHead>
                      <TableHead className="text-center">Штрафы</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exercises.map((ex) => (
                      <TableRow key={ex.id}>
                        <TableCell className="font-medium">{ex.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{groupLabels[ex.group]}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {ex.getMaxScore(lvl)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {ex.scoringBreakdown(lvl).map((c) => c.label).join(', ')}
                        </TableCell>
                        <TableCell className="text-center">
                          {ex.penaltyTable.length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
