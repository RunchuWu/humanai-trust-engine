# Final Submission Checklist

This checklist packages the Week 12 deliverables from `docs/week-7-12-plan.md`. It separates current evidence from final updates that must happen after research confirmation or any runtime implementation changes.

## Submission Scope

The final submission should make these points clear:

- The project supports a controlled fixed-stimulus AI operations decision task.
- Current exports support trust-calibration analysis.
- HSF alignment is documented as the next research-aligned direction.
- Runtime HSF metadata and manipulation-check implementation are pending confirmed research decisions.
- OpenAI API use is scoped as researcher-facing/offline unless the study format changes.

## Required Deliverables

| Deliverable | Current evidence | Final action |
| --- | --- | --- |
| Final repo state | Current app, docs, final verification refresh, and runtime smoke refresh | Re-run verification after any further edits |
| Final report | `docs/final-report-draft.md` has current-state implementation status, verification results, demo path, limitations, and future work | Refresh after confirmed HSF runtime changes or before formal submission |
| Demo walkthrough | `docs/demo-walkthrough.md` | Current-state script ready; refresh after runtime HSF changes |
| Verification record | `docs/verification-log.md` includes latest final verification and runtime smoke refresh | Refresh after any further verification run |
| HSF documentation map | `docs/hsf-docs-index.md`; `npm run check:docs` passes | Refresh if new docs are added |
| Requirement traceability | `docs/week-7-12-traceability-matrix.md` maps current evidence and deferred HSF runtime work | Refresh after research decisions or runtime changes |
| Research decisions | `docs/research-decision-tracker.md` records open and recommended decisions | Update with Andrea/research-team responses if received |
| Export reproducibility | `docs/export-qa-checklist.md`, `scripts/validate-export.mjs`, and latest validation results | Run a fresh pilot dry run if participant-mode pilot data is required |
| Export analysis workflow | `docs/export-analysis-workflow.md` reflects current validation, filter assertion, row-count, and summary commands | Refresh after runtime export fields change |
| Internal pilot notes | `docs/internal-pilot-notes.md` template exists; filled pilot notes are not yet present | Fill after an internal pilot, or keep marked as not yet run |

## Current Submission Status

Current-state package status:

- Report, demo, traceability, verification, export QA, and HSF planning docs are current-state ready.
- Lint, TypeScript, documentation reference check, export validation, export summary, production build, and runtime smoke checks have current passing evidence. `npm run smoke:runtime` is available for scriptable reruns when Node can access localhost.
- Explicit HSF runtime metadata, manipulation-check UI/logging, approved expanded stimuli, and filled internal pilot notes remain future work because they depend on research-team decisions or an actual pilot run.
- The package should not be described as final HSF runtime implementation until those research decisions are confirmed and implemented.

## Final Report Checklist

Before final submission, ensure `docs/final-report-draft.md` includes:

- Project summary.
- Completed milestones.
- HSF alignment summary.
- Experiment format decision.
- Cue and dataset design status.
- Logging and export support.
- Analysis plan reference.
- Export QA reference.
- OpenAI API scope.
- Verification command results.
- Known limitations.
- Future work.
- Traceability summary from `docs/week-7-12-traceability-matrix.md`.

Current report sections already have current-state content, but should be
refreshed if runtime HSF work or research decisions change:

- Final implementation summary.
- Final verification command results.
- Final demo URL or local run instructions.
- Known limitations after the last implementation state.
- Future work after Andrea/research-team decisions.

## Demo Checklist

Before recording or presenting, confirm:

- `/task` loads in participant mode.
- `/task?debug=1` loads in researcher mode.
- Debug mode can force `control`, `industry_set`, and `user_set`.
- The staged trial reveal works.
- `Follow AI` and `Choose Opposite` both log decisions.
- JSON and CSV exports open.
- The demo mentions that current HSF metadata is documented but not runtime-exported yet.
- The demo mentions that manipulation-check UI/logging is a planned implementation path, not current runtime behavior.

Use `docs/demo-walkthrough.md` as the current-state script.

## Verification Checklist

Run from the repository root before final submission:

```bash
npm run verify:final
npm run dev
npm run smoke:runtime
```

Then update `docs/verification-log.md` with:

- command
- result
- timestamp or date
- relevant warning
- whether the command ran inside the sandbox or required escalation

Current known verification note:

- `npm run verify:final` runs lint, TypeScript, documentation reference checks, export validation, export summary, and build.
- `npm run smoke:runtime` should be run while the dev server is active; it verifies the current runtime pages and export APIs.
- `npm run build` passed after sandbox escalation because Turbopack could not bind an internal local port in the sandbox.
- The previous non-fatal workspace-root warning was resolved by setting `turbopack.root` in `next.config.ts`.
- `npm run check:docs` verifies local documentation links and backticked file references in `docs/`.
- `npm run validate:export` can validate JSON exports, CSV exports, or JSONL event logs for current event-schema, trust-calibration consistency, filter expectations, and exact event/decision row counts.
- `npm run summarize:export` can summarize current trust-calibration metrics from JSON exports, CSV exports, or JSONL event logs.

## Export QA Checklist

Before claiming export readiness, run or explicitly defer:

- minimum export smoke test
- condition coverage test
- full-session test
- automated JSON/CSV/JSONL export validation
- trust-calibration summary output
- automated filter assertions with `--expect-event-type`, `--expect-condition-id`, `--expect-cue-source`, and `--expect-trial-id`
- automated row-count assertions with `--expect-event-count` and `--expect-decision-count` when counts are known
- CSV header check
- filter QA
- data-quality checks

Use `docs/export-qa-checklist.md` for the exact steps.

## HSF Readiness Checklist

Before claiming final HSF pilot readiness, confirm:

- participant-facing format is approved
- priority HSF dimensions are approved
- condition structure is approved
- final stimulus matrix or reduced factor set is approved
- candidate trial additions are approved or rejected
- manipulation-check wording and placement are approved
- runtime exports include approved HSF metadata
- debug mode displays approved HSF metadata
- manipulation-check events export if checks are implemented

Current status: these items are not fully complete because the final research decisions are still open.

## Final Known-Limitations Language

Use language like this if no further research confirmation arrives before final submission:

```text
The current implementation supports a controlled fixed-stimulus decision task with cue-source conditions and trust-calibration logging. HSF cue dimensions, final HSF condition structure, explicit HSF export metadata, and manipulation-check runtime logging are documented as the next implementation path and should be completed after research-team confirmation.
```

## Final Submission Gate

Do not mark the Week 7-12 goal complete unless:

1. The final report has current-state final status, or has been refreshed after confirmed runtime changes.
2. The demo walkthrough reflects the exact current repo state.
3. Verification results are current.
4. Any completed runtime changes are documented in event schema, how-to-run, and walkthrough docs.
5. Any unimplemented HSF/pilot items are clearly labeled as open research decisions or future work.
6. `docs/week-7-12-traceability-matrix.md` shows no required item with missing or contradictory evidence unless it is explicitly deferred by open research decisions or out of current-state scope.
