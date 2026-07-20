# Export QA Checklist

This checklist supports Week 11 reproducibility: a researcher should be able to run the task locally, force conditions, complete a session, and export decision data with the fields needed for current trust-calibration analysis.

It documents current runtime behavior only. HSF metadata and manipulation-check events are future additions until the research team confirms the condition structure and item placement.

For the ordered validation-to-summary workflow, see
`docs/export-analysis-workflow.md`.

Before a manual pilot walkthrough, run the deterministic engineering gate:

```bash
npm run qa:pilot
```

It covers JSON and CSV parsing, all three current conditions, all 10 runtime
trials, one intentional resubmit, latest-decision reduction, session
completeness, task/decision pairing, assignment consistency, cue metadata, and
latency review flags. The full contract is in `docs/pilot-data-qa.md`, and the
generated result is in `docs/pilot-data-quality-report.md`.

## Setup

Start with a clean study-run label so exported rows are easy to inspect:

```bash
STUDY_RUN_ID=export-qa-local npm run dev
```

Open researcher mode:

```text
http://localhost:3000/task?debug=1
```

Before starting, note:

```text
Study run:
Reviewer:
Date:
Browser:
Condition(s) tested:
```

## Minimum Smoke Test

Use this when checking that export still works after a small change.

1. Force `control`.
2. Proceed through the flow in order until the main task.
3. Complete at least two main trials.
4. Use `Follow AI` once.
5. Use `Choose Opposite` once.
6. Jump to or reach debrief.
7. Export:

```text
http://localhost:3000/api/export?format=json&event_type=decision&condition_id=control
http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control
```

Pass criteria:

- JSON export is an array.
- CSV export has a header row and one row per exported event.
- At least two `decision` rows are present.
- Both `accept` and `override` decisions appear.
- `follow_ai` is `true` for `accept` and `false` for `override`.
- `ai_correct` equals `ai_reco === ground_truth`.
- `latency_ms` is present and non-negative.

Optional automated validator:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&event_type=decision&condition_id=control' --expect-event-type decision --expect-condition-id control --expect-cue-source control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control' --expect-event-type decision --expect-condition-id control --expect-cue-source control
```

The validator checks current JSON/CSV event shape, CSV header order, known enum
values, `follow_ai === (decision === "accept")`, `ai_correct === (ai_reco ===
ground_truth)`, timestamp ordering, duplicate event IDs, and duplicate
participant/session/trial decision rows. When the expected row count is known,
add `--expect-event-count <number>` and/or `--expect-decision-count <number>`.

## Condition Coverage Test

Use this before a pilot review.

Repeat the smoke test for:

- `control`
- `industry_set`
- `user_set`

Expected condition metadata:

| Condition | Expected cue fields on `decision` rows |
| --- | --- |
| `control` | `cue_source=control`; `cue_modules` empty or omitted; agent fields empty in CSV |
| `industry_set` | `cue_source=industry_set`; cue modules include name, warmth, avatar, personality, and confidence/explanation; agent fields show the fixed agent |
| `user_set` | `cue_source=user_set`; cue modules include configured cues; agent fields reflect the selected setup values |

For `user_set`, confirm the agent setup screen appears before practice and that the selected agent metadata appears in later decision exports.

## Full Session Test

Use this before sharing a pilot build.

1. Start a new run label, such as `STUDY_RUN_ID=pilot-dry-run-01`.
2. Complete all 10 main trials in participant mode or researcher mode.
3. Export all rows for the run:

```text
http://localhost:3000/api/export?format=json&study_run_id=pilot-dry-run-01
http://localhost:3000/api/export?format=csv&study_run_id=pilot-dry-run-01
http://localhost:3000/api/export?format=csv&study_run_id=pilot-dry-run-01&event_type=decision
```

Pass criteria:

- Exactly 10 `decision` rows exist for one completed participant session.
- Practice trial responses are not present as main-task `decision` rows.
- Each main `trial_id` appears once unless the reviewer intentionally revisited and resubmitted a trial.
- `trial_index` values for a normal completed session cover `0` through `9`.
- `task_shown` rows exist for main-task trials.
- Export rows are sorted by `timestamp_ms` ascending.
- `participant_id`, `condition_id`, and `session_id` are stable within the session.

Optional automated full-session validator:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&study_run_id=pilot-dry-run-01' --full-session --expect-decision-count 10
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&study_run_id=pilot-dry-run-01' --full-session --expect-decision-count 10
```

For local event logs, the same validator can read JSONL directly:

```bash
npm run validate:export -- --file data/runs/pilot-dry-run-01/events.jsonl --full-session --expect-decision-count 10
```

## Current CSV Header

Current CSV export columns are:

```text
event_id,participant_id,condition_id,session_id,event_type,timestamp_ms,trial_id,trial_index,decision,latency_ms,ai_reco,ground_truth,follow_ai,ai_correct,cue_source,cue_modules,agent_name,agent_tone,agent_personality,agent_avatar_label,study_run_id
```

The following columns should be populated for `decision` rows:

- `decision`
- `latency_ms`
- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`
- `cue_source`
- `cue_modules` when cue modules are active
- agent fields when agent cues are active

The following columns are expected to be empty for `task_shown` rows:

- `decision`
- `latency_ms`
- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`
- cue and agent fields

## Filter QA

Check these filters:

| URL | Expected result |
| --- | --- |
| `/api/export?format=csv&event_type=decision` | Only decision rows |
| `/api/export?format=json&event_type=task_shown` | Only task-shown rows |
| `/api/export?format=csv&condition_id=user_set` | Rows assigned to `user_set` |
| `/api/export?format=csv&cue_source=industry_set` | Decision rows with `cue_source=industry_set` |
| `/api/export?format=json&trial_id=ops_01` | Rows for the selected trial |
| `/api/export?format=json&study_run_id=all` | Rows from all study-run directories |
| `/api/events/preview?event_type=decision&condition_id=control` | Preview decision rows for control |
| `/api/runs` | Study-run summaries with event counts and condition breakdowns |

Automated filter assertions:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision' --expect-event-type decision
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&event_type=task_shown' --expect-event-type task_shown
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&condition_id=control' --expect-condition-id control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&cue_source=control' --expect-cue-source control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&trial_id=ops_01' --expect-trial-id ops_01
```

Use the condition and cue-source values that are present in the study run being
checked. For example, a run containing only `control` data should assert
`control` rather than `user_set` or `industry_set`.

If the expected filtered row count is known, add count assertions. For example,
a single completed current run should have 10 decision rows:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control' --expect-event-type decision --expect-condition-id control --expect-cue-source control --expect-event-count 10 --expect-decision-count 10
```

Invalid filter checks:

- `event_type=bad` should return a 400 response.
- `condition_id=bad` should return a 400 response.
- `cue_source=bad` should return a 400 response.
- `from_timestamp_ms` greater than `to_timestamp_ms` should return a 400 response.

## Data Quality Checks

Before using an export for analysis:

- Check duplicate `event_id` values.
- Check duplicate `participant_id` + `trial_id` decision rows.
- Decide whether duplicate decisions represent valid resubmits or should be reduced to the latest row.
- Check incomplete participants with fewer than 10 decision rows.
- Check impossible `latency_ms` values.
- Check condition distribution.
- Check whether debug-generated data is mixed with participant-mode data.
- Record the `study_run_id` used for the export.

The automated validator covers schema shape, derived trust-calibration fields,
CSV header order, timestamp ordering, duplicate event IDs, and duplicate
decisions. With `--expect-event-count` and `--expect-decision-count`, it also
checks exact row-count expectations. It does not replace reviewer judgment about
whether duplicate decision rows are valid resubmits, whether debug-generated
data should be excluded, or whether a participant's choices are analytically
usable.

For a quick trust-calibration readout after validation, run:

```bash
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=json' --latest-only
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=csv' --latest-only
```

Use the summary output to inspect follow-AI rate, calibrated decision rate,
overtrust, undertrust, correct follow, correct override, and median latency by
condition.

## Future HSF QA Additions

After confirmed Week 9 implementation, extend this checklist to verify:

- `hsf_cue_condition_id`
- `hsf_dimensions`
- `appearance_level`
- `communication_level`
- `relationality_level`
- `agency_level`
- `confidence_signal_level`
- `performance_condition`
- `event_type=manipulation_check`, if implemented

The future manipulation-check QA contract is documented in `docs/manipulation-check-implementation-spec.md`.
