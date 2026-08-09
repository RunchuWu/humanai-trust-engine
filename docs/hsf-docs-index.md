# HSF Documentation Index

This index collects the Week 7-12 HSF planning, stimulus, implementation, and verification documents.

## Current Status

The repository currently supports a controlled decision-based transportation/drone operations task with fixed stimuli and modular cue-source conditions. Researcher debug mode includes a read-only draft preview that maps active cue modules to HSF dimensions, but HSF dimensions are not yet implemented as explicit runtime metadata in events or exports.

Do not treat the HSF metadata fields listed in planning docs as current exported fields until the Week 9 implementation is completed after research-team confirmation.

## Core Planning Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/week-7-12-plan.md` | Overall midterm-to-final plan | Active plan |
| `docs/week-7-12-progress.md` | Running record of completed tasks | Active log |
| `docs/week-7-12-traceability-matrix.md` | Requirement-by-requirement evidence matrix for the Week 7-12 plan | Current-state audit |
| `docs/andrea-alignment-email.md` | Draft email for confirming research direction | Draft, not sent |
| `docs/research-team-review-packet.md` | One-page packet for Andrya/research-team review before implementation | Ready for review |
| `docs/research-decision-tracker.md` | Tracks research decisions required before Week 9 implementation | Open tracker |
| `docs/participant-format-options.md` | Compares controlled task, survey/vignette, and interactive collaboration paths | Decision support for RD-01 |
| `docs/openai-api-scope.md` | Defines why API use is deferred or researcher-facing for the fixed-stimulus path | Current scope note |

## HSF Cue and Stimulus Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/hsf-cue-definitions.md` | Working HSF cue definitions and level rules | Draft pending research-team review |
| `docs/hsf-cue-interface-note.md` | Maps current cue modules to HSF dimensions | Draft pending research-team review |
| `docs/stimulus-schema.md` | Current runtime trial schema and proposed HSF schema extension | Current-state schema reference |
| `docs/current-condition-stimulus-matrix.md` | Current condition-by-stimulus presentation matrix | Current-state review matrix |
| `docs/hsf-stimulus-design.md` | Draft HSF trial data model, matrix, and approval checklist | Draft pending format confirmation |
| `docs/hsf-stimulus-matrix-template.md` | Fillable matrix for assigning candidate trials to HSF cells | Template pending approved matrix scope |
| `docs/candidate-trial-expansion-bank.md` | Candidate six-trial expansion bank for balancing a 16-trial set | Draft candidates pending review |
| `docs/stimulus-dataset-workflow.md` | Canonical review-bank schema, validation rules, and approval workflow | Current structured dataset workflow |
| `docs/stimulus-approval-worksheet.md` | Per-stimulus approval worksheet | Template pending review process |
| `docs/hsf-current-trial-readiness.md` | Audits current 10 operations trials for HSF readiness | Current-state audit |
| `docs/hsf-manipulation-checks.md` | Draft manipulation-check item bank | Draft pending item review |
| `docs/manipulation-check-implementation-spec.md` | Future manipulation-check UI, event, CSV, validation, and debug contract | Draft pending placement and item approval |

## Implementation and Review Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/hsf-implementation-handoff.md` | Pre-implementation handoff for schema, debug, and export updates | Ready for post-confirmation implementation |
| `docs/hsf-implementation-backlog.md` | Per-file implementation backlog for confirmed HSF runtime work | Ready after research decisions |
| `docs/analysis-plan.md` | Draft plan for trust calibration, HSF, manipulation-check, and blame analyses | Draft pending final metadata |
| `docs/ui-salience-reading-load-audit.md` | Audits current cue UI salience and rationale reading-load differences | Current-state audit |
| `docs/researcher-walkthrough.md` | Local review workflow for participant flow and exports | Current-state walkthrough |
| `docs/export-qa-checklist.md` | Export smoke, condition coverage, full-session, filter, row-count, and data-quality QA checklist | Current-state QA checklist |
| `docs/export-analysis-workflow.md` | Ordered workflow for export validation, filter assertions, and trust-calibration summaries | Current-state workflow |
| `docs/internal-pilot-notes.md` | Template for internal pilot observations and issue tracking | Ready as a template |
| `docs/verification-log.md` | Records verification commands and results | Current verification log |

## Final Packaging Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/final-work-product.md` | Public GSoC work-product report and evidence index | Final artifact prepared; refresh verification before submission |
| `docs/demo-walkthrough.md` | Draft demo script | Draft pending final implementation |
| `docs/final-submission-checklist.md` | Week 12 final packaging, verification, demo, and known-limitations checklist | Ready for final submission review |

## Current Implementation References

| Document | Purpose |
| --- | --- |
| `docs/how-to-run.md` | Local run instructions and debug-mode guide |
| `docs/condition-logic.md` | Current condition assignment, persistence, forcing, and HSF relationship |
| `docs/event-schema.md` | Current event schema and export reference |
| `docs/stimulus-schema.md` | Current runtime stimulus schema and future HSF extension reference |
| `docs/current-condition-stimulus-matrix.md` | Current condition presentation differences across the fixed trial set |
| `docs/operations-trial-stimuli.md` | Current hardcoded operations stimulus catalog |

## Next Research Decision

The next blocking research decision is whether the participant-facing study remains a controlled fixed-stimulus decision task, and which HSF dimensions should become active experimental factors. After that decision, use `docs/hsf-implementation-handoff.md` to update runtime metadata, debug displays, and exports.
