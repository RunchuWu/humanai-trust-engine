# Export Analysis Workflow

This workflow turns the current export QA and analysis plan into a repeatable
sequence for local review. It covers current runtime fields only. Final HSF
metadata and manipulation-check events should be added to this workflow after
the research team confirms the approved runtime implementation.

Use this after completing at least one participant or debug-mode session.

## 0. Run the Synthetic Pilot Gate

Before reviewing a real pilot export, verify the current data contract:

```bash
npm run qa:pilot
```

This regenerates deterministic three-condition JSON and CSV fixtures, validates
exact export counts and schema in both formats, exercises one resubmit, applies
the shared latest-only rule, and writes `docs/pilot-data-quality-report.md`. See
`docs/pilot-data-qa.md` for the complete contract.

## 1. Start a Named Run

Use a study-run label so the exported rows can be traced back to one review
session:

```bash
STUDY_RUN_ID=export-review-local npm run dev
```

Open researcher mode:

```text
http://localhost:3000/task?debug=1
```

Recommended review paths:

- Minimum smoke test: complete at least two main trials, one `Follow AI` and one
  `Choose Opposite`.
- Full-session test: complete all 10 main trials.
- Condition review: repeat for `control`, `industry_set`, and `user_set` when
  condition coverage is needed.

## 2. Export Data

Use API exports:

```text
http://localhost:3000/api/export?format=json&study_run_id=export-review-local
http://localhost:3000/api/export?format=csv&study_run_id=export-review-local
http://localhost:3000/api/export?format=csv&study_run_id=export-review-local&event_type=decision
```

Or validate the local JSONL run log directly:

```bash
npm run validate:export -- --file data/runs/export-review-local/events.jsonl --full-session --expect-decision-count 10
```

Use `--full-session` only when the run should include at least one completed
10-trial participant/session. Add `--expect-event-count <number>` or
`--expect-decision-count <number>` when the exact export size is known.

## 3. Validate Export Shape

Validate JSON and CSV API exports:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&study_run_id=export-review-local' --full-session --expect-decision-count 10
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&study_run_id=export-review-local' --full-session --expect-decision-count 10
```

The validator checks:

- current event-schema shape
- known enum values
- CSV header order
- timestamp ordering
- duplicate event IDs
- duplicate participant/session/trial decision rows
- `follow_ai === (decision === "accept")`
- `ai_correct === (ai_reco === ground_truth)`
- optional exact event and decision counts when expectation flags are supplied

## 4. Assert Filters

Use expectation flags to prove filtered exports contain only the intended rows.
Adjust condition and cue-source values to match the run being checked.

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&study_run_id=export-review-local' --expect-event-type decision
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&event_type=task_shown&study_run_id=export-review-local' --expect-event-type task_shown
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&condition_id=control&study_run_id=export-review-local' --expect-condition-id control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&cue_source=control&study_run_id=export-review-local' --expect-cue-source control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&trial_id=ops_01&study_run_id=export-review-local' --expect-trial-id ops_01
```

For a run that contains all three conditions, repeat condition and cue-source
assertions for each condition present in the run.

When validating a known single-session run, also lock row counts. Example:

```bash
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control&study_run_id=export-review-local' --expect-event-type decision --expect-condition-id control --expect-cue-source control --expect-event-count 10 --expect-decision-count 10
```

## 5. Summarize Trust Calibration

Generate a current-state trust-calibration summary:

```bash
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=json&study_run_id=export-review-local' --latest-only
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=csv&study_run_id=export-review-local' --latest-only
```

The summary reports:

- decision count
- follow-AI rate
- calibrated decision rate
- overtrust rate
- undertrust rate
- correct-follow rate
- correct-override rate
- median latency
- the same metrics by condition and by condition plus AI correctness

Use `--latest-only` when resubmits should be reduced to the latest decision per
participant/session/trial. Omit it when auditing every decision event.

## 6. Interpret Carefully

Current exports support pilot QA and preliminary trust-calibration checks, not
final HSF analysis.

Current interpretation rules:

- `condition_id` is a cue-source condition, not a final HSF condition.
- `ai_correct` is currently derived from `ai_reco === ground_truth`.
- `performance_condition` should be derived as `ai_correct ? "ai_correct" :
  "ai_incorrect"` until an explicit field is implemented.
- Debug-generated data should be separated from participant-mode data before
  analysis.
- Local verification samples are not pilot results.

Before reporting results, record:

- study run ID
- reviewer
- date
- browser/device
- condition(s) reviewed
- whether debug mode was used
- whether `--latest-only` was used
- any duplicate decision rows or resubmits

## 7. Related Documents

- `docs/pilot-data-qa.md`
- `docs/pilot-data-quality-report.md`
- `docs/export-qa-checklist.md`
- `docs/analysis-plan.md`
- `docs/event-schema.md`
- `docs/researcher-walkthrough.md`
- `docs/internal-pilot-notes.md`
- `docs/week-7-12-traceability-matrix.md`
