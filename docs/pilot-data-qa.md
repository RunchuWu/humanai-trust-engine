# Pilot and Data QA Workflow

This workflow provides a direction-independent engineering gate before pilot
data are interpreted. It exercises the current three cue-source conditions and
the current 10 runtime trials without asserting that the final HSF design has
been approved.

## Single Command

Run from the repository root:

```bash
npm run qa:pilot
```

The command performs three deterministic steps:

1. Regenerates `data/fixtures/synthetic-pilot.json` and
   `data/fixtures/synthetic-pilot.csv` from the 10 `runtime_current` records in
   the structured stimulus bank.
2. Runs the existing export-schema validator against both formats with exact
   event and decision counts.
3. Runs the pre-analysis QA checker and regenerates
   `docs/pilot-data-quality-report.md`.

`npm run verify:final` includes this gate.

## Synthetic Fixture Contract

The fixtures contain no participant data. They use fixed UUIDs, timestamps, and
the study run ID `synthetic-pilot-v1`. JSON and CSV contain the same 61 events;
the CSV header follows the current API export-column contract. The documented
control value `cue_modules: []` is an empty CSV cell and parses back as omitted,
so format-equivalence checks normalize empty and omitted control cue modules.

Expected contents:

| Item | Expected value |
| --- | --- |
| Conditions | `control`, `industry_set`, `user_set` |
| Participants | 3, one per condition |
| Sessions | 3 complete sessions |
| Runtime trials per session | 10 |
| `task_shown` events | 30 |
| Raw `decision` events | 31 |
| Latest-only decisions | 30 |
| Intentional resubmits | 1 |

The one intentional resubmit proves that raw and analysis-ready counts differ
and that the documented reduction rule is active.

## Dedupe Rule

Both the pilot QA checker and `summarize:export -- --latest-only` use
`scripts/decision-utils.mjs`.

The decision key is:

```text
participant_id + session_id + trial_id
```

For each key, the row with the greatest `timestamp_ms` is retained. A resubmit
is reported for review but is not a blocking failure when the latest row can be
selected unambiguously.

## Blocking Checks

The pre-analysis QA script fails with a non-zero exit code when it finds:

- duplicate `event_id` groups;
- one participant assigned to multiple conditions;
- a `session_id` shared across participants;
- missing `study_run_id` values;
- cue source or required condition cue-metadata mismatches;
- incomplete decision sessions after latest-only reduction;
- latest decisions without an earlier matching `task_shown` event;
- missing explicitly expected conditions or complete-session counts.

The script reports, but does not automatically reject:

- valid resubmit groups;
- repeated `task_shown` events;
- task-shown groups with no decision;
- condition allocation imbalance;
- unusually low or high latency values;
- exports that combine multiple study-run IDs.

## Running on Pilot Exports

Validate an exported file:

```bash
npm run validate:export -- --file path/to/events.json --full-session
node scripts/pilot-data-qa.mjs --file path/to/events.json --expect-conditions control,industry_set,user_set --report path/to/pilot-qa-report.md
```

Validate a running server export:

```bash
node scripts/pilot-data-qa.mjs --url 'http://localhost:3000/api/export?format=json&study_run_id=pilot-run-id' --report /tmp/pilot-qa-report.md
```

Use expected-condition and expected-session assertions only when the run's data
collection plan requires them. Random assignment can produce participant-count
imbalance without indicating corrupted data.

## Current Boundary

The event schema does not currently record whether an event came from debug
mode. A pilot must therefore use separate `STUDY_RUN_ID` values for researcher
debug sessions and participant sessions. The QA report calls out this limitation
instead of claiming it can infer debug provenance.

This workflow validates data engineering readiness. It does not approve the
stimuli, HSF factors, manipulation checks, or participant-facing experiment
format.
