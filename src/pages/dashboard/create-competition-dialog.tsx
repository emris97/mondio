import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateCompetition } from '@/entities/competition/model/queries'
import type { CompetitionLevel } from '@/shared/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCompetitionDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [location, setLocation] = useState('')
  const [level, setLevel] = useState<CompetitionLevel>(1)
  const createCompetition = useCreateCompetition()
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (!name.trim()) return
    createCompetition.mutate(
      { name: name.trim(), date, location: location.trim(), level },
      {
        onSuccess: (competition) => {
          onOpenChange(false)
          setName('')
          setLocation('')
          navigate({ to: '/competition/$id', params: { id: competition.id } })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новое соревнование</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Название</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Чемпионат региона" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Дата</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Место</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Москва" />
          </div>
          <div className="grid gap-2">
            <Label>Уровень</Label>
            <Select value={String(level)} onValueChange={(v) => setLevel(Number(v) as CompetitionLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Уровень I (200 баллов)</SelectItem>
                <SelectItem value="2">Уровень II (300 баллов)</SelectItem>
                <SelectItem value="3">Уровень III (400 баллов)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
