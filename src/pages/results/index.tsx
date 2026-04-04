import { useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompetition } from '@/entities/competition/model/queries'
import { useParticipantsByCompetition } from '@/entities/participant/model/queries'
import { useScoresByCompetition } from '@/entities/score/model/queries'
import { getExerciseDefinition } from '@/entities/exercise/config'
import { calculateExerciseScore, calculateCompetitionTotal, rankParticipants } from '@/entities/exercise/engine'
import type { ParticipantResult, RankedEntry } from '@/entities/score/types'
import type { Participant } from '@/entities/participant/types'

export function ResultsPage() {
  const { id } = useParams({ from: '/competition/$id/results' })
  const { data: competition } = useCompetition(id)
  const { data: participants = [] } = useParticipantsByCompetition(id)
  const { data: scoreRecords = [] } = useScoresByCompetition(id)

  const level = competition?.level ?? 1

  const ranked: (RankedEntry & { participant: Participant })[] = useMemo(() => {
    const results: ParticipantResult[] = scoreRecords.map((record) => {
      const scores = record.inputs
        .map((input) => {
          const def = getExerciseDefinition(input.exerciseId)
          if (!def) return null
          return calculateExerciseScore(input, def, level)
        })
        .filter(Boolean)

      return {
        participantId: record.participantId,
        total: calculateCompetitionTotal(scores.filter((s) => s !== null), level),
      }
    })

    const rankedEntries = rankParticipants(results)

    return rankedEntries
      .map((entry) => ({
        ...entry,
        participant: participants.find((p) => p.id === entry.participantId)!,
      }))
      .filter((e) => e.participant)
  }, [scoreRecords, participants, level])

  if (!competition) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-2">
        <Link to="/competition/$id" params={{ id }}>
          <Button variant="link" className="px-0 text-muted-foreground">← {competition.name}</Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-6">Результаты</h1>

      <Card>
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет данных об оценках. Введите оценки участникам.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Место</TableHead>
                  <TableHead>Проводник</TableHead>
                  <TableHead>Собака</TableHead>
                  <TableHead className="text-center">Послушание</TableHead>
                  <TableHead className="text-center">Прыжки</TableHead>
                  <TableHead className="text-center">Хватка</TableHead>
                  <TableHead className="text-right">Итого</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((entry) => (
                  <TableRow key={entry.participantId}>
                    <TableCell>
                      <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>
                        {entry.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{entry.participant.handler.name}</TableCell>
                    <TableCell>{entry.participant.dog.name}</TableCell>
                    <TableCell className="text-center">
                      {entry.total.obedience.total}/{entry.total.obedience.maxTotal}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.total.jumps.total}/{entry.total.jumps.maxTotal}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.total.bite.total}/{entry.total.bite.maxTotal}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {entry.total.grandTotal}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
