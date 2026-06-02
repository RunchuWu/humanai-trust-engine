# Event Schema

Events are stored as JSON Lines in `data/events.jsonl`.

## Common Fields

| Field | Type | Description |
| --- | --- | --- |
| `event_id` | UUID string | Unique event identifier |
| `participant_id` | UUID string | Persistent participant identifier |
| `condition_id` | `"A"` or `"B"` | Assigned condition |
| `session_id` | UUID string | Page-entry session identifier |
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

## Export

JSON:

```text
GET /api/export?format=json
```

CSV:

```text
GET /api/export?format=csv
```

Exports are sorted by `timestamp_ms` ascending and validated before export.
