import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddParticipant } from '@/entities/participant/model/queries'

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
  const addParticipant = useAddParticipant()

  const reset = () => {
    setHandlerName('')
    setCountry('')
    setDogName('')
    setBreed('')
    setRegNumber('')
  }

  const handleSubmit = () => {
    if (!handlerName.trim() || !dogName.trim()) return
    addParticipant.mutate(
      {
        competitionId,
        startOrder: nextOrder,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить участника</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="handler">Проводник</Label>
            <Input id="handler" value={handlerName} onChange={(e) => setHandlerName(e.target.value)} placeholder="Иванов И.И." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Страна</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Россия" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dogName">Кличка собаки</Label>
            <Input id="dogName" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Рекс" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="breed">Порода</Label>
            <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Малинуа" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="regNumber">Рег. номер</Label>
            <Input id="regNumber" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
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
