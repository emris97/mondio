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
import { applyDerivedInputs, calculateExerciseScore, calculateCompetitionTotal, rankParticipants } from '@/entities/exercise/engine'
import type { ParticipantResult, RankedEntry } from '@/entities/score/types'
import type { Participant } from '@/entities/participant/types'
import type { CompetitionLevel } from '@/shared/types'

const levelLabels: Record<CompetitionLevel, string> = { 1: 'I', 2: 'II', 3: 'III' }

type RankedWithParticipant = RankedEntry & { participant: Participant }

function ResultsTable({ entries }: { entries: RankedWithParticipant[] }) {
  return (
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
        {entries.map((entry) => (
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
  )
}

export function ResultsPage() {
  const { id } = useParams({ from: '/competition/$id/results' })
  const { data: competition } = useCompetition(id)
  const { data: participants = [] } = useParticipantsByCompetition(id)
  const { data: scoreRecords = [] } = useScoresByCompetition(id)

  const rankedByLevel = useMemo(() => {
    const participantMap = new Map(participants.map((p) => [p.id, p]))

    const resultsByLevel = new Map<CompetitionLevel, ParticipantResult[]>()

    for (const record of scoreRecords) {
      const participant = participantMap.get(record.participantId)
      if (!participant) continue

      const level = participant.level

      const effectiveInputs = applyDerivedInputs(record.inputs, level)
      const scores = effectiveInputs
        .map((input) => {
          const def = getExerciseDefinition(input.exerciseId)
          if (!def) return null
          return calculateExerciseScore(input, def, level)
        })
        .filter(Boolean)

      const result: ParticipantResult = {
        participantId: record.participantId,
        total: calculateCompetitionTotal(scores.filter((s) => s !== null), level),
      }

      const existing = resultsByLevel.get(level) ?? []
      existing.push(result)
      resultsByLevel.set(level, existing)
    }

    const grouped: { level: CompetitionLevel; entries: RankedWithParticipant[] }[] = []

    for (const level of [1, 2, 3] as CompetitionLevel[]) {
      const results = resultsByLevel.get(level)
      if (!results?.length) continue

      const rankedEntries = rankParticipants(results)
        .map((entry) => ({
          ...entry,
          participant: participantMap.get(entry.participantId)!,
        }))
        .filter((e) => e.participant)

      grouped.push({ level, entries: rankedEntries })
    }

    return grouped
  }, [scoreRecords, participants])

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

      {rankedByLevel.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              Нет данных об оценках. Введите оценки участникам.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rankedByLevel.map(({ level, entries }) => (
            <Card key={level}>
              <CardHeader>
                <CardTitle>Уровень {levelLabels[level]}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsTable entries={entries} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
