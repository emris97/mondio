export const queryKeys = {
  competitions: {
    all: ['competitions'] as const,
    detail: (id: string) => ['competitions', id] as const,
  },
  participants: {
    all: ['participants'] as const,
    byCompetition: (competitionId: string) => ['participants', 'competition', competitionId] as const,
    detail: (id: string) => ['participants', id] as const,
  },
  scores: {
    all: ['scores'] as const,
    byParticipant: (participantId: string) => ['scores', 'participant', participantId] as const,
    byCompetition: (competitionId: string) => ['scores', 'competition', competitionId] as const,
  },
} as const
