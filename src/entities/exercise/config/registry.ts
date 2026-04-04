import type { CompetitionLevel } from '@/shared/types'
import type { ExerciseDefinition, ScoringComponent } from '../types'
import { getJumpMaxScore } from './jump-tables'

function simpleScoringBreakdown(label: string, maxScore: number): () => ScoringComponent[] {
  return () => [{ id: 'total', label, maxScore, fixed: true }]
}

function biteBreakdown(
  startScore: number,
  biteScore: number | ((lvl: CompetitionLevel) => number),
  stopScore: number,
): (level: CompetitionLevel) => ScoringComponent[] {
  return (level) => [
    { id: 'start', label: 'Старт', maxScore: startScore },
    { id: 'bite', label: 'Хватка', maxScore: typeof biteScore === 'function' ? biteScore(level) : biteScore },
    { id: 'stop', label: 'Прекращение и отзыв', maxScore: stopScore },
  ]
}

export const exerciseRegistry: ExerciseDefinition[] = [
  // ===================== ПОСЛУШАНИЕ =====================
  {
    id: 'heeling',
    name: 'Хождение рядом',
    group: 'obedience',
    levels: [1, 2, 3],
    getMaxScore: () => 6,
    scoringBreakdown: simpleScoringBreakdown('Хождение рядом', 6),
    penaltyTable: [
      { id: 'deviation', description: 'Забегает/отстаёт/уходит в сторону', points: 0.5, perUnit: true, unitLabel: 'раз' },
      { id: 'leave', description: 'Уходит / не следует', points: 6, binary: true },
    ],
  },
  {
    id: 'absence',
    name: 'Отсутствие хозяина',
    group: 'obedience',
    levels: [1, 2, 3],
    getMaxScore: () => 10,
    scoringBreakdown: simpleScoringBreakdown('Отсутствие хозяина', 10),
    penaltyTable: [
      { id: 'crawl', description: 'Продвижка без смены положения, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'posChangeReturn', description: 'Смена положения при возвращении', points: 2 },
      { id: 'posChangeDuring', description: 'Смена положения во время отсутствия', points: 10, binary: true },
      { id: 'peekFromHide', description: 'Проводник показался из укрытия', points: 10, binary: true },
      { id: 'unauthorizedCmd', description: 'Неразрешённая команда', points: 10, binary: true },
      { id: 'lookBack', description: 'Проводник оборачивается / смотрит на собаку', points: 10, binary: true },
    ],
  },
  {
    id: 'sendAway',
    name: 'Посыл вперёд',
    group: 'obedience',
    levels: [1, 2, 3],
    getMaxScore: () => 12,
    scoringBreakdown: () => [{ id: 'total', label: 'Посыл вперёд (12 / 8 / 4)', maxScore: 12 }],
    penaltyTable: [
      { id: 'voiceAndGesture', description: 'Команда голосом и жестом', points: 2 },
      { id: 'extraSendCmd', description: 'Доп. команда посыла', points: 4, perUnit: true, unitLabel: 'раз' },
      { id: 'zigzag', description: 'Зигзагообразное движение, за смену', points: 1, perUnit: true, unitLabel: 'раз' },
      { id: 'earlyTurn', description: 'Разворот до команды, за раз', points: 2, perUnit: true, unitLabel: 'раз' },
      { id: 'earlyStartBefore', description: 'Преждевременный старт до разрешения', points: 4 },
      { id: 'earlyStartAfter', description: 'Преждевременный старт после разрешения', points: 2 },
      { id: 'noFinish', description: 'Не пересекает финишной линии', points: 12, binary: true },
      { id: 'extraRecall', description: 'Доп. команда подзыва', points: 2, perUnit: true, unitLabel: 'раз' },
    ],
  },
  {
    id: 'positions',
    name: 'Комплекс',
    group: 'obedience',
    levels: [1, 2, 3],
    getMaxScore: (level) => (level === 1 ? 10 : 20),
    scoringBreakdown: (level) => [
      { id: 'positions', label: 'Положения', maxScore: level === 1 ? 9 : 18 },
      { id: 'recall', label: 'Подзыв к ноге', maxScore: level === 1 ? 1 : 2 },
    ],
    penaltyTable: [
      { id: 'posChangeStart', description: 'Смена положения на старте', points: 2 },
      { id: 'noExecute', description: 'Не выполняет команду', points: 3 },
      { id: 'crawlToHandler', description: 'Движение к хозяину, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'extraCmd', description: 'Доп. команда, за каждую', points: 1, perUnit: true, unitLabel: 'раз' },
      { id: 'earlyReturn', description: 'Приход к хозяину до окончания (потеря подзыва)', points: 2 },
    ],
  },
  {
    id: 'foodRefusal',
    name: 'Отказ от лакомства',
    group: 'obedience',
    levels: [1, 2, 3],
    getMaxScore: (level) => (level === 1 ? 5 : 10),
    scoringBreakdown: (level) => [
      { id: 'total', label: 'Отказ от лакомства', maxScore: level === 1 ? 5 : 10, fixed: true },
    ],
    penaltyTable: [
      { id: 'eat', description: 'Лижет/ест/берёт лакомство', points: 0 },
      { id: 'moveAway', description: 'Отходит от лакомства, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'handlerIntervenes', description: 'Проводник вмешивается', points: 0 },
    ],
  },
  {
    id: 'retrieve',
    name: 'Апортировка',
    group: 'obedience',
    levels: [1, 2, 3],
    getMaxScore: () => 12,
    scoringBreakdown: simpleScoringBreakdown('Апортировка', 12),
    penaltyTable: [
      { id: 'extraCmd', description: 'Доп. или неверная команда', points: 12, binary: true },
      { id: 'voiceAndGesture', description: 'Команда голосом и жестом', points: 2 },
      { id: 'timeout', description: 'Не уложился в 15 сек', points: 12, binary: true },
      { id: 'earlyStartBefore', description: 'Преждевременный старт до сигнала', points: 4 },
      { id: 'earlyStartAfter', description: 'Преждевременный старт после сигнала', points: 2 },
      { id: 'chewing', description: 'Жуёт/играет с предметом', points: 1 },
      { id: 'drop', description: 'Роняет предмет, за раз', points: 1, perUnit: true, unitLabel: 'раз' },
      { id: 'notSitting', description: 'Передаёт не из положения сидя', points: 1 },
    ],
  },
  {
    id: 'scent',
    name: 'Выборка',
    group: 'obedience',
    levels: [2, 3],
    getMaxScore: () => 15,
    scoringBreakdown: simpleScoringBreakdown('Выборка', 15),
    penaltyTable: [
      { id: 'voiceAndGesture', description: 'Команда голосом и жестом', points: 2 },
      { id: 'extraSendCmd', description: 'Доп. команда посыла', points: 15, binary: true },
      { id: 'timeout', description: 'Не принесён / с опозданием', points: 15, binary: true },
      { id: 'earlyStartBefore', description: 'Преждевременный старт до сигнала', points: 4 },
      { id: 'earlyStartAfter', description: 'Преждевременный старт после сигнала', points: 2 },
      { id: 'chewing', description: 'Жуёт предмет', points: 1 },
      { id: 'drop', description: 'Роняет предмет, за раз', points: 1, perUnit: true, unitLabel: 'раз' },
      { id: 'notSitting', description: 'Передаёт не из положения сидя', points: 1 },
      { id: 'leaveArea', description: 'Покидает круг 2 м до возвращения', points: 15, binary: true },
      { id: 'crawlInArea', description: 'Перемещение в круге 2 м, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'wrongItem', description: 'Ошибка с выбором предмета', points: 15, binary: true },
    ],
  },

  // ===================== ПРЫЖКИ =====================
  {
    id: 'jumpWall',
    name: 'Барьер',
    group: 'jumps',
    levels: [1, 2, 3],
    getMaxScore: (level, params) => getJumpMaxScore('jumpWall', level, params),
    scoringBreakdown: (level) => [
      { id: 'jump', label: 'Барьер', maxScore: level === 1 ? 15 : 15, fixed: true },
    ],
    penaltyTable: jumpPenalties(),
  },
  {
    id: 'jumpLong',
    name: 'Прыжок в длину',
    group: 'jumps',
    levels: [1, 2, 3],
    getMaxScore: (level, params) => getJumpMaxScore('jumpLong', level, params),
    scoringBreakdown: () => [
      { id: 'jump', label: 'Прыжок в длину', maxScore: 20, fixed: true },
    ],
    penaltyTable: jumpPenalties(),
  },
  {
    id: 'jumpPalisade',
    name: 'Штакетник',
    group: 'jumps',
    levels: [1, 2, 3],
    getMaxScore: (level, params) => getJumpMaxScore('jumpPalisade', level, params),
    scoringBreakdown: () => [
      { id: 'jump', label: 'Штакетник', maxScore: 20, fixed: true },
    ],
    penaltyTable: [
      ...jumpPenalties(),
      { id: 'touch', description: 'Касание штакетника', points: 1 },
      { id: 'lean', description: 'Опирается о штакетник', points: 2 },
    ],
  },

  // ===================== ХВАТКА =====================
  {
    id: 'frontalAttackStick',
    name: 'Лобовая атака с палкой',
    group: 'bite',
    levels: [1, 2, 3],
    getMaxScore: (level) => (level === 2 ? 40 : 50),
    scoringBreakdown: biteBreakdown(10, (lvl) => (lvl === 2 ? 20 : 30), 10),
    penaltyTable: biteAttackPenalties(),
  },
  {
    id: 'frontalAttackObjects',
    name: 'Лобовая атака с предметами',
    group: 'bite',
    levels: [2, 3],
    getMaxScore: (level) => (level === 2 ? 40 : 50),
    scoringBreakdown: biteBreakdown(10, (lvl) => (lvl === 2 ? 20 : 30), 10),
    penaltyTable: biteAttackPenalties(),
  },
  {
    id: 'pursuitBite',
    name: 'Атака вдогонку с хваткой',
    group: 'bite',
    levels: [1, 2, 3],
    getMaxScore: (level) => (level === 1 ? 50 : 30),
    scoringBreakdown: (level) => [
      { id: 'start', label: 'Старт', maxScore: 10 },
      { id: 'bite', label: 'Атака', maxScore: level === 1 ? 30 : 10 },
      { id: 'stop', label: 'Остановка и возвращение', maxScore: 10 },
    ],
    penaltyTable: biteAttackPenalties(),
  },
  {
    id: 'pursuitInterrupted',
    name: 'Атака вдогонку прерванная',
    group: 'bite',
    levels: [3],
    getMaxScore: () => 30,
    scoringBreakdown: () => [
      { id: 'start', label: 'Старт', maxScore: 10 },
      { id: 'pursuit', label: 'Атака (рассчитывается)', maxScore: 20 },
    ],
    penaltyTable: [
      { id: 'earlyStartBefore', description: 'Преждевременный старт до сигнала', points: 10 },
      { id: 'earlyStartAfter', description: 'Преждевременный старт после сигнала', points: 5 },
      { id: 'bites', description: 'Собака делает хватки', points: 30, binary: true },
      { id: 'recallDistance', description: 'За каждый доп. метр при отзыве (>3 м)', points: 2, perUnit: true, unitLabel: 'м' },
      { id: 'extraRecall', description: 'Доп. команда подзыва', points: 5 },
      { id: 'outsideCircle', description: 'Возвращается за пределы 5 м круга', points: 20, binary: true },
    ],
  },
  {
    id: 'searchEscort',
    name: 'Обыск и конвоирование',
    group: 'bite',
    levels: [2, 3],
    getMaxScore: () => 40,
    scoringBreakdown: () => [
      { id: 'search', label: 'Обнаружение', maxScore: 10 },
      { id: 'escort', label: 'Конвоирование', maxScore: 30 },
    ],
    penaltyTable: [
      { id: 'extraSendCmd', description: 'Доп. команда посыла', points: 10 },
      { id: 'noSearch', description: 'Не отправляется на поиск', points: 40, binary: true },
      { id: 'notFound', description: 'Не находит ЧА в установленное время', points: 40, binary: true },
      { id: 'noVoice', description: 'Не подаёт голос', points: 10 },
      { id: 'biteInHide', description: 'Кусает ЧА в укрытии', points: 5 },
      { id: 'escapeMeters', description: 'Недостаточно бдителен, за метр побега', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'runToHide', description: 'Проводник подбегает к укрытию (от ОВ)', points: 2 },
      { id: 'bitesDuringEscort', description: 'Хватки во время конвоирования, за раз', points: 2, perUnit: true, unitLabel: 'раз' },
      { id: 'extraStopCmd', description: 'Доп. команда прекращения, за каждую', points: 2, perUnit: true, unitLabel: 'раз' },
      { id: 'escortEscapeMeters', description: 'Позволяет бежать, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'handlerTooClose', description: 'Проводник не в 3 м при конвоировании', points: 10 },
      { id: 'handlerBlocks', description: 'Проводник мешает бежать', points: 30, binary: true },
      { id: 'noGuard', description: 'Не окарауливает 5 сек', points: 5 },
      { id: 'falseAlert', description: 'Предупреждает не обнаружив ЧА', points: 5 },
    ],
  },
  {
    id: 'handlerProtection',
    name: 'Защита хозяина',
    group: 'bite',
    levels: [1, 2, 3],
    getMaxScore: () => 30,
    scoringBreakdown: () => [
      { id: 'total', label: 'Защита хозяина', maxScore: 30, fixed: true },
    ],
    penaltyTable: [
      { id: 'handlerSpeaks', description: 'Проводник обращается после старта', points: 30, binary: true },
      { id: 'earlyBiteMeeting', description: 'Кусает до/во время встречи', points: 30, binary: true },
      { id: 'earlyBiteMeters', description: 'Кусает после встречи, до нападения, за метр', points: 2, perUnit: true, unitLabel: 'м' },
      { id: 'leavesHandler', description: 'Отходит >1 м и не нападает, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'leaves10m', description: 'Уходит на >10 м', points: 30, binary: true },
      { id: 'attacksBystander', description: 'Нападает на постороннего', points: 30, binary: true },
      { id: 'noProtection', description: 'Не защищает в течение 2 сек', points: 30, binary: true },
      { id: 'handlerEncourages', description: 'Проводник подбадривает / менее 3 м', points: 30, binary: true },
      { id: 'biteAfterStop', description: 'Хватки после прекращения, за раз', points: 2, perUnit: true, unitLabel: 'раз' },
      { id: 'noReturn', description: 'Не возвращается к ноге за 10 сек', points: 5 },
      { id: 'noGuard5s', description: 'Не окарауливает 5 сек', points: 5 },
    ],
  },
  {
    id: 'objectGuard',
    name: 'Охрана вещи',
    group: 'bite',
    levels: [3],
    getMaxScore: () => 30,
    scoringBreakdown: () => [
      { id: 'total', label: 'Охрана вещи', maxScore: 30, fixed: true },
    ],
    penaltyTable: [
      { id: 'biteInnerOk', description: 'Кусает во внутреннем круге до касания', points: 0 },
      { id: 'draggedInner', description: 'Увлечена к границе круга, но не за', points: 0 },
      { id: 'draggedOuterPerMeter', description: 'Увлечена за круг, за метр', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'draggedBeyond5m', description: 'Увлечена за 5 м круг', points: 15 },
      { id: 'draggedBeyond5mNoRelease', description: 'За 5 м и не отпускает 10 сек', points: 30, binary: true },
      { id: 'stolenBiteInner', description: 'Овладел предметом, кусает в круге, за м', points: 1, perUnit: true, unitLabel: 'м' },
      { id: 'stolenBite5to10', description: 'Овладел, кусает в 5–10 м', points: 15 },
      { id: 'stolenBeyond10', description: 'Овладел, унёс далее 10 м', points: 30, binary: true },
      { id: 'bite2to5m', description: 'Кусает ЧА в зоне 2–5 м', points: 5 },
      { id: 'biteBeyond5m', description: 'Кусает за пределами 5 м', points: 30, binary: true },
    ],
  },
]

function jumpPenalties() {
  return [
    { id: 'earlyStartBefore', description: 'Преждевр. старт до сигнала (+потеря попытки)', points: 4 },
    { id: 'earlyStartAfter', description: 'Преждевр. старт после сигнала', points: 2 },
    { id: 'voiceAndGesture', description: 'Команда голосом и жестом', points: 2 },
    { id: 'refusal', description: 'Отказ от прыжка / уход', points: 4 },
    { id: 'failedAttempt', description: 'Неудачная попытка', points: 2 },
    { id: 'continuesMoving', description: 'Продолжает движение после фиксирующей', points: 2 },
    { id: 'extraCmd', description: 'Доп. команда (остановка/подготовка/подзыв)', points: 2 },
    { id: 'extraSendCmd', description: 'Доп. команда посыла', points: 5 },
    { id: 'noReturn10s', description: 'Не возвращается к ноге за 10 сек', points: 2 },
  ]
}

function biteAttackPenalties() {
  return [
    { id: 'earlyStartBefore', description: 'Преждевр. старт до сигнала (−5 от ОВ)', points: 10 },
    { id: 'earlyStartRepeat', description: 'Повторный преждевр. старт до сигнала', points: 50, binary: true },
    { id: 'earlyStartAfter', description: 'Преждевр. старт после сигнала', points: 5 },
    { id: 'extraSendCmd', description: 'Доп. команда посыла', points: 10 },
    { id: 'unauthorizedActions', description: 'Нерегламентированные действия', points: 50, binary: true },
    { id: 'noBitePerSecond', description: 'Отсутствие хватки, за секунду', points: 3, perUnit: true, unitLabel: 'сек' },
    { id: 'quickRegrips', description: 'Быстрые перехваты', points: 1, perUnit: true, unitLabel: 'раз' },
    { id: 'holdAfterStop', description: 'Удерживает после команды, за сек', points: 2, perUnit: true, unitLabel: 'сек' },
    { id: 'biteAfterStop', description: 'Кусает после прекращения', points: 2, perUnit: true, unitLabel: 'раз' },
    { id: 'extraRecall', description: 'Доп. команда подзыва', points: 5 },
    { id: 'recallNoBite', description: 'Подзыв без хватки (+штрафы за сек)', points: 5 },
    { id: 'noReturn30s', description: 'Не подходит к проводнику за 30 сек', points: 10 },
    { id: 'actionsAfter', description: 'Нерегламентированные действия после', points: 10 },
    { id: 'refusesAttack', description: 'Отказ атаковать / нет хватки', points: 50, binary: true },
    { id: 'handlerLeaves', description: 'Проводник покидает стартовую зону', points: 50, binary: true },
    { id: 'training', description: 'Использует атаку для тренировки', points: 50, binary: true },
    { id: 'hesitationObstacle', description: 'Нерешительность перед препятствием', points: 5 },
    { id: 'obstacleBypass', description: 'Обход препятствия', points: 15 },
  ]
}

export function getExerciseDefinition(exerciseId: string): ExerciseDefinition | undefined {
  return exerciseRegistry.find((e) => e.id === exerciseId)
}

export function getExercisesForLevel(level: CompetitionLevel): ExerciseDefinition[] {
  return exerciseRegistry.filter((e) => e.levels.includes(level))
}

export function getExercisesByGroup(level: CompetitionLevel, group: string): ExerciseDefinition[] {
  return exerciseRegistry.filter((e) => e.levels.includes(level) && e.group === group)
}
