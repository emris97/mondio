import type { CompetitionLevel, ExerciseGroup, ExerciseId } from '@/shared/types'
import { orderExerciseIds } from './exercise-order'
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
    { id: 'start', label: 'старт', maxScore: startScore, fixed: true },
    { id: 'bite', label: 'хватка', maxScore: typeof biteScore === 'function' ? biteScore(level) : biteScore, fixed: true },
    { id: 'stop', label: 'прекращение хватки и подзыв', maxScore: stopScore, fixed: true },
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
      {
        id: 'deviation',
        description:
          'собака забегает вперед, уходит в сторону или слегка отстает, за каждую ошибку (будь то на прямой, при повороте, на остановке или во время разворота)',
        points: 0.5,
        perUnit: true,
        unitLabel: 'раз',
      },
      {
        id: 'leave',
        description: 'собака уходит на расстояние больше чем на 2 длины корпуса или не следует за проводником',
        points: 6,
        binary: true,
      },
      {
        id: 'routeError',
        description: 'проводник ошибается маршрутом, в результате чего избегает усложнения маршрута',
        points: 6,
        binary: true,
      },
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
      {
        id: 'crawl',
        description: 'собака продвигается не меняя положения, за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      { id: 'posChangeReturn', description: 'собака меняет положение при возвращении проводника', points: 2, binary: true },
      {
        id: 'posChangeDuringAbsent',
        description: 'собака меняет положение во время отсутствия проводника',
        points: 10,
        binary: true,
      },
      {
        id: 'posChangeWalkToHide',
        description: 'собака меняет положение во время движения проводника к укрытию',
        points: 10,
        binary: true,
      },
      {
        id: 'peekFromHide',
        description: 'проводник показывается из укрытия до истечения положенного времени',
        points: 10,
        binary: true,
      },
      { id: 'unauthorizedCmd', description: 'любая неразрешенная команда', points: 10, binary: true },
      {
        id: 'lookBack',
        description:
          'проводник оборачивается или смотрит на собаку во время движения к укрытию или при входе в него',
        points: 10,
        binary: true,
      },
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
      { id: 'voiceAndGesture', description: 'команда, поданная одновременно голосом и жестом', points: 2, binary: true },
      { id: 'extraSendCmd', description: 'каждая дополнительная команда посыла', points: 4, perUnit: true, unitLabel: 'раз' },
      {
        id: 'zigzag',
        description: 'зигзагообразное движение собаки; каждая смена направления',
        points: 1,
        perUnit: true,
        unitLabel: 'раз',
      },
      {
        id: 'earlyTurn',
        description: 'собака начинает разворот, чтобы вернуться к проводнику до команды, каждая ошибка',
        points: 2,
        perUnit: true,
        unitLabel: 'раз',
      },
      { id: 'earlyStartBefore', description: 'преждевременный старт до сигнала судьи', points: 4, binary: true },
      {
        id: 'earlyStartAfter',
        description: 'преждевременный старт после сигнала судьи, но до команды проводника',
        points: 2,
        binary: true,
      },
      { id: 'noFinish', description: 'собака не пересекает линию финиша', points: 12, binary: true },
      { id: 'extraRecall', description: 'дополнительная команда подзыва (одна)', points: 2, perUnit: true, unitLabel: 'раз' },
      { id: 'noReturn20s', description: 'собака не возвращается в течение 20 секунд', points: 12, binary: true },
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
      { id: 'posChangeStart', description: 'собака меняет положение на старте', points: 2 },
      { id: 'noExecute', description: 'собака не занимает требуемую позицию', points: 3 },
      {
        id: 'crawlToHandler',
        description: 'собака продвигается в сторону проводника, за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'extraCmd',
        description:
          'Каждое повторение любой из этих команд (команды на принятие исходного положения на старте или фиксирующей команды) расценивается как дополнительная команда и оценивается одним штрафным баллом.',
        points: 1,
        perUnit: true,
        unitLabel: 'раз',
      },
      {
        id: 'earlyReturn',
        description:
          'собака возвращается к проводнику до окончания упражнения (баллы за принятие позиций сохраняются)',
        points: 2,
        pointsByLevel: { 1: 1 },
      },
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
      {
        id: 'eat',
        description: 'собака лижет, ест или берет в пасть лакомство (подброшенное или лежащее на земле)',
        points: 10,
        pointsByLevel: { 1: 5 },
        binary: true,
      },
      {
        id: 'moveAway',
        description: 'собака отходит от брошенного лакомства (до 3 м), за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      { id: 'handlerIntervenes', description: 'помощь проводника', points: 10, pointsByLevel: { 1: 5 }, binary: true },
      {
        id: 'moveDuring',
        description: 'собака перемещается во время выполнения упражнения, до 3 м, за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'moveFar',
        description:
          'собака перемещается во время выполнения упражнения свыше 3 м (отползает, отходит, отодвигается)',
        points: 10,
        pointsByLevel: { 1: 5 },
        binary: true,
      },
      {
        id: 'moveOnReturn',
        description:
          'собака перемещается (отползает, отходит, отодвигается, меняет положение) при возвращении проводника, по решению судьи',
        points: 2,
        binary: true,
      },
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
      { id: 'extraCmd', description: 'дополнительная или неверно поданная команда', points: 12, binary: true },
      { id: 'voiceAndGesture', description: 'команда, поданная одновременно голосом и жестом', points: 2, binary: true },
      { id: 'timeout', description: 'собака не уложилась в установленное время', points: 12, binary: true },
      { id: 'earlyStartBefore', description: 'преждевременный старт собаки до сигнала судьи', points: 4, binary: true },
      {
        id: 'earlyStartAfter',
        description: 'преждевременный старт собаки после сигнала судьи, но до команды проводника',
        points: 2,
        binary: true,
      },
      { id: 'chewing', description: 'собака жует предмет или играет с ним', points: 1, binary: true },
      { id: 'drop', description: 'собака роняет предмет при подносе; за каждую ошибку', points: 1, perUnit: true, unitLabel: 'раз' },
      {
        id: 'notSitting',
        description: 'проводник забирает предмет, когда собака не находится в положении «сидеть»',
        points: 1,
        binary: true,
      },
      {
        id: 'dropAtFeet',
        description: 'собака бросает предмет у ног проводника, проводник поднимает апортируемый предмет',
        points: 2,
        binary: true,
      },
      {
        id: 'handlerCantReach',
        description: 'проводник не может поднять брошенный собакой предмет, оставаясь на месте',
        points: 12,
        binary: true,
      },
      { id: 'handlerMoves', description: 'проводник шевелится при возвращении собаки', points: 12, binary: true },
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
      { id: 'voiceAndGesture', description: 'команда, поданная одновременно голосом и жестом', points: 2, binary: true },
      { id: 'extraSendCmd', description: 'дополнительная команда посыла', points: 15, binary: true },
      { id: 'timeout', description: 'предмет принесен с опозданием или совсем не принесен', points: 15, binary: true },
      { id: 'earlyStartBefore', description: 'преждевременный старт собаки до сигнала судьи', points: 4, binary: true },
      {
        id: 'earlyStartAfter',
        description: 'преждевременный старт собаки после сигнала судьи, но до команды проводника',
        points: 2,
        binary: true,
      },
      { id: 'chewing', description: 'собака жует предмет', points: 1 },
      { id: 'drop', description: 'собака роняет предмет при подносе, за каждую ошибку', points: 1, perUnit: true, unitLabel: 'раз' },
      { id: 'notSitting', description: 'собака передает предмет проводнику не из положения сидя', points: 1, binary: true },
      {
        id: 'leaveArea',
        description: 'собака покидает место (далее круга радиусом 2 м) до возвращения проводника',
        points: 15,
        binary: true,
      },
      {
        id: 'crawlInArea',
        description: 'собака перемещается в черте воображаемого круга радиусом 2 м, за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      { id: 'wrongItem', description: 'собака ошибается с выбором предмета', points: 15, binary: true },
      { id: 'showsItem', description: 'проводник показывает брусок собаке', points: 15, binary: true },
      {
        id: 'dropAtFeet',
        description: 'собака бросает предмет у ног проводника, проводник поднимает его',
        points: 2,
        binary: true,
      },
      { id: 'handlerMoves', description: 'проводник двигается при возвращении собаки', points: 15, binary: true },
      {
        id: 'handlerCantReach',
        description: 'проводник вынужден сдвинуться с места, чтобы поднять предмет',
        points: 15,
        binary: true,
      },
      {
        id: 'handlerPocketEarly',
        description: 'проводник кладет руку в карман до того, как подошел к месту выборки',
        points: 15,
        binary: true,
      },
      {
        id: 'wrongPlacement',
        description: 'проводник неправильно выкладывает предмет (не спиной к собаке)',
        points: 15,
        binary: true,
      },
      {
        id: 'unauthorizedManipulation',
        description:
          'проводник манипулирует предметом неразрешенным способом или накладывает дополнительный запах на предмет',
        points: 15,
        binary: true,
      },
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
      {
        id: 'touch',
        description: 'собака касается штакетника, независимо от направления движения',
        points: 1,
      },
      {
        id: 'lean',
        description: 'собака опирается на барьер, независимо от того, устоял он или нет',
        points: 2,
      },
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
    penaltyTable: frontalAttackPenalties(),
  },
  {
    id: 'frontalAttackObjects',
    name: 'Лобовая атака с предметами',
    group: 'bite',
    levels: [2, 3],
    getMaxScore: (level) => (level === 2 ? 40 : 50),
    scoringBreakdown: biteBreakdown(10, (lvl) => (lvl === 2 ? 20 : 30), 10),
    penaltyTable: frontalAttackPenalties(),
  },
  {
    id: 'pursuitBite',
    name: 'Атака вдогонку с хваткой',
    group: 'bite',
    levels: [1, 2, 3],
    getMaxScore: (level) => (level === 1 ? 50 : 30),
    scoringBreakdown: (level) => [
      { id: 'start', label: 'старт', maxScore: 10, fixed: true },
      { id: 'bite', label: 'атака', maxScore: level === 1 ? 30 : 10, fixed: true },
      { id: 'stop', label: 'остановка и возвращение', maxScore: 10, fixed: true },
    ],
    penaltyTable: pursuitBitePenalties(),
  },
  {
    id: 'pursuitInterrupted',
    name: 'Атака вдогонку прерванная',
    group: 'bite',
    levels: [3],
    getMaxScore: () => 30,
    scoringBreakdown: () => [
      { id: 'start', label: 'старт', maxScore: 10, fixed: true },
      { id: 'pursuit', label: 'атака (рассчитывается)', maxScore: 20, readonly: true },
    ],
    penaltyTable: [
      { id: 'earlyStartBefore', description: 'фальстарт до сигнала судьи', points: 10 },
      {
        id: 'earlyStartAfter',
        description: 'фальстарт после сигнала судьи, но до команды проводника',
        points: 5,
      },
      { id: 'bites', description: 'собака делает хватку', points: 30, binary: true },
      {
        id: 'recallDistance',
        description:
          'расстояние, на которое собака не добежала до декоя при отзыве — более 3 м, за каждый дополнительный метр',
        points: 2,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'extraRecall',
        description:
          'дополнительная команда подзыва (если собака возвращается в круг радиусом 5 метров, в центре которого находится проводник)',
        points: 5,
      },
      {
        id: 'outsideCircle',
        description:
          'если собака возвращается по команде проводника, но находится за пределами круга радиусом 5 м, в центре которого находится проводник',
        points: 20,
        binary: true,
      },
    ],
  },
  {
    id: 'searchEscort',
    name: 'Обыск и конвоирование',
    group: 'bite',
    levels: [2, 3],
    getMaxScore: () => 40,
    scoringBreakdown: () => [
      { id: 'search', label: 'обнаружение', maxScore: 10 },
      { id: 'escort', label: 'конвоирование', maxScore: 30 },
    ],
    penaltyTable: [
      { id: 'extraSendCmd', description: 'дополнительная команда посыла (одна)', points: 10 },
      {
        id: 'noSearch',
        description: 'собака не уходит на обыск несмотря на повторную команду',
        points: 40,
        binary: true,
      },
      { id: 'notFound', description: 'собака не находит декоя в установленное время', points: 40, binary: true },
      { id: 'noVoice', description: 'собака не подает голос в установленное время', points: 10 },
      { id: 'biteInHide', description: 'собака кусает декоя в укрытии', points: 5 },
      {
        id: 'escapeMeters',
        description: 'собака недостаточно бдительно окарауливает в укрытии, за каждый метр побега',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      { id: 'runToHide', description: 'проводник подбегает к укрытию', points: 2 },
      {
        id: 'bitesDuringEscort',
        description: 'каждый укус во время конвоирования или после команды на прекращение хватки',
        points: 2,
        perUnit: true,
        unitLabel: 'раз',
      },
      {
        id: 'extraStopCmd',
        description: 'каждая дополнительная команда на прекращение действия',
        points: 2,
        perUnit: true,
        unitLabel: 'раз',
      },
      {
        id: 'escortEscapeMeters',
        description: 'собака позволяет декою убежать, за каждый метр побега',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'handlerTooClose',
        description: 'проводник не соблюдает дистанцию в 3 м при конвоировании',
        points: 10,
      },
      {
        id: 'handlerBlocks',
        description: 'проводник мешает декою по защите при побегах',
        points: 30,
        binary: true,
      },
      { id: 'noGuard', description: 'собака не окарауливает в течение 5 сек.', points: 5 },
      {
        id: 'falseAlert',
        description: 'собака совершает ложное обозначение, не обнаружив декоя',
        points: 5,
      },
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
      {
        id: 'handlerTalksToDog',
        description: 'проводник общается с собакой после стартовой команды в начале упражнения',
        points: 30,
        binary: true,
      },
      {
        id: 'handlerRepliesToDecoy',
        description: 'проводник отвечает декою без предварительного разрешения судьи',
        points: 30,
        binary: true,
      },
      {
        id: 'earlyBiteMeeting',
        description: 'собака кусает декоя до или во время его встречи или беседы с проводником',
        points: 30,
        binary: true,
      },
      {
        id: 'earlyBiteMeters',
        description: 'собака кусает после встречи, но до нападения декоя, за каждый метр',
        points: 2,
        perUnit: true,
        unitLabel: 'м',
      },
      { id: 'noBitePerSecond', description: 'за каждую секунду вне хвата', points: 2, perUnit: true, unitLabel: 'сек' },
      {
        id: 'leavesHandler',
        description:
          'собака во время упражнения (в любой момент) отходит от проводника более чем на 1 м, но не кусает декоя, за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'leaves10m',
        description: 'собака уходит от проводника на расстояние более 10 м',
        points: 30,
        binary: true,
      },
      {
        id: 'attacksBystander',
        description: 'собака нападает на «постороннее лицо»',
        points: 30,
        binary: true,
      },
      {
        id: 'noProtection',
        description: 'собака не защищает проводника в течение установленных 2 сек.',
        points: 30,
        binary: true,
      },
      {
        id: 'handlerEncourages',
        description:
          'проводник подбадривает собаку или держится от нее на расстоянии менее 3 м во время хватки или при подаче команды на отпуск',
        points: 30,
        binary: true,
      },
      {
        id: 'biteAfterStop',
        description: 'за каждый укус после подачи команды о прекращении',
        points: 2,
        perUnit: true,
        unitLabel: 'раз',
      },
      {
        id: 'noReturn',
        description: 'собака не возвращается к ноге в течение 10 с после подзыва',
        points: 5,
      },
      { id: 'noGuard5s', description: 'собака не окарауливает в течение установленных 5 с', points: 5 },
      {
        id: 'returnsBeforeRecallAfterJudgeSignal',
        description:
          'Собака, которая начала окарауливать декоя, но вернулась к проводнику до команды подзыва, но после сигнала судьи на подзыв, получает штраф 2 балла.',
        points: 2,
        binary: true,
      },
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
      {
        id: 'draggedOuterPerMeter',
        description:
          'собака осуществляет хватку в круге радиусом 2 м, позволяя утянуть себя за пределы круга, за каждый метр',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'draggedBeyond5m',
        description: 'собака осуществляет хватку и позволяет утянуть себя за пределы круга радиусом 5 м',
        points: 15,
      },
      {
        id: 'draggedBeyond5mNoRelease',
        description:
          'собака осуществляет хватку, позволяет утянуть себя за пределы круга радиусом 5 м и не отпускает хватку по истечении 10 сек.',
        points: 30,
        binary: true,
      },
      {
        id: 'stolenBiteInner',
        description:
          'собака позволяет переместить вещь, а затем осуществляет хватку в пределах круга радиусом 5 м, за каждый метр перемещения вещи',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'stolenBite5to10',
        description:
          'собака позволяет переместить вещь, а затем осуществляет хватку в пределах пространства между кругами радиусом 5 м и 10 м',
        points: 15,
      },
      {
        id: 'stolenBeyond10',
        description: 'собака позволяет переместить вещь далее 10 м от первоначальной точки',
        points: 30,
        binary: true,
      },
      {
        id: 'bite2to5m',
        description: 'собака осуществляет хватку в пространстве между двумя окружностями радиусом 2 и 5 м',
        points: 5,
      },
      {
        id: 'biteBeyond5m',
        description: 'собака осуществляет хватку за пределами круга радиусом 5 м',
        points: 30,
        binary: true,
      },
      {
        id: 'leavesItemBeforeReturnSignal',
        description:
          'Если собака уходит от вещи до сигнала рожка, разрешающего возвращение проводника, она теряет 1 балл за каждый метр продвижения до 10 м',
        points: 1,
        perUnit: true,
        unitLabel: 'м',
      },
      {
        id: 'leavesItemBeyond10m',
        description: 'если она продолжает движение дальше — все баллы за упражнение теряются',
        points: 30,
        binary: true,
      },
    ],
  },
]

function jumpPenalties() {
  return [
    {
      id: 'earlyStartBefore',
      description: 'преждевременный старт до сигнала судьи',
      points: 4,
    },
    {
      id: 'earlyStartAfter',
      description: 'преждевременный старт после сигнала судьи, но до подачи команды проводником',
      points: 2,
      binary: true,
    },
    { id: 'voiceAndGesture', description: 'подача команды одновременно голосом и жестом', points: 2, binary: true },
    {
      id: 'refusal',
      description: 'отказ от прыжка или обход препятствия, независимо от направления прыжка',
      points: 4,
    },
    {
      id: 'failedAttempt',
      description: 'неудачная попытка, независимо от направления прыжка',
      points: 2,
    },
    {
      id: 'continuesMoving',
      description:
        'собака продолжает движение после преодоления препятствия (если подана фиксирующая команда)',
      points: 2,
    },
    {
      id: 'extraCmd',
      description:
        'любая дополнительная команда, направленная на остановку движения, подготовку к прыжку или подзыв',
      points: 2,
    },
    { id: 'extraSendCmd', description: 'дополнительная команда на прыжок', points: 5 },
    {
      id: 'noReturn10s',
      description: 'собака не возвращается к ноге проводника в отведенные для этого 10 с',
      points: 2,
      binary: true,
    },
  ]
}

function frontalAttackPenalties() {
  return [
    { id: 'earlyStartBefore', description: 'фальстарт до сигнала судьи', points: 10, appliesTo: 'start' },
    {
      id: 'earlyStartAfter',
      description: 'фальстарт после сигнала судьи, но до команды проводника',
      points: 5,
      appliesTo: 'start',
    },
    { id: 'extraSendCmd', description: 'дополнительная команда посыла в атаку', points: 10, appliesTo: 'start' },
    {
      id: 'hesitationObstacle',
      description: 'нерешительное поведение перед препятствием',
      points: 5,
      pointsByLevel: { 1: 0 },
      binary: true,
      appliesTo: 'start',
    },
    {
      id: 'obstacleBypass',
      description: 'собака оббегает препятствие',
      points: 15,
      pointsByLevel: { 1: 0, 2: 10 },
      binary: true,
      appliesTo: 'start',
    },
    {
      id: 'startForwardMeters',
      description: 'движение вперед на старте (за метр)',
      points: 1,
      perUnit: true,
      unitLabel: 'м',
      appliesTo: 'start',
    },
    {
      id: 'noBitePerSecond',
      description: 'отсутствие хватки (за секунду)',
      points: 3,
      pointsByLevel: { 2: 2 },
      perUnit: true,
      unitLabel: 'сек',
      appliesTo: 'bite',
    },
    { id: 'quickRegrips', description: 'быстрые перехваты', points: 1, perUnit: true, unitLabel: 'раз', appliesTo: 'bite' },
    {
      id: 'holdAfterStop',
      description: 'удержание хватки после команды',
      points: 2,
      perUnit: true,
      unitLabel: 'сек',
      appliesTo: 'stop',
    },
    {
      id: 'biteAfterStop',
      description: 'собака кусает после команды прекращения',
      points: 2,
      perUnit: true,
      unitLabel: 'раз',
      appliesTo: 'stop',
    },
    { id: 'extraRecall', description: 'дополнительная команда подзыва', points: 5, appliesTo: 'stop' },
    {
      id: 'recallNoBite',
      description: 'подзыв вне хватки (за секунды задержки)',
      points: 5,
      appliesTo: 'stop',
    },
    { id: 'noReturn30s', description: 'собака не подходит за 30 с', points: 10, appliesTo: 'stop' },
    { id: 'actionsAfter', description: 'действия после завершения упражнения', points: 10, appliesTo: 'stop' },
    {
      id: 'releaseBiteAndReturn',
      description: 'собака отпускает хватку и возвращается',
      points: 5,
      appliesTo: 'stop',
    },
    {
      id: 'earlyStartRepeat',
      description: 'повторный фальстарт до сигнала судьи',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'unauthorizedActions',
      description: 'любые нерегламентированные действия до/во время упражнения',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'refusesAttack',
      description: 'собака отказывается атаковать',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'handlerLeaves',
      description: 'проводник покидает стартовую зону',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'training',
      description: 'использование атаки для тренировки',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
  ]
}

function pursuitBitePenalties() {
  return [
    { id: 'earlyStartBefore', description: 'фальстарт до сигнала судьи', points: 10, appliesTo: 'start' },
    {
      id: 'earlyStartAfter',
      description: 'фальстарт после сигнала судьи, но до команды проводника',
      points: 5,
      appliesTo: 'start',
    },
    { id: 'extraSendCmd', description: 'дополнительная команда посыла в атаку', points: 10, appliesTo: 'start' },
    {
      id: 'hesitationObstacle',
      description: 'нерешительное поведение перед препятствием',
      points: 5,
      pointsByLevel: { 1: 0 },
      binary: true,
      appliesTo: 'start',
    },
    {
      id: 'obstacleBypass',
      description: 'собака оббегает препятствие',
      points: 15,
      pointsByLevel: { 1: 0, 2: 10 },
      binary: true,
      appliesTo: 'start',
    },
    {
      id: 'startForwardMeters',
      description: 'движение вперед на старте (за метр)',
      points: 1,
      perUnit: true,
      unitLabel: 'м',
      appliesTo: 'start',
    },
    {
      id: 'noBitePerSecond',
      description: 'отсутствие хватки (за секунду)',
      points: 3,
      pointsByLevel: { 2: 1, 3: 1 },
      perUnit: true,
      unitLabel: 'сек',
      appliesTo: 'bite',
    },
    { id: 'quickRegrips', description: 'быстрые перехваты', points: 1, perUnit: true, unitLabel: 'раз', appliesTo: 'bite' },
    {
      id: 'holdAfterStop',
      description: 'удержание хватки после команды',
      points: 2,
      perUnit: true,
      unitLabel: 'сек',
      appliesTo: 'stop',
    },
    {
      id: 'biteAfterStop',
      description: 'собака кусает после команды прекращения',
      points: 2,
      perUnit: true,
      unitLabel: 'раз',
      appliesTo: 'stop',
    },
    { id: 'extraRecall', description: 'дополнительная команда подзыва', points: 5, appliesTo: 'stop' },
    {
      id: 'recallNoBite',
      description: 'подзыв вне хватки (за секунды задержки)',
      points: 5,
      appliesTo: 'stop',
    },
    { id: 'noReturn30s', description: 'собака не подходит за 30 с', points: 10, appliesTo: 'stop' },
    { id: 'actionsAfter', description: 'действия после завершения упражнения', points: 10, appliesTo: 'stop' },
    {
      id: 'releaseBiteAndReturn',
      description: 'собака отпускает хватку и возвращается',
      points: 5,
      appliesTo: 'stop',
    },
    {
      id: 'earlyStartRepeat',
      description: 'повторный фальстарт до сигнала судьи',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'unauthorizedActions',
      description: 'любые нерегламентированные действия до/во время упражнения',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'refusesAttack',
      description: 'собака отказывается атаковать',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'handlerLeaves',
      description: 'проводник покидает стартовую зону',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
    {
      id: 'training',
      description: 'использование атаки для тренировки',
      points: 50,
      pointsByLevel: { 2: 40 },
      binary: true,
    },
  ]
}

/** Фиксированный порядок разделов: послушание → прыжки → хватка. Внутри раздела — порядок из customFlat или реестра. */
export const EXERCISE_GROUP_SEQUENCE: readonly ExerciseGroup[] = ['obedience', 'jumps', 'bite']

export function normalizeLevelExerciseOrder(
  level: CompetitionLevel,
  customFlat?: ExerciseId[] | null,
): ExerciseId[] {
  const result: ExerciseId[] = []
  for (const group of EXERCISE_GROUP_SEQUENCE) {
    const registryIds = exerciseRegistry
      .filter((e) => e.levels.includes(level) && e.group === group)
      .map((e) => e.id)
    const groupCustom = customFlat?.filter((id) => registryIds.includes(id)) ?? null
    result.push(...orderExerciseIds(registryIds, groupCustom))
  }
  return result
}

export function getExerciseDefinition(exerciseId: string): ExerciseDefinition | undefined {
  return exerciseRegistry.find((e) => e.id === exerciseId)
}

export function getExercisesForLevel(
  level: CompetitionLevel,
  customOrder?: ExerciseId[] | null,
): ExerciseDefinition[] {
  const defs = exerciseRegistry.filter((e) => e.levels.includes(level))
  const ids = normalizeLevelExerciseOrder(level, customOrder)
  const map = new Map(defs.map((d) => [d.id, d]))
  return ids.map((id) => map.get(id)).filter((d): d is ExerciseDefinition => d !== undefined)
}

export function getExercisesByGroup(
  level: CompetitionLevel,
  group: string,
  customOrder?: ExerciseId[] | null,
): ExerciseDefinition[] {
  return getExercisesForLevel(level, customOrder).filter((e) => e.group === group)
}
