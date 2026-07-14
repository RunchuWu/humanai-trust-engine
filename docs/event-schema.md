# Event Schema

Events are stored as JSON Lines grouped by study run.

Current storage layout:

- `data/runs/<study_run_id>/events.jsonl`
- `data/runs/<study_run_id>/manifest.json`
- `data/archive/events-legacy-<date>.jsonl` for old local test data

`study_run_id` is resolved from `STUDY_RUN_ID`. If unset, the app uses `local-dev`.

## Common Fields

| Field | Type | Description |
| --- | --- | --- |
| `event_id` | UUID string | Unique event identifier |
| `participant_id` | UUID string | Persistent participant identifier |
| `condition_id` | `"control"`, `"industry_set"`, or `"user_set"` | Assigned cue-source condition |
| `session_id` | UUID string | Page-entry session identifier |
| `study_run_id` | string | Server-assigned study run label; optional for legacy rows |
| `event_type` | `"task_shown"` or `"decision"` | Event kind |
| `timestamp_ms` | number | Unix timestamp in milliseconds |
| `trial_id` | string | Trial identifier |
| `trial_index` | number | Zero-based trial index |

## `task_shown`

Logged when a main-task trial is shown. Practice trial screens do not produce `task_shown` events.

Required fields:

- all common fields

## `decision`

Logged when a participant submits a main-task decision.

Required fields:

| Field | Type | Description |
| --- | --- | --- |
| `decision` | `"accept"` or `"override"` | Whether participant followed or overrode AI |
| `latency_ms` | number | Time from trial shown to decision submit |
| `ai_reco` | `"proceed"` or `"reject"` | AI recommendation |
| `ground_truth` | `"proceed"` or `"reject"` | Trial ground-truth label |
| `follow_ai` | boolean | `true` when decision is `accept` |
| `ai_correct` | boolean | `true` when `ai_reco === ground_truth` |

Optional cue metadata fields:

| Field | Type | Description |
| --- | --- | --- |
| `cue_source` | `"control"`, `"industry_set"`, or `"user_set"` | Cue-source factor for the participant's assigned condition |
| `cue_modules` | array | Effective active cue modules, including researcher debug toggle changes when `?debug=1` is used |
| `agent_name` | string | Rendered agent name, when a name cue is active |
| `agent_tone` | `"neutral"` or `"warm"` | Rendered tone/warmth setting, when available |
| `agent_personality` | `"precise"`, `"supportive"`, or `"calm"` | Rendered personality framing, when available |
| `agent_avatar_label` | string | Rendered avatar label, when an avatar cue is active |

## HSF Metadata Status

Current exports do not yet include explicit HSF fields such as
`hsf_cue_condition_id`, `hsf_dimensions`, `agency_level`, or
`performance_condition`. Those fields are proposed in
`docs/hsf-implementation-handoff.md` and should be added only after the
research team confirms the HSF condition structure.

Current exports also do not yet include manipulation-check events. The proposed
future `manipulation_check` event contract is documented in
`docs/manipulation-check-implementation-spec.md`.

Until then, HSF dimensions are inferred during review from existing cue metadata:

- `cue_source`
- `cue_modules`
- agent metadata
- `ai_reco`
- `ground_truth`
- `ai_correct`

Legacy local rows with `condition_id` values `"A"` or `"B"` are still accepted by validation so older Week 1-2 exports remain readable.

## Export

JSON:

```text
GET /api/export?format=json
```

CSV:

```text
GET /api/export?format=csv
```

Exports default to the current study run, are sorted by `timestamp_ms` ascending, and are validated before export.

Use `docs/export-qa-checklist.md` for current export smoke tests, filter checks, CSV-header expectations, and data-quality checks.

Use the export validator for JSON export arrays, CSV exports, or local JSONL logs:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json'
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv'
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session
```

The validator follows the current event schema, checks CSV header order, and
checks derived fields such as `follow_ai` and `ai_correct`. Add
`--expect-event-count <number>` or `--expect-decision-count <number>` when a
review run should have an exact row count.

For filter QA, add expectation flags:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision' --expect-event-type decision
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&condition_id=control' --expect-condition-id control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&cue_source=control' --expect-cue-source control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&trial_id=ops_01' --expect-trial-id ops_01
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control' --expect-event-type decision --expect-condition-id control --expect-cue-source control --expect-event-count 10 --expect-decision-count 10
```

Supported export filters:

| Query parameter | Example | Description |
| --- | --- | --- |
| `study_run_id` | `pilot-week3` or `all` | Export one run or explicitly export all runs |
| `event_type` | `decision` | Filter to `task_shown` or `decision` |
| `condition_id` | `user_set` | Filter by assigned condition |
| `participant_id` | UUID | Filter by participant |
| `session_id` | UUID | Filter by page-entry session |
| `trial_id` | `ops_01` | Filter by trial |
| `cue_source` | `industry_set` | Filter decision events by cue source |
| `from_timestamp_ms` | number | Include events at or after this timestamp |
| `to_timestamp_ms` | number | Include events at or before this timestamp |

Examples:

```text
GET /api/export?format=csv&event_type=decision
GET /api/export?format=csv&condition_id=user_set
GET /api/export?format=json&study_run_id=all
```

## Researcher Preview

Run summary:

```text
GET /api/runs
```

Filtered preview:

```text
GET /api/events/preview?limit=100
GET /api/events/preview?event_type=decision&condition_id=control
```
