import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompetition } from '@/entities/competition/model/queries'
import { useParticipantsByCompetition, useDeleteParticipant } from '@/entities/participant/model/queries'
import { AddParticipantDialog } from './add-participant-dialog'

const levelLabels = { 1: 'I', 2: 'II', 3: 'III' } as const

export function CompetitionPage() {
  const { id } = useParams({ from: '/competition/$id' })
  const { data: competition } = useCompetition(id)
  const { data: participants = [] } = useParticipantsByCompetition(id)
  const deleteParticipant = useDeleteParticipant()
  const [addOpen, setAddOpen] = useState(false)

  if (!competition) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">Соревнование не найдено</p>
        <Link to="/">
          <Button variant="link" className="mt-2 px-0">← К списку</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-2">
        <Link to="/">
          <Button variant="link" className="px-0 text-muted-foreground">← Соревнования</Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{competition.name}</h1>
          <p className="text-muted-foreground mt-1">
            {competition.location} · {new Date(competition.date).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          Уровень {levelLabels[competition.level]}
        </Badge>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={() => setAddOpen(true)}>Добавить участника</Button>
        <Link to="/competition/$id/results" params={{ id }}>
          <Button variant="outline">Результаты</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Участники ({participants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет участников. Нажмите «Добавить участника».
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">№</TableHead>
                  <TableHead>Проводник</TableHead>
                  <TableHead>Собака</TableHead>
                  <TableHead>Порода</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants
                  .sort((a, b) => a.startOrder - b.startOrder)
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.startOrder}</TableCell>
                      <TableCell>{p.handler.name}</TableCell>
                      <TableCell>{p.dog.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.dog.breed}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link to="/competition/$id/participant/$pid" params={{ id, pid: p.id }}>
                            <Button size="sm">Оценка</Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Удалить участника?')) {
                                deleteParticipant.mutate(p)
                              }
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddParticipantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        competitionId={id}
        nextOrder={participants.length + 1}
      />
    </div>
  )
}
