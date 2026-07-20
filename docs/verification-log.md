# Verification Log

This log records verification commands run during Week 7-12 work.

## Participant UI Redesign - 2026-07-20 CST

Change verified:

- Added the participant app header, phase state, accessible main-task progress,
  and non-interactive trial stage indicator.
- Replaced legacy participant card styles with one responsive operations
  workspace and consistent controls/status states.
- Kept condition-specific cue rendering, trial content, screen flow, logging,
  Researcher Tools behavior, and export contracts unchanged.

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run qa:pilot
npm run dev -- --port 3001
npm run smoke:runtime -- --base-url http://localhost:3001 --timeout-ms 15000
npm run verify:final
git diff --check
```

Results:

| Check | Result | Notes |
| --- | --- | --- |
| ESLint | Passed | Completed with exit code 0 |
| TypeScript | Passed | `tsc --noEmit` completed with exit code 0 |
| Pilot/data regression | Passed with expected review flag | All three conditions, 61 raw events, 30 latest decisions, and export contracts passed; the synthetic resubmit remains the intentional flag |
| Participant route | Passed | `HEAD /task` returned 200 |
| Researcher debug route | Passed | `HEAD /task?debug=1` returned 200 |
| API and exports | Passed | Runs, preview, JSON export, and CSV export checks returned expected status and content types |
| Documentation references | Passed | Checked 774 local references across 43 Markdown files |
| Stimulus validation | Passed with existing warnings | Runtime stimuli remain synchronized; existing `ops_01`, `ops_04`, and `ops_10` rationale-length warnings remain |
| Production build | Passed | Next.js compiled successfully in 3.4 seconds and generated all static pages |
| Event/schema source comparison | Passed | No event construction, submission handler, schema, trial, condition, or export files changed |
| Browser screenshots | Not run | In-app browser discovery returned an empty target list |
| Full keyboard/condition walkthrough | Not run | Requires an interactive browser target; remains the manual acceptance step |

Target viewport rules inspected in source:

- 1440x900: workspace is capped at 880px.
- 768x1024: workspace retains full hierarchy with reduced outer padding.
- 390x844 and 320x568: controls use one column, long labels can wrap, stage
  labels use stable three-column tracks, and horizontal page overflow is
  disabled.

## Pilot and Data QA - 2026-07-20 CST

Change verified:

- Added deterministic synthetic sessions for all three current conditions.
- Added equivalent JSON and API-column-compatible CSV fixture validation.
- Added shared latest-decision reduction and a pre-analysis Markdown report.
- Added blocking integrity/session/assignment checks and non-blocking review
  flags.
- Added `npm run qa:pilot` to the final verification chain.
- Replaced the ignored local-run fixture in `verify:final` with the tracked
  deterministic synthetic fixture.

Commands run from repository root:

```bash
node --check scripts/decision-utils.mjs
node --check scripts/generate-synthetic-pilot.mjs
node --check scripts/pilot-data-qa.mjs
node --check scripts/summarize-export.mjs
npm run qa:pilot
npm run lint
npx tsc --noEmit
shasum -a 256 data/fixtures/synthetic-pilot.json data/fixtures/synthetic-pilot.csv docs/pilot-data-quality-report.md
node scripts/pilot-data-qa.mjs --file /tmp/humanai-incomplete-pilot.json --expect-conditions control,industry_set,user_set --expect-complete-sessions 3
node scripts/pilot-data-qa.mjs --file /tmp/humanai-duplicate-id-pilot.json --expect-conditions control,industry_set,user_set --expect-complete-sessions 3
npm run verify:final
```

Results:

| Check | Result | Notes |
| --- | --- | --- |
| Script syntax | Passed | All four changed/new scripts passed `node --check` |
| Synthetic generation | Passed | Generated equivalent JSON/CSV fixtures with 61 events, three conditions, three sessions, and one intentional resubmit |
| JSON export validation | Passed with expected warning | Schema and exact 61-event/31-decision counts passed; the intentional repeated decision was reported |
| CSV export validation | Passed with expected warning | Header, parsed schema, and exact 61-event/31-decision counts matched JSON; the intentional repeated decision was reported |
| JSON/CSV normalized equivalence | Passed | All 61 parsed events matched after normalizing the documented empty-versus-omitted control `cue_modules` value |
| Pilot pre-analysis QA | Passed with review | Three complete sessions and 30 latest-only decisions passed all blocking checks; one intentional resubmit remains a review flag |
| Assignment checks | Passed | One stable synthetic participant/session exists for each current condition |
| Task/decision pairing | Passed | All 30 latest decisions have an earlier matching `task_shown` event |
| Cue metadata | Passed | Cue source and required condition metadata match current control, industry-set, and user-set contracts |
| Deterministic rerun | Passed | Fixture and report SHA-256 values were unchanged after regeneration |
| Incomplete-session negative test | Passed | Removing the final user-set decision produced a failed session and exit code 1 |
| Duplicate-ID negative test | Passed | Reusing an event ID produced a blocking failure and exit code 1 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |
| Documentation references | Passed | Final scan covered 43 markdown files and 774 local references |
| Latest-only summary | Passed | Reduced 31 raw decisions to 30 analysis decisions across three complete condition sessions |
| Final verification chain | Passed after sandbox escalation | Lint, TypeScript, docs, stimulus validation, JSON/CSV pilot QA, summary, and build all passed without ignored local-run data |
| Production build | Passed | Next.js compiled successfully in 2.5s and generated all static pages |

## Baseline UX and Accessibility - 2026-07-20 CST

Change verified:

- Added screen/stage heading focus management and visible focus indicators.
- Added status, alert, and busy semantics to shared participant states.
- Increased shared touch targets and completed reduced-motion handling.
- Forced a consistent light browser color scheme and study-specific metadata.
- Kept stimuli, conditions, cue presentation, event schema, and exports
  unchanged.

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run dev -- --port 3001
npm run smoke:runtime -- --base-url http://localhost:3001
```

Results:

| Check | Result | Notes |
| --- | --- | --- |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |
| Development server | Passed | Next.js started at `http://localhost:3001` in 1551ms |
| Runtime route smoke | Passed after sandbox escalation | Root redirect, participant/debug pages, run API, JSON/CSV exports, and event preview all returned expected statuses |
| Final verification chain | Passed after sandbox escalation | Lint, TypeScript, docs, stimulus validation, export validation, summary generation, and build all passed |
| Stimulus validation | Passed with known warnings | All 16 records passed; the existing `ops_01`, `ops_04`, and `ops_10` reading-load warnings remain |
| Export validation | Passed | Existing fixture contained 22 events and 10 decisions in the expected control condition |
| Production build | Passed | Next.js compiled successfully in 2.5s and generated all static pages |
| In-app browser availability | Unavailable | Browser runtime initialized, but the available-browser list was empty |
| Desktop/mobile visual inspection | Pending | No screenshot or interactive-browser result is claimed for this session |

## Stimulus Dataset Validation - 2026-07-16 CST

Change verified:

- Added a structured 16-record, review-only stimulus bank.
- Added field, balance, error-type, reading-load, and runtime-sync validation.
- Added `npm run validate:stimuli` to the final verification chain.
- Kept all six candidates out of participant runtime.

Commands run from repository root:

```bash
node --check scripts/validate-stimuli.mjs
npm run validate:stimuli
npm run validate:stimuli -- --json
npm run lint
npx tsc --noEmit
npm run check:docs
git diff --check
```

Results:

| Check | Result | Notes |
| --- | --- | --- |
| Script syntax | Passed | `node --check scripts/validate-stimuli.mjs` completed with exit code 0 |
| Dataset structure and balance | Passed | 16 total; four per trial type; 8/8 truth, recommendation, and correctness balances; four errors in each direction |
| Runtime synchronization | Passed | All 10 `runtime_current` records match `src/lib/trials.ts` exactly |
| Review status | Expected pending state | All 16 records remain `pending`; validation is not research approval |
| Reading-load review | Three warnings | `ops_01`, `ops_04`, and `ops_10` exceed the six-word paired-rationale warning threshold |
| Machine-readable report | Passed | `--json` produced counts, confidence summary, runtime sync, per-trial rationale loads, warnings, and no errors |
| ESLint | Passed after local correction | Initial lint rejected a script variable named `module`; it was renamed and lint then passed |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |
| Documentation references | Passed | Final post-documentation `npm run check:docs` scan covered 40 markdown files and 744 local references |
| Diff whitespace | Passed before final log update | `git diff --check` completed with exit code 0 |
| Final verification chain | Passed after sandbox escalation | The sandboxed run reached build and failed on Turbopack's internal port bind; the full rerun passed outside the sandbox |
| Production build | Passed | Next.js compiled successfully in 1751.0 ms |
| Data ignore boundary | Passed | `data/stimuli/*.json` is trackable while `data/runs/` and `data/archive/` remain ignored |

## HSF Debug Preview Verification - 2026-07-14 CST

Change verified:

- Added a researcher-only, draft HSF preview in debug mode.
- The preview derives HSF dimensions from active cue modules and shows current
  trial AI correctness plus confidence visibility.
- Participant event schema, JSON/CSV export fields, fixed trials, and formal
  condition IDs remain unchanged.

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run check:docs
git diff --check
npm run build
npm run dev
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |
| Documentation references | Passed | Final `npm run check:docs` scan covered 39 markdown files and 705 local references |
| Diff whitespace check | Passed | Final `git diff --check` completed with exit code 0 |
| Production build | Passed after sandbox escalation | The sandboxed build could not bind Turbopack's internal local port; the rerun compiled successfully in 1916.4 ms |
| Development server startup | Passed | `npm run dev` started at `http://localhost:3000` with no workspace-root warning |
| Browser visual inspection | Not available in this session | No in-app browser target was exposed, so the collapsed researcher panel could not be opened interactively here |

## Runtime Smoke Script Check - 2026-07-11 15:09 CST

Commands run from repository root:

```bash
node --check scripts/smoke-runtime.mjs
npm run dev
npm run smoke:runtime
npm run check:docs
git diff --check
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Runtime smoke script syntax | Passed | `node --check scripts/smoke-runtime.mjs` completed with exit code 0 |
| Dev server startup | Passed | Next dev server started at `http://localhost:3000` and was stopped after the check attempt |
| Runtime smoke script in sandbox | Failed due environment | `npm run smoke:runtime` failed because Node fetch could not access localhost from the sandbox |
| Escalated runtime smoke rerun | Not run | Escalation was unavailable because the current usage limit was reached |
| Current runtime evidence | Still covered | Latest passing runtime evidence remains the `Runtime Smoke Refresh - 2026-07-11 14:52 CST` HEAD check |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 692 local references |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |

## Final Verification Script Check - 2026-07-11 15:02 CST

Commands run from repository root:

```bash
npm run verify:final
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Final verification script | Passed after sandbox escalation | Initial sandbox run reached build and failed because Turbopack could not bind an internal local port; rerun outside the sandbox completed successfully |
| ESLint | Passed | `npm run lint` completed inside `npm run verify:final` |
| TypeScript | Passed | `tsc --noEmit` completed inside `npm run verify:final` |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 682 local references |
| JSONL validation | Passed | Local JSONL validation matched 22 total events and 10 decision events |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Production build | Passed after sandbox escalation | Build compiled successfully in 1909.7 ms |
| Build workspace root | Passed | Latest successful build did not emit the previous workspace-root warning |

## Final Submission Checklist Reconciliation - 2026-07-11 14:56 CST

Commands run from repository root:

```bash
npm run check:docs
git diff --check
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 674 local references |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |

## Runtime Smoke Refresh - 2026-07-11 14:52 CST

Commands run from repository root:

```bash
npm run dev
curl -I 'http://localhost:3000/'
curl -I 'http://localhost:3000/task'
curl -I 'http://localhost:3000/task?debug=1'
curl -I 'http://localhost:3000/api/runs'
curl -I 'http://localhost:3000/api/export?format=json'
curl -I 'http://localhost:3000/api/export?format=csv'
curl -I 'http://localhost:3000/api/events/preview?limit=5'
npm run check:docs
git diff --check
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Dev server startup | Passed | Next dev server started at `http://localhost:3000` |
| Turbopack project directory | Passed | Startup output showed project dir as `/Users/runchuwu/Desktop/humanai-trust-engine` |
| Workspace-root warning | Passed | Startup output did not emit the previous parent-root warning |
| `HEAD /` | Passed | Returned `307 Temporary Redirect` to `/task` |
| `HEAD /task` | Passed | Returned `200 OK` with HTML content type |
| `HEAD /task?debug=1` | Passed | Returned `200 OK` with HTML content type |
| `HEAD /api/runs` | Passed | Returned `200 OK` with JSON content type |
| `HEAD /api/export?format=json` | Passed | Returned `200 OK` with JSON content type |
| `HEAD /api/export?format=csv` | Passed | Returned `200 OK`, CSV content type, and attachment disposition |
| `HEAD /api/events/preview?limit=5` | Passed | Returned `200 OK` with JSON content type |
| Dev server shutdown | Passed | Server was stopped after the smoke checks |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 666 local references |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |

## Final Verification Refresh - 2026-07-11 14:47 CST

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run check:docs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control --expect-event-count 22 --expect-decision-count 10
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
npm run build
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 662 local references |
| JSONL validation | Passed | Local JSONL validation matched 22 total events and 10 decision events |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Production build | Passed after sandbox escalation | Sandboxed build failed because Turbopack could not bind an internal local port; rerun outside the sandbox compiled successfully in 1792.4 ms |
| Build workspace root | Passed | Latest successful build did not emit the previous workspace-root warning |

## Demo Walkthrough Current-Status Check - 2026-07-11 14:44 CST

Commands run from repository root:

```bash
node --check scripts/check-doc-references.mjs
npm run check:docs
node --check scripts/validate-export.mjs
node --check scripts/summarize-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control --expect-event-count 22 --expect-decision-count 10
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Documentation reference checker syntax | Passed | `node --check scripts/check-doc-references.mjs` completed with exit code 0 |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 659 local references |
| Validator syntax | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Summary syntax | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| JSONL validation | Passed | Local JSONL validation matched 22 total events and 10 decision events |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Final Report Current-Status Check - 2026-07-11 14:41 CST

Commands run from repository root:

```bash
node --check scripts/check-doc-references.mjs
npm run check:docs
node --check scripts/validate-export.mjs
node --check scripts/summarize-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control --expect-event-count 22 --expect-decision-count 10
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Documentation reference checker syntax | Passed | `node --check scripts/check-doc-references.mjs` completed with exit code 0 |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 653 local references |
| Validator syntax | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Summary syntax | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| JSONL validation | Passed | Local JSONL validation matched 22 total events and 10 decision events |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Documentation Reference Check - 2026-07-11 14:36 CST

Commands run from repository root:

```bash
node --check scripts/check-doc-references.mjs
npm run check:docs
node --check scripts/validate-export.mjs
node --check scripts/summarize-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control --expect-event-count 22 --expect-decision-count 10
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Documentation reference checker syntax | Passed | `node --check scripts/check-doc-references.mjs` completed with exit code 0 |
| Documentation references | Passed | `npm run check:docs` scanned 39 markdown files and 648 local references |
| Validator syntax | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Summary syntax | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| JSONL validation | Passed | Local JSONL validation matched 22 total events and 10 decision events |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Export Row-Count Assertion Check - 2026-07-11 14:31 CST

Commands run from repository root:

```bash
node --check scripts/validate-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control --expect-event-count 22 --expect-decision-count 10
npm run validate:export -- --file /tmp/humanai-decisions-control.json --full-session --expect-event-type decision --expect-condition-id control --expect-cue-source control --expect-event-count 10 --expect-decision-count 10
npm run validate:export -- --file /tmp/humanai-ops01.json --expect-trial-id ops_01 --expect-condition-id control --expect-event-count 4 --expect-decision-count 1
node --check scripts/export-utils.mjs
node --check scripts/summarize-export.mjs
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Validator syntax | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| JSONL count assertion | Passed | Local JSONL validation matched 22 total events and 10 decision events |
| Decision filter count assertion | Passed | Filtered control decision sample matched 10 total events and 10 decision events |
| Trial filter count assertion | Passed | `ops_01` sample matched 4 total events and 1 decision event |
| Shared parser syntax | Passed | `node --check scripts/export-utils.mjs` completed with exit code 0 |
| Summary syntax | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Export Tool Parser Refactor Check - 2026-07-11 14:25 CST

Commands run from repository root:

```bash
node --check scripts/export-utils.mjs
node --check scripts/validate-export.mjs
node --check scripts/summarize-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control
npm run validate:export -- --file /tmp/humanai-export-sample.csv --full-session --expect-condition-id control
npm run validate:export -- --file /tmp/humanai-decisions-control.json --full-session --expect-event-type decision --expect-condition-id control --expect-cue-source control
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Shared parser syntax | Passed | `node --check scripts/export-utils.mjs` completed with exit code 0 |
| Validator syntax | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Summary syntax | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| JSONL validation | Passed | Local JSONL events still validate with full-session and condition assertion |
| CSV validation | Passed | Temporary CSV sample still validates with full-session and condition assertion |
| Filter assertion validation | Passed | Filtered decision JSON sample still validates with event-type, condition, and cue-source assertions |
| Summary output | Passed | Summary output still reports 10 latest decisions, 50.0% follow-AI, and 70.0% calibration |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Export Filter Assertion Check - 2026-07-11 14:19 CST

Commands run from repository root:

```bash
node --check scripts/validate-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-condition-id control
npm run validate:export -- --file /tmp/humanai-export-sample.csv --expect-condition-id control
npm run validate:export -- --file /tmp/humanai-decisions-control.json --full-session --expect-event-type decision --expect-condition-id control --expect-cue-source control
npm run validate:export -- --file /tmp/humanai-ops01.json --expect-trial-id ops_01 --expect-condition-id control
npm run dev
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&event_type=decision&condition_id=control' --full-session --expect-event-type decision --expect-condition-id control --expect-cue-source control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control' --full-session --expect-event-type decision --expect-condition-id control --expect-cue-source control
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&trial_id=ops_01' --expect-trial-id ops_01 --expect-condition-id control
node --check scripts/summarize-export.mjs
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Script syntax check | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Local JSONL condition assertion | Passed | All 22 local JSONL events matched `condition_id=control` |
| Local CSV condition assertion | Passed | All 22 temporary CSV events matched `condition_id=control` |
| Local decision filter assertion | Passed | 10 filtered decision JSON events matched event type, condition, and cue-source expectations |
| Local trial filter assertion | Passed | 4 filtered `ops_01` JSON events matched trial and condition expectations |
| API JSON decision filter assertion | Passed after sandbox escalation | 10 live JSON decision events matched event type, condition, and cue-source expectations |
| API CSV decision filter assertion | Passed after sandbox escalation | 10 live CSV decision events matched event type, condition, cue source, and CSV header expectations |
| API trial filter assertion | Passed after sandbox escalation | 4 live JSON events matched `trial_id=ops_01` and `condition_id=control` |
| Summary script syntax check | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Export Summary Check - 2026-07-11 14:15 CST

Commands run from repository root:

```bash
node --check scripts/summarize-export.mjs
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
npm run summarize:export -- --file /tmp/humanai-export-sample.csv --latest-only
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Script syntax check | Passed | `node --check scripts/summarize-export.mjs` completed with exit code 0 |
| JSONL summary | Passed | Summarized `data/runs/local-dev/events.jsonl` with latest decision per participant/session/trial |
| Decision count | Passed | Reported 10 latest decision events |
| Follow-AI rate | Passed | Reported 5/10 follow-AI decisions, 50.0% |
| Calibration rate | Passed | Reported 7/10 calibrated decisions, 70.0% |
| Overtrust and undertrust | Passed | Reported 1/10 overtrust and 2/10 undertrust decisions |
| Median latency | Passed | Reported 2204.5 ms median latency |
| CSV summary | Passed | `/tmp/humanai-export-sample.csv` produced the same trust-calibration summary as the JSONL source |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Runtime API Export Validation - 2026-07-11 14:12 CST

Command run from repository root:

```bash
npm run dev
curl -I 'http://localhost:3000/api/export?format=json'
curl -I 'http://localhost:3000/api/export?format=csv'
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json' --full-session
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv' --full-session
npm run validate:export -- --url 'http://localhost:3000/api/export?format=json&event_type=decision&condition_id=control' --full-session
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv&event_type=decision&condition_id=control' --full-session
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Dev server startup | Passed | Next dev server started at `http://localhost:3000`; startup showed project dir as `/Users/runchuwu/Desktop/humanai-trust-engine` |
| `HEAD /api/export?format=json` | Passed | Returned `200 OK` and `content-type: application/json` |
| `HEAD /api/export?format=csv` | Passed | Returned `200 OK`, `content-type: text/csv`, and CSV attachment disposition |
| Full JSON API export validation | Passed after sandbox escalation | Node fetch was blocked in sandbox; rerun outside sandbox validated 22 events and a full 10-decision session |
| Full CSV API export validation | Passed after sandbox escalation | Node fetch was blocked in sandbox; rerun outside sandbox validated 22 events, CSV header order, and a full 10-decision session |
| Filtered JSON decision export validation | Passed after sandbox escalation | Validated 10 control decision events with 5 `accept` and 5 `override` decisions |
| Filtered CSV decision export validation | Passed after sandbox escalation | Validated 10 control decision events with 5 `accept` and 5 `override` decisions |

## Export Validator Check - 2026-07-11 14:03 CST

Command run from repository root:

```bash
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session
node --check scripts/validate-export.mjs
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| JSONL parse | Passed | Read `data/runs/local-dev/events.jsonl` |
| Event schema validation | Passed | Validated 22 events: 12 `task_shown`, 10 `decision` |
| Trust-calibration derived fields | Passed | `follow_ai` and `ai_correct` matched their derivation rules |
| Full-session coverage | Passed | Found at least one 10-decision session covering trial indexes 0-9 |
| Duplicate event IDs | Passed | No duplicate event IDs reported |
| Script syntax check | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## CSV Export Validator Check - 2026-07-11 14:07 CST

Commands run from repository root:

```bash
node -e '<generated /tmp/humanai-export-sample.csv from data/runs/local-dev/events.jsonl>'
node --check scripts/validate-export.mjs
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session
npm run validate:export -- --file /tmp/humanai-export-sample.csv --full-session
git diff --check
npm run lint
npx tsc --noEmit
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Temporary CSV generation | Passed | Generated `/tmp/humanai-export-sample.csv` with the current CSV columns and 22 event rows |
| CSV format detection | Passed | Validator reported `Detected format: csv` |
| CSV header validation | Passed | Header matched current export columns |
| Event schema validation | Passed | Validated 22 CSV rows as events |
| Trust-calibration derived fields | Passed | `follow_ai` and `ai_correct` matched their derivation rules |
| Full-session coverage | Passed | Found at least one 10-decision session covering trial indexes 0-9 |
| JSONL regression validation | Passed | `data/runs/local-dev/events.jsonl` still validates with `--full-session` |
| Script syntax check | Passed | `node --check scripts/validate-export.mjs` completed with exit code 0 |
| Diff whitespace check | Passed | `git diff --check` completed with exit code 0 |
| ESLint | Passed | `npm run lint` completed with exit code 0 |
| TypeScript | Passed | `npx tsc --noEmit` completed with exit code 0 |

## Post-Turbopack Root Runtime Smoke Check - 2026-07-11 13:51 CST

Command run from repository root:

```bash
npm run dev
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Dev server startup | Passed | Next dev server started at `http://localhost:3000` |
| Dev workspace-root warning | Resolved | Startup output did not warn about selecting `/Users/runchuwu` as workspace root |
| Turbopack project directory | Passed | Startup output showed project dir as `/Users/runchuwu/Desktop/humanai-trust-engine` |
| `HEAD /task` | Passed | Returned `200 OK` |
| `HEAD /task?debug=1` | Passed | Returned `200 OK` |
| `HEAD /api/runs` | Passed | Returned `200 OK` |
| `HEAD /api/export?format=json` | Passed | Returned `200 OK` |
| `HEAD /api/events/preview?limit=5` | Passed | Returned `200 OK` |

## Turbopack Root Config Verification - 2026-07-11 13:49 CST

Change verified:

- `next.config.ts` now sets `turbopack.root` to the project working directory.

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Results:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Passed | ESLint completed with exit code 0 |
| `npx tsc --noEmit` | Passed | TypeScript completed with exit code 0 |
| `npm run build` | Passed after sandbox escalation | Initial sandbox run still failed because Turbopack could not bind an internal local port; rerun outside the sandbox succeeded |

Workspace-root warning status:

- Resolved for `npm run build` after setting `turbopack.root`.
- The build output no longer warns that Next.js selected `/Users/runchuwu` as the workspace root.

## Runtime Smoke Check - 2026-07-11 13:45 CST

Command run from repository root:

```bash
npm run dev
```

Result:

| Check | Result | Notes |
| --- | --- | --- |
| Dev server startup | Passed | Next dev server started at `http://localhost:3000` |
| `HEAD /task` | Passed | Returned `200 OK` |
| `HEAD /task?debug=1` | Passed | Returned `200 OK`; first unquoted shell attempt failed because `?` was interpreted by zsh |
| `HEAD /api/runs` | Passed | Returned `200 OK` |
| `HEAD /api/export?format=json` | Passed | Returned `200 OK` |
| `HEAD /api/events/preview?limit=5` | Passed | Returned `200 OK` |
| `GET /api/runs` | Passed after sandbox escalation | Sandbox blocked localhost body request; rerun outside sandbox returned current run summary JSON |
| `GET /api/export?format=json` | Passed after sandbox escalation | Sandbox blocked localhost body request; rerun outside sandbox returned JSON event array |
| `GET /api/events/preview?limit=5` | Passed after sandbox escalation | Sandbox blocked localhost body request; rerun outside sandbox returned preview JSON |

Runtime warning observed during this check:

- Next.js inferred a workspace root at `/Users/runchuwu` because `/Users/runchuwu/pnpm-lock.yaml` exists above the repository.
- This warning did not prevent the dev server, task route, debug route, or API endpoints from responding.
- Later resolved for build by setting `turbopack.root` in `next.config.ts`.

## Verification Refresh - 2026-07-11 13:40 CST

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Results:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Passed | ESLint completed with exit code 0 |
| `npx tsc --noEmit` | Passed | TypeScript completed with exit code 0 |
| `npm run build` | Passed after sandbox escalation | Initial sandbox run failed because Turbopack could not bind an internal local port; rerun outside the sandbox succeeded |

Build warning observed during this check:

- Next.js inferred a workspace root at `/Users/runchuwu` because `/Users/runchuwu/pnpm-lock.yaml` exists above the repository.
- The project also has `/Users/runchuwu/Desktop/humanai-trust-engine/package-lock.json`.
- This warning did not fail the build.
- Later resolved by setting `turbopack.root` in `next.config.ts`.

## Current Verification Pass

Commands run from repository root:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Results:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Passed | ESLint completed with exit code 0 |
| `npx tsc --noEmit` | Passed | TypeScript completed with exit code 0 |
| `npm run build` | Passed after sandbox escalation | Initial sandbox run failed because Turbopack could not bind an internal local port; rerun outside the sandbox succeeded |

Historical build warning:

- Next.js inferred a workspace root at `/Users/runchuwu` because another lockfile exists at `/Users/runchuwu/pnpm-lock.yaml`.
- The project also has `/Users/runchuwu/Desktop/humanai-trust-engine/package-lock.json`.
- This did not fail the build and was later resolved by setting `turbopack.root` in `next.config.ts`.
