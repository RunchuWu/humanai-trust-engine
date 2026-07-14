# How to Run

## Install

```bash
npm install
```

## Development Server

```bash
npm run dev
```

Optional study-run label:

```bash
STUDY_RUN_ID=pilot-week3 npm run dev
```

Open:

- Participant mode: `http://localhost:3000/task`
- Researcher debug mode: `http://localhost:3000/task?debug=1`

## Participant Flow

The participant flow is:

1. Welcome
2. Consent
3. Instructions
4. Comprehension check
5. Agent setup for `user_set` participants
6. Practice trial
7. Main task
8. Debrief

Main task trials use staged reveal:

1. Operational situation
2. Sensor / context evidence
3. AI recommendation and decision controls

The current task domain is transportation/drone operations. Participants act as
human operators supervising AI recommendations and choose whether to follow or
override each recommendation.

## Cue Conditions

Runtime assignment uses three cue-source conditions:

- `control`: plain system text, no humanlike cues.
- `industry_set`: fixed manufacturer-provided cues.
- `user_set`: participant configures the agent before practice.

Cue modules are configured independently:

- agent name
- tone/warmth
- avatar/face
- personality framing
- confidence/explanation style

## HSF Alignment Status

The current runtime uses cue-source conditions and cue modules. HSF dimensions are
documented for research alignment, but explicit HSF metadata is not yet exported
as runtime fields.

Use these documents for the Week 7-12 HSF review path:

- `docs/hsf-docs-index.md`
- `docs/condition-logic.md`
- `docs/hsf-cue-definitions.md`
- `docs/hsf-cue-interface-note.md`
- `docs/stimulus-schema.md`
- `docs/hsf-stimulus-design.md`
- `docs/hsf-current-trial-readiness.md`
- `docs/hsf-implementation-handoff.md`
- `docs/researcher-walkthrough.md`

After Andrea confirms the participant-facing format and priority HSF dimensions,
the runtime implementation should follow `docs/hsf-implementation-handoff.md`.

## Debug Mode

`/task?debug=1` shows researcher controls:

- current participant, condition, session, screen, and trial index
- reset assignment
- force `control`, `industry_set`, or `user_set`
- inspect cue source and enabled cue modules
- preview the draft HSF mapping for active cue modules, current-trial AI
  correctness, and whether the confidence value is displayed
- toggle HumanQ cue modules for the current debug session:
  - agent name
  - tone/warmth
  - avatar/face
  - personality framing
  - confidence/explanation style
- reset HumanQ toggles to the assigned condition defaults
- jump to any experiment screen
- preview study-run data and recent events
- filter data by run, event type, condition, participant, session, and trial
- export filtered JSON or CSV

Debug controls do not change the participant-facing route unless `debug=1` is present.
HumanQ toggle changes are researcher-only and session-local. New decision events
log the effective active cue modules after any debug toggles.

The HSF preview is a non-exported, researcher-only interpretation of the current
cue modules. It is not an approved HSF condition structure and does not add HSF
metadata to participant events or exports.

## Data Storage And Export

New events are stored by study run:

```text
data/runs/<study_run_id>/events.jsonl
data/runs/<study_run_id>/manifest.json
```

If `STUDY_RUN_ID` is not set, the app uses `local-dev`.

Old single-file local test data should be archived under:

```text
data/archive/events-legacy-<date>.jsonl
```

Useful export URLs:

```text
http://localhost:3000/api/export?format=json
http://localhost:3000/api/export?format=csv
http://localhost:3000/api/export?format=csv&event_type=decision
http://localhost:3000/api/export?format=csv&condition_id=user_set
http://localhost:3000/api/export?format=json&study_run_id=all
```

Researcher preview APIs:

```text
http://localhost:3000/api/runs
http://localhost:3000/api/events/preview?limit=100
```

For export smoke tests, condition coverage, full-session checks, and filter QA,
use `docs/export-qa-checklist.md`.
For the ordered validation, filter assertion, and summary workflow, use
`docs/export-analysis-workflow.md`.

To validate a JSON export, CSV export, or local JSONL event log with the current
event-schema rules:

```bash
npm run validate:export -- --file data/runs/local-dev/events.jsonl
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json'
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv'
```

Add `--full-session` when the export should contain a completed 10-trial
participant session. Add `--expect-event-count <number>` or
`--expect-decision-count <number>` when the expected export size is known.

To summarize current trust-calibration metrics from a JSON export, CSV export,
or local JSONL event log:

```bash
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=json' --latest-only
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=csv' --latest-only
```

## Verification Commands

```bash
npm run verify:final
npm run dev
npm run smoke:runtime
```

Notes:

- `npm run verify:final` runs lint, TypeScript, documentation reference checks, local export validation, local export summary, and production build.
- `npm run smoke:runtime` expects a running app and checks the root redirect, participant page, debug page, run summary API, JSON export, CSV export, and event preview endpoints.
- `npm run build` may require an environment where Next/Turbopack can bind its internal local port. In this sandbox, the build can fail until rerun outside the sandbox.
- `next.config.ts` sets `turbopack.root` to the project directory, so the previous workspace-root warning from the parent `/Users/runchuwu/pnpm-lock.yaml` should not appear in current dev/build output.
- `npm run check:docs` verifies local documentation links and backticked file references under `docs/`.
- Use `docs/verification-log.md` for the latest recorded lint, typecheck, documentation, build, export, and runtime smoke-check results.
