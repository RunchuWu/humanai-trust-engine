# HumanAI Trust Calibration Engine

Official Google Summer of Code 2026 project for ISSR / Human-AI Organization.

This repository contains a modular web-based experimentation platform for studying trust calibration in AI-assisted decision-making. The current task domain is transportation and drone operations: participants supervise an AI recommendation in an operations scenario, then decide whether to follow or override it. The platform is designed to support controlled manipulation of humanlike and authority-signaling AI interface cues, behavioral event logging, and reproducible export for downstream analysis.

The project has moved beyond the initial screening prototype. The current codebase is the working GSoC project foundation for the Week 1-2 milestone: deliberate participant flow, stable participant/condition assignment, staged trial presentation, and researcher debug tooling.

## Current Capabilities

- Runs a 10-trial AI-assisted transportation/drone operations task at `/task`
- Guides participants through welcome, consent, instructions, comprehension check, optional user-set agent setup, practice, main task, and debrief
- Uses staged trial reveal so participants see the operational situation, sensor/context evidence, and AI recommendation in sequence
- Randomly assigns participants to `control`, `industry_set`, or `user_set` and persists assignment identity
- Renders modular cue-source/cue-type conditions for agent name, tone/warmth, avatar, personality, and confidence/explanation style
- Logs behavioral events (`task_shown`, `decision`) to local JSONL
- Exports event-level data as JSON or CSV
- Separates participant-facing UI from researcher/debug utilities
- Provides debug tools for condition forcing, screen jumping, reset, and export

## Interface Modes

### Participant-Facing Interface (`/task`)

Default participant mode is clean and task-focused:

- Deliberate screen sequence:
  - Welcome
  - Consent
  - Instructions
  - Comprehension check
  - Agent setup for `user_set` participants
  - Practice trial
  - Main task
  - Debrief
- Staged trial reveal:
  - `Operational Situation`
  - `Sensor / Context Evidence`
  - enlarged AI recommendation
  - equal-weight decision actions: `Follow AI` / `Choose Opposite`
- Completion screen without researcher tooling

Participant-specific UX rules:

- Participants can go back to previous trials and revise answers
- After completing all 10 trials, they can choose **Review Last Trial** to revise
- Researcher export controls are **hidden** in participant mode

### Researcher Debug Mode (`/task?debug=1`)

Debug mode shows researcher utilities without changing experiment logic:

- Debug panel with `participantId`, `conditionId`, cue source/modules, `sessionId`, `current screen`, `current trial_index`
- `Reset` action
- Force `control`, `industry_set`, or `user_set` for researcher review
- Jump to any experiment screen
- Export tools available at any time (including before task completion):
  - `Export JSON`
  - `Export CSV`

This supports quick exploratory checks and mentor review without forcing a full run each time.

## GSoC Timeline Status

### Completed: Weeks 1-2

The Week 1-2 milestone was to rebuild the experiment shell with deliberate screen sequencing and implement participant ID assignment plus randomized condition assignment.

Completed work:

- Explicit experiment flow: `welcome -> consent -> instructions -> comprehension_check -> practice_trial -> main_task -> debrief`
- Practice trial before the main task
- Staged reveal inside trials: role requirements first, candidate summary second, AI recommendation last
- Enlarged AI recommendation display
- Equal-weight decision controls that explicitly accept or override the AI recommendation
- Persistent participant ID and randomized condition assignment
- Debug tools for forcing condition A/B and jumping to any experiment screen
- Centralized experiment configuration in `src/lib/experiment-config.ts`
- Centralized assignment logic in `src/lib/conditions.ts`
- Week 1-2 planning, run, and event-schema documentation

### In Progress: Weeks 3-5

The current phase implements Andrya's revised direction:

- migrate from job screening to transportation/drone operations
- model condition assignment as cue source plus modular cue types
- add a user-set agent configuration screen
- preserve trust-calibration logging fields while adding cue metadata

## Condition Logic

Runtime assignment includes:

- `participant_id` (UUID)
- `condition_id` (`"control" | "industry_set" | "user_set"`)
- `session_id` (UUID)

Persistence strategy:

- `participant_id`: cookie first, fallback `localStorage`
- `condition_id`: random across the three cue-source conditions, cookie first, fallback `localStorage`
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

Decision events also include cue metadata when available:

- `cue_source`, `cue_modules`
- `agent_name`, `agent_tone`, `agent_personality`, `agent_avatar_label`

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
- `src/lib/cue-config.ts`: cue source/module configuration and rendering helpers
- `src/lib/experiment-config.ts`: screen sequence, practice trial, recommendation helpers
- `src/lib/trials.ts`: 10-trial operations dataset
- `src/lib/schema.ts`: event typing + validation
- `docs/week-1-2-plan.md`: Week 1-2 implementation plan and acceptance criteria
- `docs/week-3-5-plan.md`: revised Week 3-5 implementation plan
- `docs/how-to-run.md`: setup, local URLs, and debug-mode guide
- `docs/event-schema.md`: event schema and export reference

## Run Locally

```bash
npm install
npm run dev
```

Open:

- Participant mode: `http://localhost:3000/task`
- Researcher mode: `http://localhost:3000/task?debug=1`

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Local route smoke checks:

```bash
curl -I http://localhost:3000/task
curl -I 'http://localhost:3000/task?debug=1'
```

## Sample Decision Event

```json
{
  "event_id": "6f3f0a67-5e83-4b7f-9f2a-8d1c2a77f401",
  "participant_id": "2df44c3c-6f43-4eef-8f16-e0d1609ca60b",
  "condition_id": "user_set",
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
  "ai_correct": false,
  "cue_source": "user_set",
  "cue_modules": ["agent_name", "tone_warmth", "avatar", "personality", "confidence_explanation"],
  "agent_name": "Nova",
  "agent_tone": "warm",
  "agent_personality": "supportive",
  "agent_avatar_label": "NV"
}
```
