# Week 7-12 Readiness Audit

This audit checks the current repository state against `docs/week-7-12-plan.md`. It separates completed evidence from draft work and remaining decisions.

For the requirement-by-requirement evidence map, see
`docs/week-7-12-traceability-matrix.md`.

## Summary

Current status: the controlled fixed-stimulus GSoC work product, public report,
documentation, deterministic QA, and final internal walkthrough are complete.
Runtime HSF schema/debug/export implementation is intentionally deferred until
Andrya or the research team confirms the participant-facing format and priority
HSF dimensions.

The current GSoC implementation scope is complete and packaged. A future HSF
runtime and real-participant pilot remain dependent on research decisions that
are still open.

## Week-by-Week Status

| Week | Plan goal | Current status | Evidence | Remaining work |
| --- | --- | --- | --- | --- |
| Week 7 | Research alignment and cue mapping | Mostly complete as draft research-alignment work | `docs/week-7-12-plan.md`, `docs/hsf-cue-interface-note.md`, `docs/andrea-alignment-email.md` | Send/confirm Andrya questions; review missing HSF manuscript/design/method materials if provided |
| Week 8 | Dataset and stimulus design | Structured review bank and draft design complete, pending research confirmation | `data/stimuli/operations-stimulus-bank.json`, `docs/stimulus-dataset-workflow.md`, `docs/hsf-stimulus-design.md`, `docs/hsf-current-trial-readiness.md`, `docs/hsf-manipulation-checks.md` | Select final matrix scope; approve stimuli; decide manipulation-check placement |
| Week 9 | Implement confirmed cue structure | Pre-implementation handoff complete; runtime not changed | `docs/hsf-implementation-handoff.md` | Add confirmed HSF metadata to cue config, trials, schema, event payloads, exports, and debug panel |
| Week 10 | Pilot readiness | Partially prepared through audits, candidate expansion bank, manipulation-check draft, and manipulation-check implementation spec | `docs/hsf-current-trial-readiness.md`, `docs/candidate-trial-expansion-bank.md`, `docs/hsf-manipulation-checks.md`, `docs/manipulation-check-implementation-spec.md`, `docs/ui-salience-reading-load-audit.md`, `docs/current-condition-stimulus-matrix.md`, `docs/researcher-walkthrough.md` | Approve final stimulus set and manipulation-check placement if required; run full participant and debug pilot after implementation |
| Week 11 | Pilot revision and documentation | Current-state docs prepared | `docs/how-to-run.md`, `docs/event-schema.md`, `docs/stimulus-schema.md`, `docs/current-condition-stimulus-matrix.md`, `docs/operations-trial-stimuli.md`, `docs/researcher-walkthrough.md`, `docs/export-qa-checklist.md`, `docs/hsf-docs-index.md` | Revise docs after pilot feedback and confirmed runtime implementation |
| Week 12 | Final report and demo | Current-state packaging complete; current verification and runtime smoke checks passed | `docs/final-work-product.md`, `docs/demo-walkthrough.md`, `docs/final-submission-checklist.md`, `docs/verification-log.md` | Refresh final report/demo after confirmed HSF runtime implementation; re-run final verification after any runtime changes |

## Acceptance Criteria Audit

### Already Supported

- The project has a documented Week 7-12 plan.
- The plan distinguishes controlled fixed stimuli from interactive AI collaboration.
- OpenAI API scope is framed as a research-design decision, not an implementation default.
- Current trials are fixed and reviewable.
- Trust-calibration event fields exist: `ai_reco`, `ground_truth`, `follow_ai`, and `ai_correct`.
- Debug mode can inspect current assignment, cue source, cue modules, screen,
  trial index, exports, and a non-exported draft HSF mapping for the active
  cue modules and current trial.
- Researcher documentation now points to HSF planning and review documents.
- The Week 7-12 plan now has a requirement-by-requirement traceability matrix in `docs/week-7-12-traceability-matrix.md`.
- Current verification passed:
  - `npm run verify:final` after sandbox escalation for build
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run check:docs`
  - `npm run build` after sandbox escalation
- `npm run smoke:runtime` can verify runtime smoke checks for `/`, `/task`, `/task?debug=1`, `/api/runs`, `/api/export?format=json`, `/api/export?format=csv`, and `/api/events/preview?limit=5` in an environment where Node can access localhost.
- Runtime API export validation passed for full JSON/CSV exports and filtered control decision JSON/CSV exports.
- Export filter and row-count assertions passed for filtered control decision JSON/CSV exports and the `ops_01` trial filter.
- The previous Next/Turbopack workspace-root warning is resolved by the explicit `turbopack.root` setting in `next.config.ts`.
- The current condition-by-stimulus presentation matrix is documented in `docs/current-condition-stimulus-matrix.md`.
- `npm run validate:export` can validate current JSON exports, CSV exports, or JSONL logs for schema shape, CSV header order, trust-calibration derived fields, timestamp ordering, duplicate event IDs, full-session coverage, filter expectations, and exact event/decision row counts.
- `npm run summarize:export` can summarize current trust-calibration metrics by condition and AI correctness from JSON exports, CSV exports, or JSONL logs.
- `npm run check:docs` can verify local documentation references across the Week 7-12 markdown docs.
- `npm run validate:stimuli` verifies the 16-record review bank, its planned
  balance, rationale reading-load warnings, and synchronization with the 10
  current runtime trials.

### Partially Supported

- HSF cue mapping exists as a draft, but research-team definitions may override it.
- Stimulus matrix exists as a draft, but final condition scope is not approved.
- Manipulation-check items exist as a draft, but wording and placement are not approved.
- Manipulation-check implementation shape is documented, but runtime UI/logging/export are not implemented.
- Current 10 trials support a small fixed pilot base, but they are not final HSF stimuli.
- A structured 16-trial review bank combines 10 current and six candidate
  stimuli with automated validation, but all review statuses remain pending and
  candidates are not approved runtime stimuli.
- UI salience and reading-load have a current-state audit, but final HSF cue conditions still need approved balancing rules.
- Export QA is documented for current fields and filters, but future HSF metadata QA cannot be completed until runtime metadata exists.
- Automated export validation covers current JSON/CSV/JSONL events, filters, and known row counts, but participant-mode/debug-mode provenance still needs documented review before pilot use.
- Final report and demo walkthrough exist as current-state final packaging, but they should be refreshed after any confirmed HSF runtime implementation.
- Final submission checklist now reflects current-state packaging, while unimplemented HSF runtime and pilot items remain clearly scoped as research-dependent future work.

### Not Yet Supported

- Runtime events do not yet export explicit HSF fields such as `hsf_cue_condition_id`, `hsf_dimensions`, or `performance_condition`.
- Debug mode shows a non-exported draft HSF mapping and current-trial AI
  correctness, but it does not yet show approved HSF metadata or a confirmed
  performance-condition factor.
- Manipulation-check UI and logging are not implemented.
- The final HSF cue condition structure has not been implemented.
- A full internal pilot has not been run and documented in this repository.

## Current Blockers and Decisions

The next implementation step requires research confirmation:

1. Participant-facing format: controlled decision task, vignette/survey, or interactive AI collaboration.
2. Priority HSF dimensions for the immediate experiment.
3. Condition structure: full factorial, reduced factorial, bundled high/low humanlike, or current cue-source conditions with metadata.
4. Whether confidence is a cue module, a trial-level signal factor, or both.
5. Manipulation-check wording and placement.
6. Stimulus approval owner and process.

## Recommended Next Action

Send or review `docs/andrea-alignment-email.md` with Andrya and update `docs/research-decision-tracker.md` with the responses. After the research decisions are confirmed, proceed with `docs/hsf-implementation-handoff.md` for runtime schema/debug/export updates.
