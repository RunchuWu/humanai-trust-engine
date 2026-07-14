# Current-State Demo Walkthrough

This walkthrough is the current-state demo script for the controlled fixed-stimulus implementation. It should be refreshed if the research team confirms runtime HSF metadata, manipulation checks, or a different participant-facing format.

Use `docs/final-submission-checklist.md` before recording or presenting the final demo.

## Demo Goal

Show that the project supports a controlled AI-assisted decision experiment with:

- staged participant flow
- fixed transportation/drone operations stimuli
- configurable cue conditions
- trust-calibration logging
- researcher debug controls
- exportable data
- a clear path to HSF-aligned cue metadata

## Setup

Recommended recording setup:

```bash
STUDY_RUN_ID=demo-week12 npm run dev
```

Open researcher mode:

```text
http://localhost:3000/task?debug=1
```

Participant-mode fallback:

```text
http://localhost:3000/task
```

If a run label is not needed, start the app with:

```bash
npm run dev
```

## Pre-Demo Verification

Use the latest successful results in `docs/verification-log.md`. For a fresh local check before recording, run:

```bash
npm run verify:final
npm run dev
npm run smoke:runtime
```

## Demo Sequence

### 1. Introduce the Research Task

Explain:

- Participants act as human operators.
- Each trial presents an operational decision.
- The AI recommends one action.
- The participant decides whether to follow or override the AI.

Show:

- Welcome screen.
- Instructions.
- Practice trial.

### 2. Show Staged Trial Reveal

Open a main trial and step through:

1. Operational situation.
2. Sensor / context evidence.
3. AI recommendation and rationale.

Point out:

- Ground truth is not participant-facing.
- Recommendation and evidence are fixed.
- Decision buttons are balanced.

### 3. Show Cue Conditions

Use debug mode to force:

- `control`
- `industry_set`
- `user_set`

For each condition, point out:

- cue source
- active cue modules
- visible recommendation framing
- whether name, avatar, personality, warmth, and confidence are shown

For `user_set`, show:

- agent setup screen
- selected name/tone/personality
- later recommendation display using selected values

### 4. Submit Decisions

Submit at least two decisions:

- one `Follow AI`
- one `Choose Opposite`

Explain current logged trust-calibration fields:

- `decision`
- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`
- `latency_ms`
- cue metadata

### 5. Show Export Workflow

Open:

```text
http://localhost:3000/api/export?format=csv&event_type=decision
```

Then open:

```text
http://localhost:3000/api/export?format=json
```

Point out:

- one row per event in CSV
- structured JSON event records
- participant/session/condition identifiers
- trial identifiers
- trust-calibration fields
- cue metadata

Mention that stricter export review is documented in `docs/export-qa-checklist.md`.
For JSON export validation, show or mention:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json'
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv'
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control' --expect-event-type decision --expect-condition-id control --expect-cue-source control --expect-event-count 10 --expect-decision-count 10
```

For a quick analysis readout, show or mention:

```bash
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
```

### 6. Explain HSF Alignment

Use the docs to show:

- `docs/hsf-cue-interface-note.md`
- `docs/hsf-stimulus-design.md`
- `docs/hsf-current-trial-readiness.md`
- `docs/candidate-trial-expansion-bank.md`
- `docs/ui-salience-reading-load-audit.md`
- `docs/hsf-manipulation-checks.md`
- `docs/manipulation-check-implementation-spec.md`
- `docs/hsf-implementation-handoff.md`
- `docs/analysis-plan.md`

Summarize:

- Appearance: avatar and visual identity.
- Communication: tone, rationale, confidence language.
- Behavior: AI correctness and performance outcome.
- Relationality: warmth and supportive framing.
- Agency: named agent and action framing.

### 7. Explain API Scope

State the current recommendation:

- Do not use live participant-facing API generation for controlled cue-effect studies.
- Use fixed approved stimuli for participant sessions.
- Consider OpenAI API later as a researcher-facing offline drafting tool.

### 8. Close With Current Status

Current state:

- Controlled task flow exists.
- Operations stimuli exist.
- Cue-source conditions exist.
- Logging and export exist.
- HSF mapping and implementation handoff exist.
- Export QA, analysis planning, and final submission checklist exist.
- JSON/CSV/JSONL export validation exists through `npm run validate:export`.
- Trust-calibration summary output exists through `npm run summarize:export`.
- Documentation reference validation exists through `npm run check:docs`.
- Latest lint, TypeScript, and build verification passed, with build requiring sandbox escalation because of Turbopack port binding.
- Runtime smoke check passed for root redirect, participant mode, debug mode, run summary, JSON export, CSV export, and event preview endpoints.
- Runtime API export validation passed for full JSON/CSV exports and filtered control decision JSON/CSV exports.
- Filter assertion and row-count validation passed for filtered control decision JSON/CSV exports and the `ops_01` trial filter.

What this demo does not claim:

- It does not claim final HSF runtime metadata is implemented.
- It does not claim manipulation-check UI/logging is implemented.
- It does not claim candidate expansion trials are approved participant stimuli.
- It does not use live participant-facing AI generation.

Remaining before final HSF pilot:

- Andrea confirms target format and HSF dimensions.
- Research team approves cue definitions and stimuli.
- Runtime schema/debug/export add confirmed HSF metadata.
- Manipulation checks are finalized and implemented if approved.

## Demo Checklist

Before recording or presenting:

- `npm run verify:final` passes, with build rerun outside the sandbox if Turbopack cannot bind its internal local port.
- `docs/verification-log.md` reflects the latest verification run.
- `docs/verification-log.md` reflects the latest runtime smoke check.
- `docs/export-qa-checklist.md` is either run or explicitly deferred.
- `/task` loads.
- `/task?debug=1` loads.
- condition forcing works.
- at least one decision exports correctly.
- final docs reflect the actual current implementation status.
- `docs/final-submission-checklist.md` has no unresolved final-report/demo items except documented research blockers.
