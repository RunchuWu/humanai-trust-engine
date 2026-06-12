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

## Debug Mode

`/task?debug=1` shows researcher controls:

- current participant, condition, session, screen, and trial index
- reset assignment
- force `control`, `industry_set`, or `user_set`
- inspect cue source and enabled cue modules
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

## Verification Commands

```bash
npm run lint
npx tsc --noEmit
curl -L 'http://localhost:3000/task?debug=1'
```

`npm run build` may require an environment where Next/Turbopack can bind its internal local port.
