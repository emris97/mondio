import type { CompetitionLevel } from '@/shared/types'
import type { JumpParams } from '../types'

type JumpScoreTable = Record<number, Partial<Record<CompetitionLevel, number>>>

const wallScoreTable: JumpScoreTable = {
  1.8: { 1: 15, 2: 12, 3: 5 },
  1.9: { 2: 13, 3: 7 },
  2.0: { 2: 14, 3: 9 },
  2.1: { 2: 15, 3: 11 },
  2.2: { 3: 13 },
  2.3: { 3: 15 },
}

const longJumpScoreTable: JumpScoreTable = {
  3.0: { 1: 15, 2: 10, 3: 12 },
  3.5: { 2: 15, 3: 16 },
  4.0: { 3: 20 },
}

const palisadeScoreTable: JumpScoreTable = {
  1.0: { 1: 15, 2: 12, 3: 12 },
  1.1: { 2: 16, 3: 16 },
  1.2: { 2: 20, 3: 20 },
}

export function getWallMaxScore(level: CompetitionLevel, height?: number): number {
  if (!height) return 0
  return wallScoreTable[height]?.[level] ?? 0
}

export function getLongJumpMaxScore(level: CompetitionLevel, length?: number): number {
  if (!length) return 0
  return longJumpScoreTable[length]?.[level] ?? 0
}

export function getPalisadeMaxScore(level: CompetitionLevel, height?: number): number {
  if (!height) return 0
  return palisadeScoreTable[height]?.[level] ?? 0
}

export function getJumpMaxScore(
  exerciseType: 'jumpWall' | 'jumpLong' | 'jumpPalisade',
  level: CompetitionLevel,
  params?: JumpParams,
): number {
  switch (exerciseType) {
    case 'jumpWall':
      return getWallMaxScore(level, params?.wallHeight)
    case 'jumpLong':
      return getLongJumpMaxScore(level, params?.longJumpLength)
    case 'jumpPalisade':
      return getPalisadeMaxScore(level, params?.palisadeHeight)
  }
}

function getAvailableValues<T extends number>(
  table: JumpScoreTable,
  level: CompetitionLevel,
): T[] {
  return Object.keys(table)
    .map(Number)
    .filter((key) => table[key]?.[level] !== undefined) as T[]
}

export function getAvailableWallHeights(
  level: CompetitionLevel,
): NonNullable<JumpParams['wallHeight']>[] {
  return getAvailableValues(wallScoreTable, level)
}

export function getAvailableLongJumpLengths(
  level: CompetitionLevel,
): NonNullable<JumpParams['longJumpLength']>[] {
  return getAvailableValues(longJumpScoreTable, level)
}

export function getAvailablePalisadeHeights(
  level: CompetitionLevel,
): NonNullable<JumpParams['palisadeHeight']>[] {
  return getAvailableValues(palisadeScoreTable, level)
}

export function getDefaultJumpParams(level: CompetitionLevel): JumpParams {
  const walls = getAvailableWallHeights(level)
  const longs = getAvailableLongJumpLengths(level)
  const palisades = getAvailablePalisadeHeights(level)
  return {
    wallHeight: walls[0],
    longJumpLength: longs[0],
    palisadeHeight: palisades[0],
  }
}
