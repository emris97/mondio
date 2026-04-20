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

type JumpChoice = 'jumpWall' | 'jumpLong' | 'jumpPalisade'

const jumpLabels: Record<JumpChoice, string> = {
  jumpWall: 'Барьер',
  jumpLong: 'Прыжок в длину',
  jumpPalisade: 'Штакетник',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: string
  nextOrder: number
}

function buildFinalJumpParams(
  level: CompetitionLevel,
  allParams: JumpParams,
  jumpChoice: JumpChoice,
): JumpParams {
  if (level === 3) return allParams
  if (level === 2) {
    return {
      palisadeHeight: allParams.palisadeHeight,
      ...(jumpChoice === 'jumpWall'
        ? { wallHeight: allParams.wallHeight }
        : { longJumpLength: allParams.longJumpLength }),
    }
  }
  switch (jumpChoice) {
    case 'jumpWall': return { wallHeight: allParams.wallHeight }
    case 'jumpLong': return { longJumpLength: allParams.longJumpLength }
    case 'jumpPalisade': return { palisadeHeight: allParams.palisadeHeight }
  }
}

export function AddParticipantDialog({ open, onOpenChange, competitionId, nextOrder }: Props) {
  const [handlerName, setHandlerName] = useState('')
  const [country, setCountry] = useState('')
  const [dogName, setDogName] = useState('')
  const [breed, setBreed] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [level, setLevel] = useState<CompetitionLevel>(1)
  const [recallMethod, setRecallMethod] = useState<RecallMethod>('voice')
  const [allJumpParams, setAllJumpParams] = useState<JumpParams>(() => getDefaultJumpParams(1))
  const [jumpChoice, setJumpChoice] = useState<JumpChoice>('jumpPalisade')
  const addParticipant = useAddParticipant()

  const availableHeights = useMemo(() => ({
    wall: getAvailableWallHeights(level),
    long: getAvailableLongJumpLengths(level),
    palisade: getAvailablePalisadeHeights(level),
  }), [level])

  const showWall = level === 3 || (level === 2 && jumpChoice === 'jumpWall') || (level === 1 && jumpChoice === 'jumpWall')
  const showLong = level === 3 || (level === 2 && jumpChoice === 'jumpLong') || (level === 1 && jumpChoice === 'jumpLong')
  const showPalisade = level === 3 || level === 2 || (level === 1 && jumpChoice === 'jumpPalisade')

  const handleLevelChange = (newLevel: CompetitionLevel) => {
    setLevel(newLevel)
    setAllJumpParams(getDefaultJumpParams(newLevel))
    if (newLevel === 2 && jumpChoice !== 'jumpWall' && jumpChoice !== 'jumpLong') {
      setJumpChoice('jumpWall')
    }
  }

  const reset = () => {
    setHandlerName('')
    setCountry('')
    setDogName('')
    setBreed('')
    setRegNumber('')
    setLevel(1)
    setRecallMethod('voice')
    setAllJumpParams(getDefaultJumpParams(1))
    setJumpChoice('jumpPalisade')
  }

  const handleSubmit = () => {
    if (!handlerName.trim() || !dogName.trim()) return
    addParticipant.mutate(
      {
        competitionId,
        startOrder: nextOrder,
        level,
        recallMethod,
        jumpParams: buildFinalJumpParams(level, allJumpParams, jumpChoice),
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

          <div className="grid gap-3">
            <Label className="text-sm font-medium">Прыжки</Label>

            {level === 1 && (
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Выберите прыжок</Label>
                <Select
                  value={jumpChoice}
                  onValueChange={(v) => setJumpChoice(v as JumpChoice)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jumpWall">{jumpLabels.jumpWall}</SelectItem>
                    <SelectItem value="jumpLong">{jumpLabels.jumpLong}</SelectItem>
                    <SelectItem value="jumpPalisade">{jumpLabels.jumpPalisade}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {level === 2 && (
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Второй прыжок (штакетник обязателен)</Label>
                <Select
                  value={jumpChoice}
                  onValueChange={(v) => setJumpChoice(v as JumpChoice)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jumpWall">{jumpLabels.jumpWall}</SelectItem>
                    <SelectItem value="jumpLong">{jumpLabels.jumpLong}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {showWall && (
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Барьер, м</Label>
                  <Select
                    value={String(allJumpParams.wallHeight)}
                    onValueChange={(v) => setAllJumpParams((p) => ({ ...p, wallHeight: Number(v) as JumpParams['wallHeight'] }))}
                    disabled={availableHeights.wall.length <= 1}
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
              )}
              {showLong && (
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Длина, м</Label>
                  <Select
                    value={String(allJumpParams.longJumpLength)}
                    onValueChange={(v) => setAllJumpParams((p) => ({ ...p, longJumpLength: Number(v) as JumpParams['longJumpLength'] }))}
                    disabled={availableHeights.long.length <= 1}
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
              )}
              {showPalisade && (
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Штакетник, м</Label>
                  <Select
                    value={String(allJumpParams.palisadeHeight)}
                    onValueChange={(v) => setAllJumpParams((p) => ({ ...p, palisadeHeight: Number(v) as JumpParams['palisadeHeight'] }))}
                    disabled={availableHeights.palisade.length <= 1}
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
              )}
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
