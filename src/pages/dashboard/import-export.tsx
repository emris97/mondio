import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { loadFromStorage, saveToStorage } from '@/shared/api'
import type { Competition } from '@/entities/competition/types'
import type { Participant } from '@/entities/participant/types'
import type { ParticipantScoreRecord } from '@/entities/score/storage-types'

type ExportData = {
  version: 1
  competitions: Competition[]
  participants: Participant[]
  scores: ParticipantScoreRecord[]
}

export function ImportExportButtons() {
  const qc = useQueryClient()

  const handleExport = () => {
    const data: ExportData = {
      version: 1,
      competitions: loadFromStorage<Competition>('mondio:competitions'),
      participants: loadFromStorage<Participant>('mondio:participants'),
      scores: loadFromStorage<ParticipantScoreRecord>('mondio:scores'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mondio-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text) as ExportData
        if (data.version !== 1) {
          alert('Неподдерживаемая версия файла')
          return
        }
        saveToStorage('mondio:competitions', data.competitions)
        saveToStorage('mondio:participants', data.participants)
        saveToStorage('mondio:scores', data.scores)
        qc.invalidateQueries()
      } catch {
        alert('Ошибка чтения файла')
      }
    }
    input.click()
  }

  return (
    <>
      <Button variant="outline" onClick={handleExport}>Экспорт</Button>
      <Button variant="outline" onClick={handleImport}>Импорт</Button>
    </>
  )
}
