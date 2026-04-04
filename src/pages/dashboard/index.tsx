import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompetitions, useDeleteCompetition } from '@/entities/competition/model/queries'
import { CreateCompetitionDialog } from './create-competition-dialog'
import { ImportExportButtons } from './import-export'

export function DashboardPage() {
  const { data: competitions = [], isLoading } = useCompetitions()
  const deleteCompetition = useDeleteCompetition()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Соревнования</h1>
        <div className="flex gap-2">
          <ImportExportButtons />
          <Link to="/settings">
            <Button variant="outline">Настройки</Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)}>Создать</Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Загрузка...</p>}

      {!isLoading && competitions.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Нет соревнований. Нажмите «Создать», чтобы начать.
        </div>
      )}

      <div className="grid gap-4">
        {competitions.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">
                  <Link
                    to="/competition/$id"
                    params={{ id: c.id }}
                    className="hover:underline"
                  >
                    {c.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {c.location} · {new Date(c.date).toLocaleDateString('ru-RU')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Участников: {c.participantIds.length}
                </span>
                <div className="flex gap-2">
                  <Link to="/competition/$id/results" params={{ id: c.id }}>
                    <Button variant="outline" size="sm">Результаты</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Удалить соревнование?')) {
                        deleteCompetition.mutate(c.id)
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateCompetitionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
