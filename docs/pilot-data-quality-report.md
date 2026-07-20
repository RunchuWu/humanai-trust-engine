# Pilot Data Quality Report

Overall status: **PASS WITH REVIEW**

Source: `data/fixtures/synthetic-pilot.json`

Detected format: `json`

Data classification: deterministic synthetic QA fixture

## Summary

| Metric | Value |
| --- | --- |
| Events | 61 |
| Task shown | 30 |
| Raw decisions | 31 |
| Latest-only decisions | 30 |
| Participants | 3 |
| Decision sessions | 3 |
| Complete sessions | 3 |
| Incomplete sessions | 0 |
| Study run IDs | synthetic-pilot-v1 |

## Blocking Checks

All blocking integrity checks passed.

| Check | Result | Detail |
| --- | --- | --- |
| Unique event IDs | Pass | 0 duplicate group(s) |
| Complete sessions | Pass | 3 complete; 0 incomplete |
| Task shown pairing | Pass | 0 missing earlier task_shown event(s) |
| Condition cue metadata | Pass | 0 source mismatch(es); 0 metadata mismatch(es) |
| Expected conditions | Pass | control, industry_set, user_set |

## Session Completeness

| Participant/session | Condition | Raw decisions | Latest decisions | Unique trials | Result |
| --- | --- | --- | --- | --- | --- |
| 10000000-0000-4000-8000-000000000001 / 11000000-0000-4000-8000-000000000001 | control | 11 | 10 | 10 | Pass |
| 10000000-0000-4000-8000-000000000002 / 11000000-0000-4000-8000-000000000002 | industry_set | 10 | 10 | 10 | Pass |
| 10000000-0000-4000-8000-000000000003 / 11000000-0000-4000-8000-000000000003 | user_set | 10 | 10 | 10 | Pass |

## Condition Assignment

| Condition | Unique participants |
| --- | --- |
| control | 1 |
| industry_set | 1 |
| user_set | 1 |

## Dedupe Contract

Raw decision rows: 31. Latest-only rows: 30. Resubmit groups: 1.

The analysis key is `participant_id + session_id + trial_id`. Within each
key, the row with the greatest `timestamp_ms` is retained. This is the same
shared helper used by `npm run summarize:export -- --latest-only`.

## Review Flags

- 1 decision key(s) contain 1 resubmit row(s); latest-only reduction removes them

## Analysis Boundary

- A passing report means the current export is structurally ready for pilot
  review under the stated latest-only rule; it is not evidence that the HSF
  research design or stimuli have been approved.
- The current event schema does not record whether a row came from debug
  mode. Debug-versus-participant separation therefore still depends on using
  separate `study_run_id` values.
- Condition balance is reported by unique participant. Randomized studies may
  require a statistical allocation tolerance larger than this synthetic gate.
