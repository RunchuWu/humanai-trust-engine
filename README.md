# HumanAI Trust Calibration Engine (GSoC Screening MVP)

Minimal Next.js (App Router) prototype for a trust-calibration experiment in job screening.
The experiment manipulates one cue dimension across A/B conditions: **agent name + tone style**.

## What This Repo Does

- Runs a 10-trial job-screening task at `/task`
- Logs behavioral events (`task_shown`, `decision`) to local JSONL
- Exports event-level data as JSON or CSV
- Separates participant-facing UI from researcher/debug utilities

## Interface Modes

### Participant-Facing Interface (`/task`)

Default participant mode is clean and task-focused:

- Instruction gate before trials
- Trial screen with:
  - `Role & Requirements`
  - `Candidate Summary`
  - Agent panel (name + clear position + rationale)
  - Decision actions: `Accept` / `Override`
- Completion screen without researcher tooling

Participant-specific UX rules:

- Participants can go back to previous trials and revise answers
- After completing all 10 trials, they can choose **Review Last Trial** to revise
- Researcher export controls are **hidden** in participant mode

### Researcher Debug Mode (`/task?debug=1`)

Debug mode shows researcher utilities without changing experiment logic:

- Debug panel with `participantId`, `conditionId`, `sessionId`, `current trial_index`
- `Reset` action
- Export tools available at any time (including before task completion):
  - `Export JSON`
  - `Export CSV`

This supports quick exploratory checks without forcing a full run each time.

## Condition Logic

Runtime assignment includes:

- `participant_id` (UUID)
- `condition_id` (`"A" | "B"`)
- `session_id` (UUID)

Persistence strategy:

- `participant_id`: cookie first, fallback `localStorage`
- `condition_id`: 50/50 random (`Math.random()`), cookie first, fallback `localStorage`
- `session_id`: generated per page-entry session (`sessionStorage`)

Behavioral implication:

- Refresh keeps `participant_id` + `condition_id` stable
- New private/incognito window may receive a different condition

## Logging Implementation

### Event Types

- `task_shown`
- `decision`

### Storage

Append-only JSON Lines file:

- `data/events.jsonl`
- one event per line (`JSON.stringify(event) + "\n"`)

### Core Fields (minimum)

- `participant_id`
- `condition_id`
- `decision` (for `decision` events)
- `timestamp_ms`
- `latency_ms` (for `decision` events)

Common envelope also includes:

- `event_id`, `session_id`, `event_type`, `trial_id`, `trial_index`

## Export

Event-level export endpoints:

- `GET /api/export?format=json`
- `GET /api/export?format=csv`

Both are sorted by `timestamp_ms` ascending.

## Repository Navigation

- `src/app/task/page.tsx`: main experiment flow and participant UI
- `src/app/task/task.module.css`: task UI styles
- `src/app/task/components/DebugPanel.tsx`: researcher debug panel
- `src/app/api/log/route.ts`: event ingestion API
- `src/app/api/export/route.ts`: event export API
- `src/lib/conditions.ts`: assignment/persistence logic
- `src/lib/trials.ts`: 10-trial dataset
- `src/lib/schema.ts`: event typing + validation

## Run Locally

```bash
npm install
npm run dev
```

Open:

- Participant mode: `http://localhost:3000/task`
- Researcher mode: `http://localhost:3000/task?debug=1`

## Sample Decision Event

```json
{
  "event_id": "6f3f0a67-5e83-4b7f-9f2a-8d1c2a77f401",
  "participant_id": "2df44c3c-6f43-4eef-8f16-e0d1609ca60b",
  "condition_id": "A",
  "session_id": "9f9f71ce-53c0-4f29-8b8b-c83f9557f2d0",
  "event_type": "decision",
  "timestamp_ms": 1762056654789,
  "trial_id": "trial_03",
  "trial_index": 2,
  "decision": "override",
  "latency_ms": 1842,
  "ai_reco": "reject",
  "ground_truth": "proceed",
  "follow_ai": false,
  "ai_correct": false
}
```
