# HumanAI Trust Calibration Engine (GSoC Screening MVP)

A minimal Next.js (App Router) prototype for Human-AI trust calibration in a job-screening setting. The experiment uses **A/B condition manipulation** with only one cue dimension changed: **agent name + tone**.

Participants complete a **10-trial job screening recommendation task**. On each trial, the UI shows AI recommendation and rationale, the participant chooses **Accept** or **Override**, and behavioral events are instrumented for downstream analysis.

## Condition Logic

The runtime assignment includes three IDs:

- `participant_id` (UUID)
- `condition_id` (`"A" | "B"`)
- `session_id` (UUID)

Generation and persistence strategy:

- `participant_id`: generated once, persisted in cookie (fallback: `localStorage`)
- `condition_id`: random 50/50 assignment via `Math.random()`, persisted in cookie (fallback: `localStorage`)
- `session_id`: generated per page-entry session and stored in `sessionStorage`

Behavioral implication:

- Refreshing `/task` keeps `participant_id` and `condition_id` stable
- Opening a new private/incognito window may produce a different condition

## Logging Implementation

### Event Types

- `task_shown`
- `decision`

### Storage

Events are append-only and written to:

- `data/events.jsonl`

Format is JSON Lines:

- one event per line
- each line is `JSON.stringify(event) + "\n"`

### Required Fields (core)

At minimum, logs include:

- `participant_id`
- `condition_id` (condition)
- `decision` (for `decision` events)
- `timestamp_ms` (timestamp)
- `latency_ms` (for `decision` events)

Common event envelope also includes:

- `event_id`, `session_id`, `event_type`, `trial_id`, `trial_index`

## Export

Event-level export endpoints:

- `GET /api/export?format=json`
- `GET /api/export?format=csv`

Notes:

- output is **event-level** (not aggregated per participant)
- events are sorted by `timestamp_ms` ascending

## How To Run Locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/task`

## Sample Output (decision event)

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
