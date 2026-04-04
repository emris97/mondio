import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAddParticipant } from '@/entities/participant/model/queries'
import {
  getAvailableWallHeights,
  getAvailableLongJumpLengths,
  getAvailablePalisadeHeights,
  getDefaultJumpParams,
} from '@/entities/exercise/config'
import type { RecallMethod } from '@/entities/participant/types'
import type { JumpParams } from '@/entities/exercise/types'
import type { CompetitionLevel } from '@/shared/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: string
  nextOrder: number
}

export function AddParticipantDialog({ open, onOpenChange, competitionId, nextOrder }: Props) {
  const [handlerName, setHandlerName] = useState('')
  const [country, setCountry] = useState('')
  const [dogName, setDogName] = useState('')
  const [breed, setBreed] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [level, setLevel] = useState<CompetitionLevel>(1)
  const [recallMethod, setRecallMethod] = useState<RecallMethod>('voice')
  const [jumpParams, setJumpParams] = useState<JumpParams>(() => getDefaultJumpParams(1))
  const addParticipant = useAddParticipant()

  const availableHeights = useMemo(() => {
    const wall = getAvailableWallHeights(level)
    const long = getAvailableLongJumpLengths(level)
    const palisade = getAvailablePalisadeHeights(level)
    return {
      wall,
      long,
      palisade,
      wallItems: Object.fromEntries(wall.map((h) => [String(h), h.toFixed(2)])),
      longItems: Object.fromEntries(long.map((l) => [String(l), l.toFixed(1)])),
      palisadeItems: Object.fromEntries(palisade.map((h) => [String(h), h.toFixed(2)])),
    }
  }, [level])

  const hasChoice = level > 1

  const handleLevelChange = (newLevel: CompetitionLevel) => {
    setLevel(newLevel)
    setJumpParams(getDefaultJumpParams(newLevel))
  }

  const reset = () => {
    setHandlerName('')
    setCountry('')
    setDogName('')
    setBreed('')
    setRegNumber('')
    setLevel(1)
    setRecallMethod('voice')
    setJumpParams(getDefaultJumpParams(1))
  }

  const handleSubmit = () => {
    if (!handlerName.trim() || !dogName.trim()) return
    addParticipant.mutate(
      {
        competitionId,
        startOrder: nextOrder,
        level,
        recallMethod,
        jumpParams,
        handler: { name: handlerName.trim(), country: country.trim() },
        dog: { name: dogName.trim(), breed: breed.trim(), registrationNumber: regNumber.trim() },
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить участника</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="handler">Проводник</Label>
              <Input id="handler" value={handlerName} onChange={(e) => setHandlerName(e.target.value)} placeholder="Иванов И.И." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="country">Страна</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Россия" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="dogName">Кличка собаки</Label>
              <Input id="dogName" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Рекс" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="breed">Порода</Label>
              <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Малинуа" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="regNumber">Рег. номер</Label>
            <Input id="regNumber" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Уровень</Label>
              <Select
                value={String(level)}
                onValueChange={(v) => handleLevelChange(Number(v) as CompetitionLevel)}
                items={{ '1': 'I (200 баллов)', '2': 'II (300 баллов)', '3': 'III (400 баллов)' }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">I (200 баллов)</SelectItem>
                  <SelectItem value="2">II (300 баллов)</SelectItem>
                  <SelectItem value="3">III (400 баллов)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Отзыв</Label>
              <Select
                value={recallMethod}
                onValueChange={(v) => setRecallMethod(v as RecallMethod)}
                items={{ voice: 'Голосом', whistle: 'Свистком' }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voice">Голосом</SelectItem>
                  <SelectItem value="whistle">Свистком</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Высоты прыжков</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Барьер, м</Label>
                <Select
                  value={String(jumpParams.wallHeight)}
                  onValueChange={(v) => setJumpParams((p) => ({ ...p, wallHeight: Number(v) as JumpParams['wallHeight'] }))}
                  disabled={!hasChoice || availableHeights.wall.length <= 1}
                  items={availableHeights.wallItems}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHeights.wall.map((h) => (
                      <SelectItem key={h} value={String(h)}>{h.toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Длина, м</Label>
                <Select
                  value={String(jumpParams.longJumpLength)}
                  onValueChange={(v) => setJumpParams((p) => ({ ...p, longJumpLength: Number(v) as JumpParams['longJumpLength'] }))}
                  disabled={!hasChoice || availableHeights.long.length <= 1}
                  items={availableHeights.longItems}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHeights.long.map((l) => (
                      <SelectItem key={l} value={String(l)}>{l.toFixed(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Штакетник, м</Label>
                <Select
                  value={String(jumpParams.palisadeHeight)}
                  onValueChange={(v) => setJumpParams((p) => ({ ...p, palisadeHeight: Number(v) as JumpParams['palisadeHeight'] }))}
                  disabled={!hasChoice || availableHeights.palisade.length <= 1}
                  items={availableHeights.palisadeItems}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHeights.palisade.map((h) => (
                      <SelectItem key={h} value={String(h)}>{h.toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={!handlerName.trim() || !dogName.trim()}>Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
