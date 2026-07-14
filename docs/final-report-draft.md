# Final GSoC Report Draft

This is a current-state final-report draft for the HumanAI Trust Calibration Engine. It reflects the repository state while Andrea/research-team HSF decisions are still pending.

Use `docs/final-submission-checklist.md` before converting this draft into a final submission artifact or recording a final demo.
Use `docs/week-7-12-traceability-matrix.md` to verify that final status claims
match current repository evidence.

## Project Summary

The project builds a web-based experimentation platform for studying trust calibration in AI-assisted transportation and drone operations decisions. Participants review staged operational scenarios, see an AI recommendation, and decide whether to follow or override it.

The current midterm-to-final direction is to align the platform with HSF cue dimensions while preserving controlled, fixed, reviewable stimuli unless the research team confirms a shift toward interactive AI collaboration.

## Completed Milestones

### Weeks 1-2: Experiment Shell

Completed:

- Participant flow with welcome, consent, instructions, comprehension check, practice, main task, and debrief.
- Stable participant, condition, and session assignment.
- Staged trial reveal.
- Researcher debug mode.
- Event logging and export foundation.

### Weeks 3-5: Operations Domain and Modular Cues

Completed:

- Migration from job-screening scenarios to transportation and drone operations.
- Main task trial fields for situation, evidence, recommendation, rationale, confidence, ground truth, and AI correctness.
- Cue-source conditions: `control`, `industry_set`, and `user_set`.
- Modular cue rendering for name, warmth/tone, avatar, personality, and confidence/explanation.
- User-set agent configuration.
- Exported decision metadata for trust-calibration and cue context.

### Weeks 7-12: HSF Alignment Preparation

Completed so far:

- Week 7-12 implementation plan.
- HSF cue-to-interface mapping draft.
- Andrea alignment email draft.
- Research-team review packet and decision tracker.
- Participant-facing format options note.
- HSF stimulus design draft.
- Current trial HSF readiness audit.
- Candidate trial expansion bank for a possible balanced 16-trial set.
- UI salience and reading-load audit.
- Manipulation-check item bank draft.
- Manipulation-check implementation spec.
- HSF implementation handoff for future schema/debug/export work.
- HSF implementation backlog.
- Researcher walkthrough for participant flow and export review.
- Export QA checklist.
- Analysis plan draft.
- Demo walkthrough draft.
- Final submission checklist.
- Verification refresh.
- Requirement traceability matrix.

Pending research confirmation:

- Final participant-facing format.
- Priority HSF cue dimensions.
- Approved cue condition structure.
- Whether manipulation checks are trial-level, selected-trial, or end-of-task.
- Whether OpenAI API scope remains researcher-facing/offline or becomes participant-facing.

## HSF Alignment

Current HSF mapping draft:

| HSF dimension | Current or proposed implementation |
| --- | --- |
| Appearance | Avatar badge and visible agent identity |
| Communication | Neutral vs warm rationale, first-person wording, confidence language, explanation style |
| Behavior | AI recommendation correctness, performance outcome, rationale quality |
| Relationality | Warm/supportive language and user-selected assistant framing |
| Agency | Named agent framing, recommendation lead, autonomy/action wording |

Current state:

- Existing cue modules can be mapped to HSF dimensions.
- HSF dimensions are not yet explicit runtime metadata.
- Final cue definitions should come from the research team before code changes.

## Experiment Format Decision

Recommended current path:

- Continue with a controlled decision-based experiment.
- Use fixed participant-facing stimuli.
- Keep AI recommendations static during participant sessions.
- Use OpenAI API, if needed later, as a researcher-facing offline stimulus drafting tool.

Rationale:

- Fixed stimuli preserve reproducibility.
- Cue intensity and reading load remain reviewable.
- AI-correct and AI-incorrect conditions remain controlled.
- Trust, delegation, and blame outcomes can be compared across conditions.

## Cue and Dataset Design

Current trial set:

- 10 main operations trials.
- Four trial types: routing/dispatch, self-driving maneuver, target identification, and hazard evasion.
- Balanced ground truth: 5 `proceed`, 5 `reject`.
- Balanced AI recommendation direction: 5 `proceed`, 5 `reject`.
- AI correctness: 6 correct, 4 incorrect.

Current readiness:

- Usable as a fixed pilot base.
- Not yet final HSF stimuli.
- Needs confirmed HSF cue metadata, cleaner confidence-signal levels, and manipulation-check review.

Related docs:

- `docs/operations-trial-stimuli.md`
- `docs/hsf-current-trial-readiness.md`
- `docs/hsf-stimulus-design.md`
- `docs/candidate-trial-expansion-bank.md`
- `docs/ui-salience-reading-load-audit.md`
- `docs/hsf-manipulation-checks.md`
- `docs/stimulus-approval-worksheet.md`
- `docs/hsf-stimulus-matrix-template.md`

## Logging and Export Support

Current decision exports preserve:

- participant/session/condition identifiers
- trial identity and trial index
- decision and latency
- AI recommendation
- ground truth
- follow-AI flag
- AI correctness flag
- cue source and cue modules
- agent metadata when applicable

Recommended HSF export additions after confirmation:

- `hsf_cue_condition_id`
- `hsf_dimensions`
- `appearance_level`
- `communication_level`
- `relationality_level`
- `agency_level`
- `confidence_signal_level`
- `performance_condition`

Draft analysis plan: `docs/analysis-plan.md`.

Export QA checklist: `docs/export-qa-checklist.md`.
Export analysis workflow: `docs/export-analysis-workflow.md`.

Current JSON/CSV/JSONL export validator:

```bash
npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-decision-count 10
npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv'
```

Current export summary command:

```bash
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
```

Future manipulation-check implementation spec: `docs/manipulation-check-implementation-spec.md`.

## Future OpenAI API Path

Do not prioritize live participant-facing API generation unless the research question changes.

Detailed scope: `docs/openai-api-scope.md`.

Preferred API path if needed:

1. Researcher enters scenario constraints and target cue condition.
2. API drafts candidate stimulus text offline.
3. Researcher reviews and edits candidate output.
4. Approved text is saved as static trial configuration.
5. Participant-facing sessions use only approved fixed stimuli.

If the project later becomes an interactive AI collaboration study, API use should include structured prompts, low-temperature settings, output logging, and post-hoc checks.

## Verification Plan

Latest verification refresh:

| Command | Latest result | Notes |
| --- | --- | --- |
| `npm run verify:final` | Passed after sandbox escalation for build | Runs lint, TypeScript, docs reference check, export validation, export summary, and build |
| `npm run smoke:runtime` | Script added; live rerun blocked in current sandbox | Checks root redirect, participant/debug pages, run summary, JSON export, CSV export, and event preview when Node can access localhost |
| `npm run lint` | Passed | ESLint completed successfully |
| `tsc --noEmit` | Passed | TypeScript completed successfully as part of `npm run verify:final` |
| `npm run check:docs` | Passed | Documentation reference check scanned 39 markdown files and 692 local references |
| `npm run build` | Passed after sandbox escalation | Sandboxed build failed because Turbopack could not bind an internal local port; rerun outside the sandbox compiled successfully in 1909.7 ms |
| `npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-decision-count 10` | Passed | Validated current local JSONL event log, trust-calibration derived fields, exact decision count, and a complete 10-trial session |

The previous workspace-root warning is resolved by setting `turbopack.root` in `next.config.ts`; the latest successful build no longer warns that Next.js selected `/Users/runchuwu` as the root.

Detailed log: `docs/verification-log.md`.

Requirement traceability: `docs/week-7-12-traceability-matrix.md`.

Runtime smoke check passed in the latest `curl -I` refresh for `/`, `/task`, `/task?debug=1`, `/api/runs`, `/api/export?format=json`, `/api/export?format=csv`, and `/api/events/preview?limit=5`. `npm run smoke:runtime` now automates the same endpoint expectations, but live execution needs an environment where Node can access localhost.

Runtime API export validation also passed for:

- full JSON export
- full CSV export
- filtered control decision JSON export
- filtered control decision CSV export

The URL validator checks required sandbox escalation for Node fetch, while HEAD
requests to the same endpoints returned `200 OK` in the sandbox.
Filter assertion validation also passed for filtered control decision JSON/CSV
exports and the `ops_01` trial filter using validator `--expect-*` flags.
Row-count assertion validation also passed for current local full-session,
filtered control decision, and `ops_01` trial samples.
Documentation reference validation passed for all local documentation paths
under `docs/`.

The current local export summary reports 10 latest decisions in the `control`
condition, 50.0% follow-AI rate, 70.0% calibrated decision rate, 10.0%
overtrust, 20.0% undertrust, and 2204.5 ms median latency. This is a local
verification sample, not a pilot result.

Run again before final submission if any runtime files change:

```bash
npm run verify:final
```

Manual checks:

1. Run participant mode at `/task`.
2. Run researcher mode at `/task?debug=1`.
3. Force each condition.
4. Complete at least one full participant session.
5. Export JSON and CSV.
6. Confirm decision events preserve trust-calibration and cue metadata.
7. After HSF implementation, confirm HSF metadata appears in debug mode and exports.

Export QA details: `docs/export-qa-checklist.md`.

## Current Known Limitations

- Runtime events do not yet export explicit HSF fields such as `hsf_cue_condition_id`, `hsf_dimensions`, or `performance_condition`.
- Debug mode shows a non-exported draft HSF mapping and current-trial AI
  correctness, but approved HSF dimensions and a confirmed performance-condition
  factor are not yet runtime metadata.
- Manipulation-check UI and logging are specified but not implemented.
- Candidate trial additions are drafted but not approved runtime stimuli.
- A full internal pilot has not been run and documented in the repository.
- The final HSF condition structure is pending Andrea/research-team confirmation.

## Remaining Open Questions

- Which HSF dimensions are required for the immediate experiment?
- Should the next condition structure be full factorial, reduced factorial, or current cue-source conditions with HSF metadata?
- Should confidence be treated as communication, behavior, or a separate signal-strength factor?
- Should user-set agent configuration remain in the HSF pilot?
- Which manipulation-check items should be participant-facing?
- Who approves final stimuli before pilot use?

## Current Final Status

Current implementation summary:

- The app supports a controlled fixed-stimulus operations decision task.
- Participant flow, cue-source conditions, researcher debug mode, decision logging, JSON/CSV export, export validation, export summary, and documentation reference validation are in place.
- Current runtime cue conditions remain `control`, `industry_set`, and `user_set`.
- Current exports preserve trust-calibration fields and cue-source metadata, but do not claim final HSF runtime metadata.

Current verification summary:

- `npm run lint` passed.
- `tsc --noEmit` passed through `npm run verify:final`.
- `npm run check:docs` passed.
- `npm run build` passed after sandbox escalation.
- `npm run validate:export -- --file data/runs/local-dev/events.jsonl --full-session --expect-decision-count 10` passed.
- `npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only` passed.

Current demo path:

```bash
npm run dev
```

```text
http://localhost:3000/task?debug=1
```

Current known limitations:

- Explicit HSF metadata fields are specified but not runtime-exported.
- Manipulation-check UI and logging are specified but not implemented.
- Candidate trial additions are drafted but not approved runtime stimuli.
- A filled internal pilot note is not present.
- Final HSF condition structure remains a research decision.

Future work after research confirmation:

1. Confirm participant-facing format, priority HSF dimensions, condition structure, confidence role, manipulation-check placement, and stimulus approval process.
2. Implement approved HSF runtime metadata in cue config, trials, schema validation, export columns, and debug mode.
3. Approve the final stimulus matrix or reduced trial set.
4. Run and record an internal pilot using `docs/internal-pilot-notes.md`.
5. Update the final report and demo walkthrough from this current-state draft to match the confirmed runtime implementation.
