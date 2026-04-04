# Mondio — Mondioring Competition Management

SPA-приложение для проведения соревнований по Мондьорингу: создание соревнований, ввод результатов, автоматический подсчёт баллов, рейтинг участников.

## Стек

- **Vite 8** + **React 19** + **TypeScript 5.9**
- **TanStack Router** — file-based маршрутизация
- **TanStack Query** — кеш-слой данных, CRUD-мутации
- **Tailwind CSS 4** + **shadcn/ui** — UI-компоненты
- **Vitest** — unit-тесты scoring engine

## Требования

- Node.js >= 20
- pnpm >= 9

## Запуск

```bash
# Установка зависимостей
pnpm install

# Dev-сервер (http://localhost:5173)
pnpm dev

# Сборка для продакшена
pnpm build

# Превью продакшен-сборки
pnpm preview
```

## Docker

```bash
# Dev-режим с hot reload (http://localhost:5173)
docker compose up

# Production с nginx (http://localhost:8080)
docker compose --profile prod up
```

Dev-контейнер использует bind-mount исходников и named volume для `node_modules`. Production — multi-stage сборка (node:20-alpine → nginx:alpine) с SPA fallback.

## Тесты

```bash
pnpm test          # однократный запуск
pnpm test:watch    # watch-режим
```

Покрытие: scoring engine — расчёт баллов, штрафы, субтоталы, тай-брейк рейтинг, прерванная атака (примеры из правил).

## Архитектура

### Feature-Sliced Design

```
src/
  app/                        — bootstrap, провайдеры, роутер
    providers/                — QueryClient
    router/                   — TanStack Router: 5 маршрутов
  pages/                      — страницы
    dashboard/                — список соревнований, создание, импорт/экспорт
    competition/              — инфо, участники, добавление
    scoring/                  — формы ввода по упражнениям, autosave
    results/                  — standings, тай-брейк, субтоталы
    settings/                 — справочник упражнений по уровням
  entities/                   — доменные сущности
    competition/              — тип Competition, query-хуки
    participant/              — Handler, Dog, Participant, query-хуки
    exercise/
      config/                 — реестр упражнений, таблицы прыжков, штрафы
      engine/                 — scoring: чистые функции + unit-тесты
    score/                    — ExerciseScore, CompetitionTotal, query-хуки
  shared/
    api/                      — Repository<T>, localStorage-реализация, query-keys
    types/                    — CompetitionLevel, ExerciseId, ExerciseGroup
    lib/                      — cn() утилита
  components/ui/              — shadcn/ui компоненты
```

### Scoring Engine

Ядро приложения — чистые функции без зависимостей на React:

- `calculateExerciseScore` — баллы за упражнение (компоненты − штрафы − ОВ)
- `calculateGroupSubtotal` — субтоталы по группе (послушание / прыжки / хватка)
- `calculateCompetitionTotal` — итог соревнования (200 / 300 / 400 баллов)
- `calculateInterruptedPursuit` — прерванная атака: `(лобовая_палка + лобовая_предметы) / 3 + старт − штрафы`
- `rankParticipants` — рейтинг с тай-брейком: хватка → послушание → прыжки

Конфигурация упражнений — data-driven: реестр из 17 упражнений по 3 уровням, таблицы баллов для прыжков (барьер/длина/штакетник × высота × уровень), таблицы штрафов.

### Персистенция

- Интерфейс `Repository<T>` с методами `getAll`, `getById`, `save`, `remove`
- Реализация через `localStorage` (ключи `mondio:competitions`, `mondio:participants`, `mondio:scores`)
- TanStack Query как кеш-слой поверх репозиториев — queryKey-структура готова для замены на REST API
- Импорт/экспорт всех данных в JSON

### Маршруты

| Маршрут | Страница |
|---------|----------|
| `/` | Dashboard — список соревнований |
| `/competition/:id` | Соревнование — участники |
| `/competition/:id/participant/:pid` | Scoring — ввод оценок |
| `/competition/:id/results` | Results — standings |
| `/settings` | Справочник упражнений |

## Допущения (MVP)

1. **ОВ-штраф** — числовое поле (до 10% от баллов упражнения), вводится вручную судьёй
2. **Комплекс** — порядок положений вводится вручную, не валидируется
3. **Прерванная атака** — если собака не сделала хватку в лобовой атаке, атака аннулируется (правило 939)
4. **Обыск** — время на обнаружение (2–3 мин) не таймируется
5. **Прыжки уровня I** — проводник выбирает один из трёх прыжков
6. **Отказ от лакомства** — штрафы зависят от уровня (I: 5, II/III: 10), реализовано как конфиг
7. **Без бэкенда** — все данные в localStorage браузера
8. **Один судья** — мультисудейство не поддерживается

## Стратегия миграции на бэкенд

1. Реализовать REST API, повторяющий интерфейс `Repository<T>`
2. Заменить `createLocalStorageRepository` на HTTP-клиент (axios)
3. TanStack Query queryKeys уже структурированы для API — переход прозрачен
4. Добавить аутентификацию, роли (судья / организатор / зритель)
5. Заменить `generateId()` на серверные UUID
