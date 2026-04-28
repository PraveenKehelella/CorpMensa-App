# Neurocognitive Dashboard

A React + TypeScript clinical dashboard for tracking client pain and cognitive performance, including onboarding, trend analysis, and in-app cognitive game sessions.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Chart.js + react-chartjs-2
- ESLint + TypeScript ESLint
- Backend contract: REST API at `http://127.0.0.1:8000/api`
- Database schema contract: SQLite (`sqlite_schema.sql`)

## Features

### Dashboard and client management

- KPI cards for:
  - Total clients
  - Active clients
  - Average pain score
  - Average sleep duration
- Search by client name
- Filter by:
  - Client type (`Business`, `Athlete`)
  - Age group (`Teen`, `Adult`, `Senior`)
  - Sport (`Soccer`, `Cycle`, `Motorbike`, `Boxing`, `Tennis`)
- Client table with core status/measurement fields
- Create client flow via multi-step onboarding wizard
- Client details modal with in-place editing support

### Clinical tracking

- Pain trend chart (historical pain values over time)
- Cognitive trend chart (score/accuracy/reaction and related metrics across sessions)
- Notes capture and update
- Latest health snapshot fields:
  - Pain level
  - Time of day
  - Swelling
  - Internal/External context
  - Headaches
  - Steps
  - Sleep
  - Heart rate

### Cognitive training

- Cognitive Games modal for launching and recording sessions
- Five playable game types:
  - Math MCQ
  - Tap Order
  - Sequence Recall
  - Stroop
  - Reaction
- Per-session normalized result payload:
  - Score
  - Accuracy
  - Average reaction time
  - Maximum sequence
  - Completion time

## UI Structure

Main UI components are organized as:

- `src/App.tsx`
  - Root dashboard page
  - Header actions and modal orchestration
  - KPI cards, filters, and client list
- `src/components/OnboardingModal.tsx`
  - Multi-step new-client wizard
- `src/components/ClientDetailModal.tsx`
  - Detailed client profile, metrics editing, notes, and trend views
- `src/components/PainTrendChart.tsx`
  - Pain timeline chart
- `src/components/CognitiveTrendChart.tsx`
  - Cognitive timeline chart
- `src/components/Modal.tsx`
  - Shared modal shell with close behavior
- `src/components/cognitive/CognitiveGamesModal.tsx`
  - Cognitive session entry, gameplay wrapper, and results
- `src/components/cognitive/GameSelector.tsx`
  - Game selection cards
- `src/components/cognitive/GameContainer.tsx`
  - Renders selected game implementation
- `src/components/cognitive/Timer.tsx`
  - Countdown utility used by game flow
- `src/games/*.tsx`
  - Individual game logic and scoring

## Data Models (Frontend)

Defined in `src/types.ts`.

### Domain enums/unions

- `ClientType`: `Business | Athlete`
- `AgeGroup`: `Teen | Adult | Senior`
- `Sport`: `Soccer | Cycle | Motorbike | Boxing | Tennis`

### Core interfaces

- `PainHistoryPoint`
  - `date: string`
  - `value: number`
- `CognitiveMetrics`
  - `lastSession: string`
  - `reactionTime: number`
  - `accuracy: number`
  - `memoryScore: number`
  - `processingSpeed: number`
- `CognitiveSessionPoint`
  - `date: string`
  - `score: number`
  - `accuracy: number`
  - `reactionTime: number`
  - `memoryScore: number`
  - `processingSpeed: number`
- `GameResult`
  - `score: number`
  - `accuracy: number`
  - `avgReactionTime: number`
  - `maxSequence: number`
  - `completionTime: number`
- `Client`
  - Demographics + health snapshots + notes + status + trends:
  - `id`, `name`, `age`, `type`, `ageGroup`, `sport`
  - `painLevel`, `timeOfDay`, `swelling`, `location`
  - `internalExternal`, `headaches`
  - `steps`, `sleep`, `heartRate`
  - `lastUpdated`, `notes`, `active`
  - `painHistory`
  - `cognitiveMetrics`
  - `cognitiveHistory`

## Data Model (SQLite Schema)

Backend persistence contract is described in `sqlite_schema.sql`.

### Tables

- `clients`
  - Core profile and latest rolled-up health/cognitive values
- `client_pain_locations`
  - Multi-value pain locations per client
- `pain_history`
  - Historical pain readings
- `cognitive_sessions`
  - Each completed cognitive game session
- `cognitive_session_metrics`
  - Per-session metric key/value extension table
- `client_notes_history`
  - Versioned notes entries
- `client_events`
  - Auditable action/event log

### Key relationships

- `client_pain_locations.client_id -> clients.id`
- `pain_history.client_id -> clients.id`
- `cognitive_sessions.client_id -> clients.id`
- `client_notes_history.client_id -> clients.id`
- `client_events.client_id -> clients.id`
- `cognitive_session_metrics.session_id -> cognitive_sessions.id`

Foreign keys are configured with `ON DELETE CASCADE` where applicable. The schema also includes check constraints, unique constraints, indexes, and an `updated_at` trigger.

## API Contract Used by Frontend

Defined in `src/lib/api.ts` with base URL `http://127.0.0.1:8000/api`.

- `GET /clients/`
  - Fetch all clients
- `POST /clients/`
  - Create a client
- `PATCH /clients/{id}/`
  - Partially update a client

Note: This repository contains the frontend client and schema contract, but not the backend server implementation.

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Backend (Django API)

The backend now lives in `backend/` and serves:

- `GET /api/clients/`
- `POST /api/clients/`
- `PATCH /api/clients/{id}/`
- `POST /api/vitals/extract/` (OpenAI image extraction)

Run it locally:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

The API loads `OPENAI_API_KEY` from the repo root `.env`.

## Project Layout

```text
.
├── src
│   ├── components
│   │   ├── cognitive
│   │   ├── ClientDetailModal.tsx
│   │   ├── CognitiveTrendChart.tsx
│   │   ├── Modal.tsx
│   │   ├── OnboardingModal.tsx
│   │   └── PainTrendChart.tsx
│   ├── games
│   ├── lib
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
├── sqlite_schema.sql
├── backend
├── package.json
└── README.md
```

## Notes

- There is currently no `test` script in `package.json`.
- Built frontend output is generated under `dist/`.
