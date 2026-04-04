You are a senior frontend engineer and solution architect. Work directly in this repository and build a production-like MVP frontend for Mondioring competition management and score calculation.

The app is for conducting Mondioring competitions and automating score calculation for judges/secretariat.

Use the attached Mondioring rules file as the primary source of truth for:
- exercise groups
- level-specific rules
- max scores
- penalties
- scoring breakdown
- ranking/tie-break logic
- any exercise-specific constraints

Do not invent scoring rules when the rules file already defines them.
If the rules are ambiguous or incomplete, do not silently make up behavior. Instead:
1. implement the safest explicit assumption,
2. isolate it in config/business logic,
3. document it in README under “Open questions / assumptions”.

---

## Product goal

Build an SPA MVP for judging Mondioring competitions.

The MVP must allow:
- creating a competition
- selecting competition level: I / II / III
- adding participants
- storing dog and handler information
- entering exercise results and penalties
- automatic score calculation
- showing detailed score breakdown
- ranking participants live
- editing previously entered results
- restoring data after page refresh
- exporting/importing data as JSON
- running the project entirely in Docker for dev and production-like usage

Backend is NOT needed for now.
Use localStorage for MVP persistence.

---

## Technical stack

Use exactly this stack:
- Vite
- React
- TypeScript
- TanStack Router
- shadcn/ui
- Effector
- Axios
- TanStack Query

The app must be:
- SPA only
- no SSR
- no backend
- no Redux
- no Zustand
- no Next.js
- no server-side persistence

Use additional packages only if truly necessary.

---

## Core architectural principles

Build this as a clean, extensible frontend codebase.

Requirements:
- business logic must be isolated from UI
- score calculation must be deterministic and implemented with pure functions
- React components must not contain heavy business logic
- all score constants, penalties, maximums, and exercise definitions must live in config/domain layers
- data model must be explicit and type-safe
- avoid `any`
- keep the project ready for future backend replacement with minimal refactor

Use a pragmatic feature-sliced or domain-oriented frontend architecture.

Preferred folder structure:

src/
  app/
    providers/
    router/
    styles/
  pages/
  widgets/
  features/
  entities/
  shared/

Recommended intent:
- `app` — bootstrap, providers, router
- `pages` — route-level pages
- `widgets` — composed UI blocks
- `features` — user actions/use-cases
- `entities` — core business entities and models
- `shared` — ui kit wrappers, helpers, utilities, types

---

## Domain modeling requirements

Design the domain carefully.

Expected core entities:
- Competition
- CompetitionLevel
- Participant
- Dog
- Handler
- ExerciseGroup
- ExerciseDefinition
- ExerciseScore
- ExerciseAttempt
- Penalty
- ScoreBreakdown
- CompetitionStandingsEntry

Important:
- store raw judge input separately from derived/computed values
- store detailed breakdown, not only final totals
- calculations must be reproducible from saved raw input
- support exercise-level penalties and competition-level penalties where required by rules
- support group subtotals and total score
- support official ranking logic and tie-breaks according to rules

Do not hardcode exercise behavior in UI components.

Create a data-driven scoring model:
- exercise registry / definitions
- level configuration
- penalty tables
- scoring rules
- aggregation logic
- ranking logic

---

## Scoring engine requirements

This is the most important part.

Create a dedicated scoring engine that can:
- define exercises by level
- define maximum points by exercise
- accept raw scoring input
- apply penalties
- calculate exercise result
- calculate group subtotal
- calculate competition total
- apply tie-break logic
- validate impossible or inconsistent combinations
- provide a human-readable breakdown for UI

Scoring engine requirements:
- pure functions only
- type-safe input/output
- no magic numbers in components
- values come from rules/config
- unit tests are required for scoring logic

If exact rule modeling is not fully possible in one pass, structure the code so rules can be completed incrementally without rewriting architecture.

---

## Persistence and data access

There is no backend yet.

Create a repository abstraction layer so that localStorage is only an implementation detail.

For example:
- CompetitionRepository
- ParticipantRepository
- SettingsRepository
- SessionRepository

Current implementation:
- localStorage

Architecture goal:
- later replace localStorage with REST API with minimal changes

Also prepare a lightweight API layer shape using:
- axios
- TanStack Query

Even if real HTTP is not used yet, organize query keys and service boundaries cleanly so future API migration is easy.

---

## Main MVP routes/pages

Build at least these routes:

### 1. Dashboard
- list of competitions
- create competition button
- continue last session
- import/export controls

### 2. Competition page
- competition info
- selected level
- participant list
- participant status/progress
- quick navigation to scoring

### 3. Participant scoring page
- participant card
- dog + handler info
- list of exercises for current level
- structured input forms for scoring
- penalties input
- automatic recalculation
- score breakdown preview
- save/autosave feedback

### 4. Results page
- standings table
- total score
- group subtotals
- tie-break aware sorting
- participant details modal/section

### 5. Reference / Settings page
- visible exercise config
- visible scoring assumptions
- debug-friendly reference view for level configs and rule mappings

---

## UX requirements

This app is intended for real use during competition.

The UI must be:
- simple
- fast
- readable
- efficient for repeated data entry

Requirements:
- large clickable controls
- clear hierarchy
- minimal visual clutter
- visible save/autosave status
- confirmation before destructive actions
- safe edit flow
- quick navigation between participants and exercises
- good empty/loading/error states
- decent mobile/tablet tolerance is a plus, but desktop-first is acceptable for MVP

Use shadcn/ui thoughtfully.
Do not over-design.
Functionality and operator speed matter more than decoration.

---

## Docker requirement

The project must run in Docker without requiring local Node.js installation.

Create Docker support from the start.

### Development setup
Provide a Docker-based dev environment with:
- docker compose
- bind-mounted source code
- hot reload
- working Vite dev server inside container
- correct handling of `node_modules`
- external access to the dev server

Expected:
- `docker compose up` starts the project in dev mode
- Vite is reachable from host machine, e.g. on port 5173

Make sure Vite works correctly in Docker:
- proper host binding
- file watching considerations
- stable dev experience

### Production-like setup
Provide a production-ready container setup:
- multi-stage Dockerfile
- build app in builder stage
- serve static output in a compact runtime image
- no unnecessary dev dependencies in final image
- choose either nginx or a lightweight static server
- explain the choice briefly in README

Create:
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `nginx.conf` if needed
- README instructions for dev and production run

Document commands for:
- start dev
- stop containers
- rebuild images
- run production container

---

## File structure expectations

I want the repository to look like a serious MVP foundation, not a throwaway demo.

Please produce:
- a clear folder structure
- reusable domain/config modules
- separate storage layer
- separate scoring engine
- routes wired through TanStack Router
- Effector models/events/effects/stores organized by domain/features
- shadcn-based UI components where appropriate
- README with architecture notes

---

## Testing requirements

Add unit tests for the scoring engine.

At minimum, cover:
- score calculation for a few representative exercises
- penalty application
- subtotal calculation
- total calculation
- ranking/tie-break behavior
- ambiguous logic that was implemented via explicit assumptions

Keep tests focused on business logic, not snapshot-heavy UI tests.

---

## README requirements

Create a useful README that includes:
- project purpose
- stack
- architecture overview
- how scoring logic is organized
- how persistence works
- how to run in Docker (dev/prod)
- main available commands
- assumptions/open questions from the rules
- future backend migration strategy

---

## Important implementation constraints

Do NOT:
- add backend code
- introduce SSR
- switch away from Effector
- switch router
- switch UI kit
- bury rule logic inside components
- implement scoring as a single loose number field without breakdown
- ignore the attached rules document

Do:
- keep the code modular
- keep the domain model explicit
- make scoring explainable
- make state predictable
- keep future API migration in mind

---

## Delivery workflow

Work iteratively and keep changes structured.

Your first response should NOT jump straight into a giant code dump.

In your first response, provide:
1. concise understanding of the task
2. extracted domain entities
3. proposed folder structure
4. implementation plan by steps
5. list of unclear/ambiguous points from the rules
6. Docker plan for dev and production

Then start implementation.

During implementation:
- create files step by step
- explain why each major architectural decision is made
- keep code production-like
- prefer clarity over cleverness
- note assumptions explicitly when rules are unclear

---

## Extra quality bar

The result should feel like a solid base for a real product:
- maintainable architecture
- data-driven scoring engine
- resilient local persistence
- operator-friendly UI
- Dockerized dev workflow
- clean path toward future backend integration