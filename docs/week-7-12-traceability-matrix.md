# Week 7-12 Traceability Matrix

This matrix maps the plan in `docs/week-7-12-plan.md` to current repository
evidence. It is meant to make final-readiness review concrete and to prevent
draft, deferred, and implemented work from being mixed together.

Status labels:

- Complete: current repository evidence satisfies the item for the present
  controlled fixed-stimulus path.
- Draft complete: the planned artifact exists as a review draft, but research
  approval or final runtime integration is still pending.
- Deferred: intentionally not implemented until Andrea or the research team
  confirms the research design.
- Partial: some evidence exists, but the item is not fully satisfied.
- Not done: no current repository evidence proves completion.

## Week 7: Research Alignment and Cue Mapping

| Plan item | Current evidence | Status | Remaining action |
| --- | --- | --- | --- |
| Review HSF manuscript, experimental-design note, and recentered method draft | `docs/week-7-12-progress.md` records that these standalone source materials are not present locally | Partial | Review those source documents if they are provided |
| Map current cue modules to HSF dimensions | `docs/hsf-cue-interface-note.md`, `docs/hsf-cue-definitions.md` | Draft complete | Replace or revise definitions after research-team review |
| Identify existing cues and missing UI/trial-data fields | `docs/hsf-cue-interface-note.md`, `docs/condition-logic.md`, `docs/stimulus-schema.md` | Complete for current-state audit | Recheck after any runtime HSF implementation |
| Send Andrea alignment questions | `docs/andrea-alignment-email.md` | Draft complete | Send only after user approval and recipient details are available |
| Draft short cue-to-interface note | `docs/hsf-cue-interface-note.md` | Complete as review note | Update after Andrea feedback |

Deliverables and acceptance criteria:

| Requirement | Evidence | Status |
| --- | --- | --- |
| `docs/week-7-12-plan.md` exists | `docs/week-7-12-plan.md` | Complete |
| Draft cue mapping table exists | `docs/hsf-cue-interface-note.md` | Complete as draft |
| Alignment email exists | `docs/andrea-alignment-email.md` | Draft complete, not sent |
| Plan distinguishes fixed stimuli from interactive AI collaboration | `docs/week-7-12-plan.md`, `docs/participant-format-options.md`, `docs/openai-api-scope.md` | Complete |
| OpenAI API scope is framed as research-design decision | `docs/openai-api-scope.md`, `docs/week-7-12-plan.md` | Complete |

## Week 8: Dataset and Stimulus Design

| Plan item | Current evidence | Status | Remaining action |
| --- | --- | --- | --- |
| Confirm target participant-facing format after Andrea feedback | `docs/research-decision-tracker.md`, `docs/participant-format-options.md` | Deferred | Update tracker after Andrea/research-team response |
| Draft HSF-aligned stimulus data model | `docs/hsf-stimulus-design.md`, `docs/stimulus-schema.md` | Draft complete | Convert to runtime fields after approved matrix scope |
| Specify required trial fields | `docs/stimulus-schema.md`, `docs/hsf-stimulus-design.md`, `docs/stimulus-approval-worksheet.md` | Draft complete | Add approved HSF fields to runtime only after confirmation |
| Create initial stimulus matrix | `docs/hsf-stimulus-design.md`, `docs/hsf-stimulus-matrix-template.md` | Draft complete | Select final matrix scope and populate approved cells |
| Define stimulus approval checklist | `docs/stimulus-approval-worksheet.md`, `docs/hsf-stimulus-design.md` | Complete as template | Use during actual stimulus approval |

Deliverables and acceptance criteria:

| Requirement | Evidence | Status |
| --- | --- | --- |
| Dataset/stimulus design note | `docs/hsf-stimulus-design.md` | Draft complete |
| Initial HSF stimulus matrix | `docs/hsf-stimulus-design.md`, `docs/hsf-stimulus-matrix-template.md` | Draft complete |
| Stimulus approval checklist | `docs/stimulus-approval-worksheet.md` | Complete as template |
| Team can review mapping to cue dimensions and performance conditions | `docs/hsf-stimulus-design.md`, `docs/current-condition-stimulus-matrix.md`, `docs/hsf-current-trial-readiness.md` | Partial; current mapping is reviewable but not final approved HSF matrix |
| Stimulus process supports manual or AI-assisted drafts | `docs/openai-api-scope.md`, `docs/candidate-trial-expansion-bank.md` | Complete as process design |
| Plan avoids live-generation variability during participant sessions | `docs/week-7-12-plan.md`, `docs/openai-api-scope.md` | Complete |

## Week 9: Implementation of Confirmed Cue Structure

Week 9 runtime implementation is intentionally gated. The repository currently
documents the implementation path but does not claim final HSF runtime metadata.

| Plan item | Current evidence | Status | Remaining action |
| --- | --- | --- | --- |
| Update cue configuration to confirmed HSF dimensions | `docs/hsf-implementation-handoff.md`, `docs/hsf-implementation-backlog.md` | Deferred | Implement after approved HSF dimensions and condition structure |
| Update trial data types with cue condition and performance metadata | `docs/stimulus-schema.md`, `docs/hsf-implementation-handoff.md` | Deferred | Add runtime fields after approval |
| Update participant-facing UI copy for intended cue condition | `docs/current-condition-stimulus-matrix.md`, `docs/ui-salience-reading-load-audit.md` | Partial current-state evidence | Update UI only after approved condition labels/cues |
| Update decision logging with confirmed cue metadata | `docs/event-schema.md`, `docs/hsf-implementation-handoff.md`, `scripts/validate-export.mjs` | Deferred for HSF fields; complete for current trust fields | Add approved HSF fields to schema, payloads, exports, and validator |
| Keep debug mode able to inspect assignment, cue source, modules, and trial metadata | `docs/researcher-walkthrough.md`, `docs/condition-logic.md`, `src/lib/hsf-debug.ts` | Complete for current cue-source metadata and a non-exported draft HSF preview; approved HSF metadata deferred | Replace draft preview after approved runtime metadata exists |

Deliverables and acceptance criteria:

| Requirement | Evidence | Status |
| --- | --- | --- |
| HSF-aligned cue configuration | `docs/hsf-implementation-handoff.md` | Deferred; not runtime implemented |
| Updated trial schema | `docs/stimulus-schema.md` | Draft complete; runtime schema not updated |
| Updated export fields and documentation | `docs/event-schema.md`, `docs/export-qa-checklist.md` | Complete for current fields; deferred for HSF fields |
| Participant-facing cue displays match approved cue mapping | No approved mapping in repository | Deferred |
| Decision events preserve trust-calibration fields and add HSF metadata | `docs/event-schema.md`, `scripts/validate-export.mjs` proves current trust fields; HSF metadata absent by design | Partial |
| Debug mode can inspect active cue dimensions without changing participant mode | Current debug can inspect cue modules; HSF dimensions absent | Partial |

## Week 10: Pilot Readiness

| Plan item | Current evidence | Status | Remaining action |
| --- | --- | --- | --- |
| Expand and balance operations/drone trials | `docs/candidate-trial-expansion-bank.md` | Draft complete | Approve and add candidates to runtime only after stimulus review |
| Ensure AI-correct and AI-incorrect recommendations | `docs/hsf-current-trial-readiness.md`, `docs/current-condition-stimulus-matrix.md` | Complete for current 10 trials | Recheck if trial set changes |
| Add or prepare manipulation-check items | `docs/hsf-manipulation-checks.md`, `docs/manipulation-check-implementation-spec.md` | Draft complete | Approve wording/placement before runtime UI/logging |
| Check visual salience and reading burden | `docs/ui-salience-reading-load-audit.md` | Complete current-state audit | Recheck after runtime HSF cue changes |
| Run through full participant flow in participant and debug modes | `docs/researcher-walkthrough.md`, `docs/verification-log.md`, `docs/internal-pilot-notes.md` | Partial | Full internal pilot still needs to be run and recorded |

Deliverables and acceptance criteria:

| Requirement | Evidence | Status |
| --- | --- | --- |
| Pilot-ready controlled stimulus set | `docs/hsf-current-trial-readiness.md`, `docs/candidate-trial-expansion-bank.md` | Partial; current 10-trial set is pilot base, not final HSF set |
| Manipulation-check draft | `docs/hsf-manipulation-checks.md` | Draft complete |
| Internal pilot notes | `docs/internal-pilot-notes.md` | Template complete; filled pilot notes not done |
| Role, recommendation format, and decision actions understandable | `docs/researcher-walkthrough.md`, `docs/internal-pilot-notes.md` | Partial until pilot notes are filled |
| Cue manipulations visible but not confounded with button salience/UI weight | `docs/ui-salience-reading-load-audit.md` | Partial current-state audit |
| Trial wording clear enough for small internal pilot | `docs/operations-trial-stimuli.md`, `docs/hsf-current-trial-readiness.md` | Partial until actual pilot review |

## Week 11: Pilot Revision and Documentation

| Plan item | Current evidence | Status | Remaining action |
| --- | --- | --- | --- |
| Revise cue wording, trial copy, and UI based on pilot feedback | No filled pilot notes yet | Not done | Run pilot and record feedback first |
| Confirm exports contain fields needed for condition-level analysis | `docs/event-schema.md`, `docs/export-qa-checklist.md`, `scripts/validate-export.mjs`, `docs/analysis-plan.md` | Complete for current fields; deferred for HSF fields | Revalidate after HSF runtime metadata is added |
| Update how-to-run, condition logic, event schema, stimulus schema, cue definitions | `docs/how-to-run.md`, `docs/condition-logic.md`, `docs/event-schema.md`, `docs/stimulus-schema.md`, `docs/hsf-cue-definitions.md` | Complete current-state docs | Update again after runtime changes |
| Prepare researcher-facing walkthrough | `docs/researcher-walkthrough.md` | Complete current-state walkthrough | Update after final HSF implementation |

Deliverables and acceptance criteria:

| Requirement | Evidence | Status |
| --- | --- | --- |
| Revised pilot build | Current build plus docs, no pilot-feedback revisions | Partial |
| Updated docs | `docs/hsf-docs-index.md` and linked current-state docs | Complete current-state docs |
| Researcher walkthrough notes | `docs/researcher-walkthrough.md` | Complete |
| Researcher can run task locally, force conditions, complete session, and export data | `docs/researcher-walkthrough.md`, `docs/verification-log.md`, `scripts/validate-export.mjs` | Partial; automated/runtime smoke evidence exists, full manual pilot still pending |
| Documentation explains how HSF cue dimensions are represented | `docs/hsf-cue-interface-note.md`, `docs/hsf-cue-definitions.md`, `docs/current-condition-stimulus-matrix.md` | Complete as draft/current-state explanation |

## Week 12: Final Report and Demo

| Plan item | Current evidence | Status | Remaining action |
| --- | --- | --- | --- |
| Finalize implementation and remove stale wording | `docs/final-submission-checklist.md`, `docs/week-7-12-readiness-audit.md`, `docs/final-report-draft.md`, `docs/demo-walkthrough.md` | Current-state final packaging complete; HSF runtime deferred | Refresh after confirmed HSF runtime implementation |
| Run verification | `docs/verification-log.md`, `scripts/check-doc-references.mjs`, `npm run verify:final` | Complete for current state | Re-run after any further runtime or documentation changes |
| Prepare final report | `docs/final-report-draft.md` | Current-state final draft complete | Refresh after confirmed HSF runtime implementation or before formal submission |
| Prepare final demo walkthrough | `docs/demo-walkthrough.md` | Current-state demo script complete | Refresh after confirmed HSF runtime implementation or before formal recording |

Deliverables and acceptance criteria:

| Requirement | Evidence | Status |
| --- | --- | --- |
| Final repo state | Current repository plus `npm run verify:final`, runtime smoke logs, and `npm run smoke:runtime` script for repeatable reruns | Current-state verified; final HSF runtime deferred |
| Final report | `docs/final-report-draft.md` | Current-state final draft complete |
| Demo walkthrough | `docs/demo-walkthrough.md` | Current-state demo script complete |
| Project clearly supports controlled HSF cue-manipulation experiment | Current app supports cue-source experiment; HSF mapping docs exist | Partial until approved HSF metadata is runtime implemented or final scope is explicitly current-state |
| Remaining open questions documented as future research decisions | `docs/research-decision-tracker.md`, `docs/week-7-12-readiness-audit.md`, `docs/final-submission-checklist.md` | Complete |
| OpenAI API path scoped without compromising fixed stimuli | `docs/openai-api-scope.md` | Complete |

## Current Completion Summary

The repository is strong on planning, current-state documentation, review
packets, export validation, and final-package scaffolding. It is intentionally
not complete as a final HSF runtime implementation because the following
research decisions remain open:

1. Participant-facing format.
2. Priority HSF dimensions.
3. Final condition structure.
4. Confidence role.
5. Manipulation-check wording and placement.
6. Stimulus approval process.

Until those decisions are resolved, the appropriate next engineering state is
to keep current cue-source behavior stable, preserve trust-calibration exports,
and avoid adding final HSF runtime fields that could encode the wrong research
design.
